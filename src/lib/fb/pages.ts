// Persist connected Facebook Pages (with ENCRYPTED tokens) to Postgres, so
// background jobs that have NO user session — the Lead Ads webhook and the
// scheduled-publish cron — can act on the right tenant's Page. Server-only.
import "server-only";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import type { FbPage } from "@/lib/fb/session";

// Replace the tenant's connected pages with the current set from OAuth.
export async function persistPages(tenantId: string, pages: FbPage[]) {
  await prisma.connectedPage.deleteMany({ where: { tenantId } });
  if (!pages.length) return;
  await prisma.connectedPage.createMany({
    data: pages.map((p) => ({
      tenantId,
      pageId: p.id,
      name: p.name,
      category: p.category ?? null,
      pageToken: encrypt(p.token),
      connected: true,
    })),
  });
}

export async function clearPages(tenantId: string) {
  await prisma.connectedPage.deleteMany({ where: { tenantId } });
}

// Background jobs: resolve owning tenant + decrypted Page token by FB page id.
export async function resolvePage(
  pageId: string
): Promise<{ tenantId: string; token: string; name: string } | null> {
  const row = await prisma.connectedPage.findFirst({ where: { pageId, connected: true } });
  if (!row) return null;
  const token = decrypt(row.pageToken);
  if (!token) return null;
  return { tenantId: row.tenantId, token, name: row.name };
}

// The tenant's active connected Page (first one), for cron publishing.
export async function tenantPage(
  tenantId: string
): Promise<{ pageId: string; token: string } | null> {
  const row = await prisma.connectedPage.findFirst({ where: { tenantId, connected: true } });
  if (!row) return null;
  const token = decrypt(row.pageToken);
  if (!token) return null;
  return { pageId: row.pageId, token };
}
