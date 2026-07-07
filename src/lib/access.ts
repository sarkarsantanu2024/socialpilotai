// Role-aware access resolution. Sits between the session (userId + activeCenter)
// and the data layer. Server-only.
//
//  • Super-admin (User.platformRole = "superadmin") → every organization & center.
//  • Org owner / HO (Membership.role = "owner")     → every center in that org.
//  • Center manager/staff (Membership.centerId set) → just that center.
import "server-only";
import { prisma, withDbRetry } from "@/lib/db";
import { getSession } from "@/lib/session";

export type Role = "superadmin" | "owner" | "manager" | "staff";

export interface CenterSummary {
  id: string;
  name: string; // business/center name
  city: string;
  type: string;
  orgId: string | null;
  orgName: string | null;
  role: Role; // the caller's role for THIS center
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function getCurrentUser() {
  const s = getSession();
  if (!s?.userId) return null;
  // Retry once or twice on a cold Neon connection so the very first request
  // after the DB wakes up doesn't error out.
  return withDbRetry(() =>
    prisma.user.findUnique({
      where: { id: s.userId },
      include: { memberships: true },
    })
  );
}

export function isSuperadmin(user: { platformRole: string }) {
  return user.platformRole === "superadmin";
}

/**
 * Every center this user may operate, each tagged with the caller's role.
 * Super-admins get all centers (capped) — the switcher provides search.
 */
export async function listAccessibleCenters(
  user: { id: string; platformRole: string; memberships: { role: string; organizationId: string; centerId: string | null }[] },
  opts: { search?: string; take?: number } = {}
): Promise<CenterSummary[]> {
  const take = opts.take ?? 500;
  const search = opts.search?.trim();
  const nameFilter = search
    ? { businessProfile: { is: { name: { contains: search, mode: "insensitive" as const } } } }
    : {};

  // Super-admin: all centers.
  const where = isSuperadmin(user)
    ? nameFilter
    : (() => {
        const ownerOrgIds = user.memberships.filter((m) => m.role === "owner").map((m) => m.organizationId);
        const directCenterIds = user.memberships.filter((m) => m.centerId).map((m) => m.centerId as string);
        return {
          AND: [
            nameFilter,
            { OR: [{ organizationId: { in: ownerOrgIds } }, { id: { in: directCenterIds } }] },
          ],
        };
      })();

  const centers = await prisma.tenant.findMany({
    where,
    include: { businessProfile: true, organization: true },
    take,
    orderBy: { createdAt: "asc" },
  });

  // Determine the caller's role per center.
  const roleFor = (centerId: string, orgId: string | null): Role => {
    if (isSuperadmin(user)) return "superadmin";
    const direct = user.memberships.find((m) => m.centerId === centerId);
    if (direct) return (direct.role as Role) ?? "manager";
    if (orgId && user.memberships.some((m) => m.role === "owner" && m.organizationId === orgId)) return "owner";
    return "manager";
  };

  return centers.map((c) => ({
    id: c.id,
    name: c.businessProfile?.name ?? c.name ?? "Untitled center",
    city: c.businessProfile?.city ?? "",
    type: c.businessProfile?.type ?? "coaching",
    orgId: c.organizationId,
    orgName: c.organization?.name ?? null,
    role: roleFor(c.id, c.organizationId),
  }));
}

/** Can this user operate the given center? */
export async function canAccessCenter(
  user: { id: string; platformRole: string; memberships: { role: string; organizationId: string; centerId: string | null }[] },
  centerId: string
): Promise<boolean> {
  // Super-admins can access any center that still EXISTS (guards against a stale
  // cookie pointing at a deleted center).
  if (isSuperadmin(user)) return !!(await prisma.tenant.findUnique({ where: { id: centerId }, select: { id: true } }));
  if (user.memberships.some((m) => m.centerId === centerId)) return true;
  const ownerOrgIds = user.memberships.filter((m) => m.role === "owner").map((m) => m.organizationId);
  if (!ownerOrgIds.length) return false;
  const center = await prisma.tenant.findUnique({ where: { id: centerId }, select: { organizationId: true } });
  return !!center?.organizationId && ownerOrgIds.includes(center.organizationId);
}

/**
 * Resolve the active center id from the session, validating access. Falls back
 * to the user's first accessible center. Returns null if they have none.
 */
export async function resolveActiveCenterId(
  user: { id: string; platformRole: string; memberships: { role: string; organizationId: string; centerId: string | null }[] }
): Promise<string | null> {
  const s = getSession();
  if (s?.centerId && (await canAccessCenter(user, s.centerId))) return s.centerId;
  const first = await firstAccessibleCenterId(user);
  return first;
}

export async function firstAccessibleCenterId(
  user: { id: string; platformRole: string; memberships: { role: string; organizationId: string; centerId: string | null }[] }
): Promise<string | null> {
  const centers = await listAccessibleCenters(user, { take: 1 });
  return centers[0]?.id ?? null;
}
