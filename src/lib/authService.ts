// Account creation + login against the real Postgres (Neon) database.
// Passwords are hashed with bcrypt. Server-only.
//
// Model: a User logs in. A User has Memberships that grant a role over an
// Organization (owner/HO) or a single Center (manager/staff). A brand-new
// self-signup creates: User + Organization + first Center (Tenant) + owner
// Membership. Legacy accounts (rows that only exist in the old Tenant table)
// are migrated on first login (self-healing) so nobody is locked out.
import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { BusinessType } from "@/lib/types";
import type { Prisma } from "@prisma/client";

const DEFAULT_KIT = {
  primary: "#244fdb",
  secondary: "#0ea5e9",
  accent: "#f59e0b",
  font: "Poppins",
};

// Usernames that should be platform super-admins (comma-separated env var).
function superadminUsernames(): string[] {
  return (process.env.SUPERADMIN_USERNAMES ?? "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}
function roleForUsername(username: string): "superadmin" | "none" {
  return superadminUsernames().includes(username.toLowerCase()) ? "superadmin" : "none";
}

export interface SignupInput {
  name: string;
  business: string;
  username: string;
  email?: string;
  password: string;
  type?: BusinessType;
  city?: string;
}

function validate(username: string, password: string) {
  if (!username || username.length < 3) throw new Error("A username of at least 3 characters is required.");
  if (!password || password.length < 8) throw new Error("A password of at least 8 characters is required.");
  if (!/^[a-z0-9_.]+$/.test(username)) throw new Error("Username can only contain letters, numbers, dots and underscores.");
}

// The data needed to create one center (Tenant) with its profile + brand kit.
function centerCreateData(business: string, type: BusinessType, city: string): Prisma.TenantCreateWithoutOrganizationInput {
  return {
    // Keep the legacy Tenant credential columns populated for back-compat, but
    // auth now runs through User. A random-ish placeholder avoids unique clashes.
    username: `center_${Math.abs(hash(business + city + type))}_${Date.now().toString(36)}`,
    password: "",
    name: business,
    plan: "trial",
    planStatus: "active",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    businessProfile: {
      create: {
        name: business, type, city,
        language: "English", tone: "Warm, friendly, professional", audience: "Local customers",
      },
    },
    brandKit: { create: { logoText: business.slice(0, 24), ...DEFAULT_KIT } },
  };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/**
 * Self-signup. A normal user becomes the OWNER of a new single-center org.
 * A platform SUPER-ADMIN (username in SUPERADMIN_USERNAMES) is a pure platform
 * role — no org/center is created; they oversee every customer org instead.
 * Returns the ids needed to start a session (centerId null for super-admins).
 */
export async function createAccount(input: SignupInput): Promise<{ userId: string; centerId: string | null }> {
  const username = input.username.trim().toLowerCase();
  const email = input.email?.trim().toLowerCase() || null;
  validate(username, input.password);

  if (await prisma.user.findUnique({ where: { username } })) throw new Error("That username is already taken.");
  if (email && (await prisma.user.findUnique({ where: { email } }))) throw new Error("An account with this email already exists.");

  const password = await bcrypt.hash(input.password, 10);
  const business = (input.business || input.name || "My Business").trim();
  const type = (input.type ?? "coaching") as BusinessType;
  const city = input.city ?? "";

  // Pure platform super-admin: just the User, no org/center/membership.
  if (roleForUsername(username) === "superadmin") {
    const user = await prisma.user.create({
      data: { username, email, password, name: input.name?.trim() || username, platformRole: "superadmin" },
    });
    return { userId: user.id, centerId: null };
  }

  const org = await prisma.organization.create({
    data: {
      name: business,
      vertical: type,
      centers: { create: centerCreateData(business, type, city) },
      memberships: {}, // added below once we have the user
    },
    include: { centers: true },
  });
  const centerId = org.centers[0].id;

  const user = await prisma.user.create({
    data: {
      username, email, password,
      name: input.name?.trim() || business,
      platformRole: roleForUsername(username),
      memberships: { create: { organizationId: org.id, role: "owner" } }, // HO of their own org
    },
  });

  return { userId: user.id, centerId };
}

/**
 * Verify credentials and return the User (with memberships). On success for a
 * user that has no memberships yet, and for legacy Tenant-only accounts, it
 * heals the data so the session can resolve a center.
 */
export async function verifyLogin(username: string, password: string) {
  const id = username.trim().toLowerCase();

  // 1) Normal path: a real User.
  const user = await prisma.user.findFirst({ where: { OR: [{ username: id }, { email: id }] } });
  if (user) {
    if (!(await bcrypt.compare(password, user.password))) return null;
    await ensureSuperadmin(user.id, user.username);
    return prisma.user.findUnique({ where: { id: user.id }, include: { memberships: true } });
  }

  // 2) Legacy path: an old Tenant row that predates the User table. Migrate it.
  const legacy = await prisma.tenant.findFirst({
    where: { OR: [{ username: id }, { email: id }] },
    include: { businessProfile: true },
  });
  if (!legacy || !legacy.password) return null;
  if (!(await bcrypt.compare(password, legacy.password))) return null;

  const migratedUserId = await migrateLegacyTenant(legacy.id, {
    username: legacy.username, email: legacy.email, password: legacy.password, name: legacy.name,
  });
  return prisma.user.findUnique({ where: { id: migratedUserId }, include: { memberships: true } });
}

async function ensureSuperadmin(userId: string, username: string) {
  if (roleForUsername(username) === "superadmin") {
    await prisma.user.update({ where: { id: userId }, data: { platformRole: "superadmin" } }).catch(() => {});
  }
}

/**
 * Turn a standalone legacy Tenant into: an Organization wrapping it + a User
 * (copying the tenant's credentials) + an owner Membership. Idempotent.
 */
export async function migrateLegacyTenant(
  centerId: string,
  cred: { username: string; email: string | null; password: string; name: string | null }
): Promise<string> {
  const center = await prisma.tenant.findUnique({ where: { id: centerId }, include: { businessProfile: true } });
  if (!center) throw new Error("Center not found.");

  // Ensure an org wraps this center.
  let orgId = center.organizationId;
  if (!orgId) {
    const org = await prisma.organization.create({
      data: { name: center.businessProfile?.name ?? center.name ?? "My Business", vertical: center.businessProfile?.type },
    });
    orgId = org.id;
    await prisma.tenant.update({ where: { id: centerId }, data: { organizationId: orgId } });
  }

  // Ensure a user exists for these credentials.
  const uname = cred.username.trim().toLowerCase();
  let user = await prisma.user.findUnique({ where: { username: uname } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: uname,
        email: cred.email?.toLowerCase() || null,
        password: cred.password, // already a bcrypt hash
        name: cred.name,
        platformRole: roleForUsername(uname),
      },
    });
  }

  // Ensure an owner membership on the org.
  const existing = await prisma.membership.findFirst({ where: { userId: user.id, organizationId: orgId, role: "owner" } });
  if (!existing) {
    await prisma.membership.create({ data: { userId: user.id, organizationId: orgId, role: "owner" } });
  }
  return user.id;
}
