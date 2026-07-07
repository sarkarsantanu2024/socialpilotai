// Real in-app notifications, scoped to a center. Best-effort — never breaks the
// triggering action. Server-only.
import "server-only";
import { prisma } from "@/lib/db";

export interface NotifInput { title: string; body?: string; type?: string; href?: string }

export async function notify(tenantId: string, n: NotifInput) {
  try {
    await prisma.notification.create({
      data: { tenantId, title: n.title, body: n.body ?? null, type: n.type ?? "info", href: n.href ?? null },
    });
  } catch { /* ignore */ }
}

export async function notifyMany(tenantIds: string[], n: NotifInput) {
  if (!tenantIds.length) return;
  try {
    await prisma.notification.createMany({
      data: tenantIds.map((tenantId) => ({
        tenantId, title: n.title, body: n.body ?? null, type: n.type ?? "info", href: n.href ?? null,
      })),
    });
  } catch { /* ignore */ }
}

export async function listNotifications(tenantId: string, take = 25) {
  const rows = await prisma.notification.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map((r) => ({
    id: r.id, title: r.title, body: r.body, type: r.type, href: r.href, read: r.read,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function markRead(tenantId: string, ids?: string[]) {
  await prisma.notification.updateMany({
    where: { tenantId, ...(ids?.length ? { id: { in: ids } } : {}) },
    data: { read: true },
  });
}
