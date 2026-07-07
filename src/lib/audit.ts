// Append-only activity log. Audit failures must NEVER break the action being
// logged, so every write is best-effort. Server-only.
import "server-only";
import { prisma } from "@/lib/db";

export async function audit(entry: {
  organizationId?: string | null;
  centerId?: string | null;
  actorUserId?: string | null;
  actorName: string;
  action: string;
  detail?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: entry.organizationId ?? null,
        centerId: entry.centerId ?? null,
        actorUserId: entry.actorUserId ?? null,
        actorName: entry.actorName,
        action: entry.action,
        detail: entry.detail ?? null,
      },
    });
  } catch {
    /* ignore */
  }
}

export async function listAudit(organizationId: string, take = 60) {
  const rows = await prisma.auditLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map((r) => ({
    id: r.id,
    actorName: r.actorName,
    action: r.action,
    detail: r.detail,
    createdAt: r.createdAt.toISOString(),
  }));
}
