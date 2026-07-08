// Organization management: create/bulk-create centers and invite people.
// Used by HO owners and super-admins. Server-only.
//
// Invites carry NO password — the recipient opens /invite/<token> and sets their
// own. Roles: owner (whole org / HO), manager (one center), staff (draft-only).
import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isSuperadmin } from "@/lib/access";
import { signConnectToken } from "@/lib/fb/connectToken";
import type { BusinessType } from "@/lib/types";

const DEFAULT_KIT = { primary: "#244fdb", secondary: "#0ea5e9", accent: "#f59e0b", font: "Poppins" };
const INVITE_TTL_DAYS = 14;

type MinUser = { id: string; platformRole: string; memberships: { role: string; organizationId: string; centerId: string | null }[] };

/** Orgs where this user is an owner (HO). Super-admins administer any org. */
export function ownedOrgIds(user: MinUser): string[] {
  return user.memberships.filter((m) => m.role === "owner").map((m) => m.organizationId);
}

/** The org this user administers by default (first owned org). */
export function primaryOrgId(user: MinUser): string | null {
  return ownedOrgIds(user)[0] ?? null;
}

export async function canAdminOrg(user: MinUser, orgId: string): Promise<boolean> {
  if (isSuperadmin(user)) return true;
  return ownedOrgIds(user).includes(orgId);
}

export interface CenterInput {
  name: string;
  type?: BusinessType;
  city?: string;
  ownerName?: string;
  whatsapp?: string;
  phone?: string;
  address?: string;
  locality?: string;
  email?: string;
  fbUrl?: string;
  logoUrl?: string; // the center's own logo (overrides the inherited HO logo)
}

// The HO default brand kit a new center inherits (nulls → global defaults).
type OrgBrandDefaults = { logoUrl?: string | null; logoText?: string | null; primary?: string | null; secondary?: string | null; accent?: string | null; font?: string | null };

function centerData(orgId: string, input: CenterInput, defaults?: OrgBrandDefaults | null) {
  const name = input.name.trim();
  const type = (input.type ?? "coaching") as BusinessType;
  return {
    username: `center_${name.toLowerCase().replace(/\W+/g, "_")}_${crypto.randomBytes(3).toString("hex")}`,
    password: "",
    name,
    plan: "trial",
    planStatus: "active",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    organizationId: orgId,
    businessProfile: {
      create: {
        name, type, city: input.city?.trim() ?? "",
        language: "English", tone: "Warm, friendly, professional", audience: "Local customers",
        ownerName: input.ownerName?.trim() || null,
        whatsapp: normalizeWhatsapp(input.whatsapp),
        phone: normalizeWhatsapp(input.phone),
        address: input.address?.trim() || null,
        locality: input.locality?.trim() || null,
        email: input.email?.trim().toLowerCase() || null,
        fbUrl: input.fbUrl?.trim() || null,
      },
    },
    // Center's own logo if given, else inherit the HO brand kit, else platform defaults.
    brandKit: {
      create: {
        logoText: defaults?.logoText || name.slice(0, 24),
        logoUrl: input.logoUrl || defaults?.logoUrl || null,
        primary: defaults?.primary || DEFAULT_KIT.primary,
        secondary: defaults?.secondary || DEFAULT_KIT.secondary,
        accent: defaults?.accent || DEFAULT_KIT.accent,
        font: defaults?.font || DEFAULT_KIT.font,
      },
    },
  };
}

/** Keep digits and a leading + so wa.me links work; empty → null. */
export function normalizeWhatsapp(raw?: string): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  return cleaned.length >= 8 ? cleaned : null;
}

export async function createCenter(orgId: string, input: CenterInput) {
  if (!input.name?.trim()) throw new Error("Center name is required.");
  const defaults = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { logoUrl: true, logoText: true, primary: true, secondary: true, accent: true, font: true },
  });
  return prisma.tenant.create({ data: centerData(orgId, input, defaults) });
}

