// Manual UPI/QR billing (no gateway). Owner requests an upgrade → pays via UPI →
// a super-admin activates the plan. Server-only.
import "server-only";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { canAdminOrg, primaryOrgId } from "@/lib/org";
import { isSuperadmin } from "@/lib/access";
import { audit } from "@/lib/audit";

type MinUser = { id: string; username: string; name: string | null; platformRole: string; memberships: { role: string; organizationId: string; centerId: string | null }[] };

export async function orgBilling(orgId: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const pending = await prisma.paymentRequest.findFirst({ where: { organizationId: orgId, status: "pending" }, orderBy: { createdAt: "desc" } });
  return {
    plan: org?.plan ?? "trial",
    planStatus: org?.planStatus ?? "active",
    planRenewsAt: org?.planRenewsAt?.toISOString() ?? null,
    pending: pending ? { id: pending.id, plan: pending.plan, amount: pending.amount, createdAt: pending.createdAt.toISOString() } : null,
  };
}

export async function createPaymentRequest(user: MinUser, input: { plan: string; upiRef?: string; orgId?: string }) {
  const plan = getPlan(input.plan);
  if (!plan) throw new Error("Unknown plan.");
  const orgId = input.orgId ?? primaryOrgId(user);
  if (!orgId) throw new Error("No organization to bill.");
  if (!(await canAdminOrg(user, orgId))) throw new Error("Only an owner/HO can manage billing.");

  const req = await prisma.paymentRequest.create({
    data: {
      organizationId: orgId, plan: plan.id, amount: plan.price,
      upiRef: input.upiRef?.trim() || null, requestedByUserId: user.id, status: "pending",
    },
  });
  await audit({ organizationId: orgId, actorUserId: user.id, actorName: user.name ?? user.username, action: "plan.request", detail: `Requested ${plan.name} (₹${plan.price}) via UPI` });
  return req;
}

/** All pending payment requests across every org — for the super-admin console. */
export async function listAllPending(user: MinUser) {
  if (!isSuperadmin(user)) return [];
  const reqs = await prisma.paymentRequest.findMany({
    where: { status: "pending" },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  return reqs.map((r) => ({
    id: r.id, plan: r.plan, amount: r.amount, upiRef: r.upiRef,
    orgName: r.organization.name, createdAt: r.createdAt.toISOString(),
  }));
}

/** Super-admin activates or rejects a request. Activation sets the org's plan. */
export async function decideRequest(user: MinUser, input: { id: string; action: "activate" | "reject" }) {
  if (!isSuperadmin(user)) throw new Error("Only a platform admin can decide payments.");
  const req = await prisma.paymentRequest.findUnique({ where: { id: input.id } });
  if (!req || req.status !== "pending") throw new Error("Request not found or already decided.");

  if (input.action === "activate") {
    const renews = new Date();
    renews.setMonth(renews.getMonth() + 1);
    await prisma.organization.update({ where: { id: req.organizationId }, data: { plan: req.plan, planStatus: "active", planRenewsAt: renews } });
    await prisma.paymentRequest.update({ where: { id: req.id }, data: { status: "activated", decidedAt: new Date(), decidedByUserId: user.id } });
    await audit({ organizationId: req.organizationId, actorUserId: user.id, actorName: user.name ?? user.username, action: "plan.activate", detail: `Activated ${req.plan} plan (₹${req.amount})` });
  } else {
    await prisma.paymentRequest.update({ where: { id: req.id }, data: { status: "rejected", decidedAt: new Date(), decidedByUserId: user.id } });
    await audit({ organizationId: req.organizationId, actorUserId: user.id, actorName: user.name ?? user.username, action: "plan.reject", detail: `Rejected a ${req.plan} payment` });
  }
  return { ok: true };
}

/** The plan of the org that owns a given center (for feature gating). */
export async function planForCenter(centerId: string): Promise<string> {
  const c = await prisma.tenant.findUnique({ where: { id: centerId }, select: { organization: { select: { plan: true } } } });
  return c?.organization?.plan ?? "trial";
}
