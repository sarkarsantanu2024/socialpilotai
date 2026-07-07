// Background-job resolvers for connected Pages (the Lead Ads webhook and the
// scheduled-publish cron have NO user session, so they look the Page up by id /
// tenant directly). Writing the connection is handled by lib/fb/connection.ts.
// Server-only.
import "server-only";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

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

// The tenant's active connected Page, for cron publishing.
export async function tenantPage(
  tenantId: string
): Promise<{ pageId: string; token: string } | null> {
  const row = await prisma.connectedPage.findFirst({
    where: { tenantId, connected: true },
    orderBy: { isActive: "desc" },
  });
  if (!row) return null;
  const token = decrypt(row.pageToken);
  if (!token) return null;
  return { pageId: row.pageId, token };
}
