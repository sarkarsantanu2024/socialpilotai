// Platform super-admin data: overview counts + every organization. Server-only.
import "server-only";
import { prisma } from "@/lib/db";

export async function platformOverview() {
  const [orgs, centers, users, pendingPayments] = await Promise.all([
    prisma.organization.count(),
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.paymentRequest.count({ where: { status: "pending" } }),
  ]);

  const orgList = await prisma.organization.findMany({
    include: { _count: { select: { centers: true, memberships: true } }, centers: { take: 1, select: { id: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return {
    counts: { orgs, centers, users, pendingPayments },
    orgs: orgList.map((o) => ({
      id: o.id,
      name: o.name,
      plan: o.plan,
      centers: o._count.centers,
      members: o._count.memberships,
      firstCenterId: o.centers[0]?.id ?? null,
      createdAt: o.createdAt.toISOString(),
    })),
  };
}
