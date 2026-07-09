// Cross-center performance roll-up for an HO / super-admin: one row per center
// with real DB metrics (published posts, leads, FB status). Aggregated with
// groupBy so it's a handful of queries, not N-per-center.
import "server-only";
import { prisma } from "@/lib/db";
import { canAdminOrg, primaryOrgId } from "@/lib/org";

type MinUser = { id: string; platformRole: string; memberships: { role: string; organizationId: string; centerId: string | null }[] };

export async function getRollup(user: MinUser, orgId?: string) {
  const targetOrgId = orgId ?? primaryOrgId(user);
  if (!targetOrgId || !(await canAdminOrg(user, targetOrgId))) return null;

  const centers = await prisma.tenant.findMany({
    where: { organizationId: targetOrgId },
    include: { businessProfile: true },
    orderBy: { createdAt: "asc" },
  });
  const ids = centers.map((c) => c.id);
  if (!ids.length) return { centers: [], totals: { centers: 0, published: 0, leads: 0, connected: 0 } };

  const [pubRows, leadRows, connRows] = await Promise.all([
    prisma.post.groupBy({ by: ["tenantId"], where: { tenantId: { in: ids }, status: "published" }, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["tenantId"], where: { tenantId: { in: ids } }, _count: { _all: true } }),
    prisma.connectedPage.findMany({ where: { tenantId: { in: ids }, connected: true }, select: { tenantId: true } }),
  ]);
  const pub = Object.fromEntries(pubRows.map((r) => [r.tenantId, r._count._all]));
  const lds = Object.fromEntries(leadRows.map((r) => [r.tenantId, r._count._all]));
  const conn = new Set(connRows.map((r) => r.tenantId));

  const rows = centers.map((c) => ({
    id: c.id,
    name: c.businessProfile?.name ?? c.name ?? "Untitled center",
    city: c.businessProfile?.city ?? "",
    published: pub[c.id] ?? 0,
    leads: lds[c.id] ?? 0,
    connected: conn.has(c.id),
  }));

  return {
    centers: rows,
    totals: {
      centers: rows.length,
      published: rows.reduce((s, r) => s + r.published, 0),
      leads: rows.reduce((s, r) => s + r.leads, 0),
      connected: rows.filter((r) => r.connected).length,
    },
  };
}