/** Edit an existing center's details + logo. Owner/HO, super-admin, or that center's own manager. */
export async function updateCenter(user: MinUser, centerId: string, input: CenterInput) {
  const center = await prisma.tenant.findUnique({ where: { id: centerId }, select: { organizationId: true } });
  if (!center?.organizationId) throw new Error("Center not found.");
  const canOrg = await canAdminOrg(user, center.organizationId);
  const isOwnManager = user.memberships.some((m) => m.centerId === centerId);
  if (!canOrg && !isOwnManager) throw new Error("You can't edit this center.");

  const profile: Record<string, unknown> = {};
  if (typeof input.name === "string" && input.name.trim()) profile.name = input.name.trim();
  if (typeof input.type === "string") profile.type = input.type;
  if (typeof input.city === "string") profile.city = input.city.trim();
  if (typeof input.ownerName === "string") profile.ownerName = input.ownerName.trim() || null;
  if (typeof input.whatsapp === "string") profile.whatsapp = normalizeWhatsapp(input.whatsapp);
  if (typeof input.phone === "string") profile.phone = normalizeWhatsapp(input.phone);
  if (typeof input.address === "string") profile.address = input.address.trim() || null;
  if (typeof input.locality === "string") profile.locality = input.locality.trim() || null;
  if (typeof input.email === "string") profile.email = input.email.trim().toLowerCase() || null;
  if (typeof input.fbUrl === "string") profile.fbUrl = input.fbUrl.trim() || null;
  if (Object.keys(profile).length) await prisma.businessProfile.updateMany({ where: { tenantId: centerId }, data: profile });

  // Logo: undefined = leave as-is; "" / null = clear; a value = set.
  if (input.logoUrl !== undefined) {
    await prisma.brandKit.updateMany({ where: { tenantId: centerId }, data: { logoUrl: input.logoUrl || null } });
  }
  return { ok: true };
}

export interface OrgSettingsInput {
  name?: string;
  logoUrl?: string | null;
  logoText?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  font?: string;
}

/** Edit head-office identity (org name) + default brand kit. Owner/HO or super-admin. */
export async function updateOrgSettings(user: MinUser, orgId: string, input: OrgSettingsInput) {
  if (!(await canAdminOrg(user, orgId))) throw new Error("You can't edit this organization.");
  const data: Record<string, unknown> = {};
  if (typeof input.name === "string" && input.name.trim()) data.name = input.name.trim();
  if ("logoUrl" in input) data.logoUrl = input.logoUrl || null;
  for (const k of ["logoText", "primary", "secondary", "accent", "font"] as const) {
    if (typeof input[k] === "string") data[k] = input[k] || null;
  }
  if (Object.keys(data).length) await prisma.organization.update({ where: { id: orgId }, data });
  return { ok: true };
}

/**
 * Push the head-office brand kit onto EVERY center in the org, overriding each
 * center's own kit. Use when HO wants one consistent brand across all branches.
 */
export async function applyOrgBrandToAllCenters(user: MinUser, orgId: string): Promise<{ count: number }> {
  if (!(await canAdminOrg(user, orgId))) throw new Error("You can't edit this organization.");
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { logoUrl: true, logoText: true, primary: true, secondary: true, accent: true, font: true },
  });
  if (!org) throw new Error("Organization not found.");

  const centers = await prisma.tenant.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } });
  for (const c of centers) {
    await prisma.brandKit.updateMany({
      where: { tenantId: c.id },
      data: {
        logoUrl: org.logoUrl ?? null,
        logoText: org.logoText || (c.name ?? "Brand").slice(0, 24),
        primary: org.primary || DEFAULT_KIT.primary,
        secondary: org.secondary || DEFAULT_KIT.secondary,
        accent: org.accent || DEFAULT_KIT.accent,
        font: org.font || DEFAULT_KIT.font,
      },
    });
  }
  return { count: centers.length };
}

