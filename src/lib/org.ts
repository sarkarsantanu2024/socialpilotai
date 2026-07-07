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

function centerData(orgId: string, name: string, type: BusinessType, city: string) {
  return {
    username: `center_${name.toLowerCase().replace(/\W+/g, "_")}_${crypto.randomBytes(3).toString("hex")}`,
    password: "",
    name,
    plan: "trial",
    planStatus: "active",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    organizationId: orgId,
    businessProfile: { create: { name, type, city, language: "English", tone: "Warm, friendly, professional", audience: "Local customers" } },
    brandKit: { create: { logoText: name.slice(0, 24), ...DEFAULT_KIT } },
  };
}

export async function createCenter(orgId: string, input: { name: string; type?: BusinessType; city?: string }) {
  const name = input.name.trim();
  if (!name) throw new Error("Center name is required.");
  return prisma.tenant.create({ data: centerData(orgId, name, (input.type ?? "coaching") as BusinessType, input.city?.trim() ?? "") });
}

/** Create many centers at once (bulk onboarding). Skips blank names. */
export async function bulkCreateCenters(orgId: string, items: { name: string; type?: BusinessType; city?: string }[]) {
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
    prisma.tenant.findMany({ where: { organizationId: targetOrgId }, include: { businessProfile: true, pages: true }, orderBy: { createdAt: "asc" } }),
    prisma.membership.findMany({ where: { organizationId: targetOrgId }, include: { user: true, center: { include: { businessProfile: true } } } }),
    prisma.invite.findMany({ where: { organizationId: targetOrgId, status: "pending" }, include: { center: { include: { businessProfile: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!org) return null;

  return {
    org,
    isSuperadmin: isSuperadmin(user),
    centers: centers.map((c) => ({
      id: c.id,
      name: c.businessProfile?.name ?? c.name ?? "Untitled center",
      city: c.businessProfile?.city ?? "",
      type: c.businessProfile?.type ?? "coaching",
      connected: c.pages.some((p) => p.connected),
    })),
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