/**
 * Permanently remove a center and everything scoped to it (profile, brand kit,
 * posts, analytics, leads, FB connection, memberships, invites — all cascade via
 * the schema). Notifications have no FK, so they're cleared explicitly.
 * Only the org's owner/HO or a super-admin may delete a center.
 */
export async function deleteCenter(user: MinUser, centerId: string): Promise<{ name: string }> {
  const center = await prisma.tenant.findUnique({ where: { id: centerId }, include: { businessProfile: true } });
  if (!center) throw new Error("Center not found.");
  if (!center.organizationId || !(await canAdminOrg(user, center.organizationId))) {
    throw new Error("You can't remove this center.");
  }
  const name = center.businessProfile?.name ?? center.name ?? "center";
  await prisma.notification.deleteMany({ where: { tenantId: centerId } });
  await prisma.tenant.delete({ where: { id: centerId } });
  return { name };
}

/** Create many centers at once (bulk onboarding / CSV import). Skips blank names. */
export async function bulkCreateCenters(orgId: string, items: CenterInput[]) {
  let created = 0;
  for (const it of items) {
    if (!it.name?.trim()) continue;
    await createCenter(orgId, it);
    created++;
  }
  return { created };
}

function newToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export async function createInvite(
  user: MinUser,
  input: { orgId?: string; role: "owner" | "manager" | "staff"; centerId?: string; email?: string }
) {
  const orgId = input.orgId ?? primaryOrgId(user);
  if (!orgId) throw new Error("No organization to invite into.");
  if (!(await canAdminOrg(user, orgId))) throw new Error("You can't invite into this organization.");
  if ((input.role === "manager" || input.role === "staff")) {
    if (!input.centerId) throw new Error("Pick a center for a manager/staff invite.");
    const center = await prisma.tenant.findFirst({ where: { id: input.centerId, organizationId: orgId } });
    if (!center) throw new Error("That center isn't in this organization.");
  }
  // Only super-admins can mint new org owners.
  if (input.role === "owner" && !isSuperadmin(user)) throw new Error("Only a platform admin can invite an organization owner.");

  return prisma.invite.create({
    data: {
      token: newToken(),
      organizationId: orgId,
      role: input.role,
      centerId: input.role === "owner" ? null : input.centerId ?? null,
      email: input.email?.trim().toLowerCase() || null,
      invitedByUserId: user.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
}

export async function getInviteByToken(token: string) {
  const inv = await prisma.invite.findUnique({
    where: { token },
    include: { organization: true, center: { include: { businessProfile: true } } },
  });
  if (!inv || inv.status !== "pending") return null;
  if (inv.expiresAt && inv.expiresAt < new Date()) return null;
  return inv;
}

/** Accept an invite: create the User + Membership. Returns session targets. */
export async function acceptInvite(
  token: string,
  input: { username: string; password: string; name?: string }
): Promise<{ userId: string; centerId: string | null }> {
  const inv = await getInviteByToken(token);
  if (!inv) throw new Error("This invite is invalid or has expired.");

  const username = input.username.trim().toLowerCase();
  if (!username || username.length < 3) throw new Error("A username of at least 3 characters is required.");
  if (!/^[a-z0-9_.]+$/.test(username)) throw new Error("Username can only contain letters, numbers, dots and underscores.");
  if (!input.password || input.password.length < 8) throw new Error("A password of at least 8 characters is required.");
  if (await prisma.user.findUnique({ where: { username } })) throw new Error("That username is already taken.");

  const user = await prisma.user.create({
    data: {
      username,
      email: inv.email,
      password: await bcrypt.hash(input.password, 10),
      name: input.name?.trim() || null,
      memberships: {
        create: { organizationId: inv.organizationId, role: inv.role, centerId: inv.centerId ?? null },
      },
    },
  });
  await prisma.invite.update({ where: { id: inv.id }, data: { status: "accepted", acceptedAt: new Date() } });

  // Land on the invited center, else the org's first center.
  let centerId = inv.centerId;
  if (!centerId) {
    const first = await prisma.tenant.findFirst({ where: { organizationId: inv.organizationId }, orderBy: { createdAt: "asc" } });
    centerId = first?.id ?? null;
  }
  return { userId: user.id, centerId };
}

export async function revokeInvite(user: MinUser, inviteId: string) {
  const inv = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!inv) return;
  if (!(await canAdminOrg(user, inv.organizationId))) throw new Error("Not allowed.");
  await prisma.invite.update({ where: { id: inviteId }, data: { status: "revoked" } });
}

/** Full management view for the org this user administers. */
export async function getOrgOverview(user: MinUser, orgId?: string) {
  const targetOrgId = orgId ?? primaryOrgId(user) ?? null;
  if (!targetOrgId || !(await canAdminOrg(user, targetOrgId))) return null;

  const [org, centers, memberships, invites] = await Promise.all([
    prisma.organization.findUnique({ where: { id: targetOrgId } }),
    prisma.tenant.findMany({ where: { organizationId: targetOrgId }, include: { businessProfile: true, brandKit: true, pages: true }, orderBy: { createdAt: "asc" } }),
    prisma.membership.findMany({ where: { organizationId: targetOrgId }, include: { user: true, center: { include: { businessProfile: true } } } }),
    prisma.invite.findMany({ where: { organizationId: targetOrgId, status: "pending" }, include: { center: { include: { businessProfile: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!org) return null;

  // The head-office effective brand kit — a center "uses HO brand" when its kit
  // matches this (logo text is excluded — it's naturally per-center).
  const hoKit = {
    primary: org.primary || DEFAULT_KIT.primary,
    secondary: org.secondary || DEFAULT_KIT.secondary,
    accent: org.accent || DEFAULT_KIT.accent,
    font: org.font || DEFAULT_KIT.font,
    logoUrl: org.logoUrl ?? null,
  };

  return {
    org: {
      id: org.id,
      name: org.name,
      logoUrl: org.logoUrl,
      logoText: org.logoText,
      primary: org.primary,
      secondary: org.secondary,
      accent: org.accent,
      font: org.font,
    },
    isSuperadmin: isSuperadmin(user),
    centers: centers.map((c) => {
      const activePage = c.pages.find((p) => p.connected && p.isActive) ?? c.pages.find((p) => p.connected) ?? null;
      const bk = c.brandKit;
      const usesHoBrand = !!bk
        && bk.primary === hoKit.primary
        && bk.secondary === hoKit.secondary
        && bk.accent === hoKit.accent
        && bk.font === hoKit.font
        && (bk.logoUrl ?? null) === hoKit.logoUrl;
      return {
        id: c.id,
        name: c.businessProfile?.name ?? c.name ?? "Untitled center",
        city: c.businessProfile?.city ?? "",
        type: c.businessProfile?.type ?? "coaching",
        connected: c.pages.some((p) => p.connected),
        pageName: activePage?.name ?? null,
        connectToken: signConnectToken(c.id), // for the shareable "connect your Page" link
        usesHoBrand,
        logoUrl: c.brandKit?.logoUrl ?? null,
        ownerName: c.businessProfile?.ownerName ?? null,
        whatsapp: c.businessProfile?.whatsapp ?? null,
        phone: c.businessProfile?.phone ?? null,
        email: c.businessProfile?.email ?? null,
        locality: c.businessProfile?.locality ?? null,
        address: c.businessProfile?.address ?? null,
        fbUrl: c.businessProfile?.fbUrl ?? null,
      };
    }),
    members: memberships.map((m) => ({
      id: m.id,
      role: m.role,
      userName: m.user.name ?? m.user.username,
      username: m.user.username,
      centerName: m.center?.businessProfile?.name ?? null,
    })),
    invites: invites.map((i) => ({
      id: i.id,
      token: i.token,
      role: i.role,
      email: i.email,
      centerName: i.center?.businessProfile?.name ?? null,
      createdAt: i.createdAt.toISOString(),
    })),
  };
}
