// Per-CENTER Facebook connection, stored in Postgres (tokens ENCRYPTED). This is
// the single source of truth for "which Page does this center publish to" — it
// replaces the old shared httpOnly cookie, so every center sees only ITS OWN
// connected Page, and the connection survives logout. Server-only.
//
// Reads default to the ACTIVE CENTER (getSessionTenantId()), so route handlers
// automatically operate on whatever center the user currently has selected.
import "server-only";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { getSessionTenantId } from "@/lib/session";

export interface FbPageData {
  id: string;
  name: string;
  token: string;
  category?: string;
  picture?: string;
  city?: string;
  igUserId?: string;
  igUsername?: string;
}

export interface FbConnectionData {
  userName?: string;
  userToken?: string; // decrypted
  adAccountId?: string;
  activePageId: string;
  pages: FbPageData[];
}

// A page fetched from OAuth, before persistence.
export interface FbPageInput {
  id: string;
  name: string;
  token: string;
  category?: string;
  picture?: string;
  city?: string;
  igUserId?: string;
  igUsername?: string;
}

async function tid(explicit?: string | null): Promise<string | null> {
  return explicit ?? getSessionTenantId();
}

// Which of the OAuth'd Pages should be ACTIVE for this center? Prefer the Page
// whose name matches the center's name, with extra weight on the center's LAST
// name token — in franchise naming ("MMA Barasat", "MMA Ramnagar") the location
// comes last and is the only token that tells branches apart. Falls back to the
// first Page. This is what stops "first page wins" from silently connecting the
// Ramnagar Page to the Barasat center when one FB account admins many branches.
export function bestPageMatch(pages: FbPageInput[], centerName: string): { index: number; score: number } {
  const tokenize = (s: string) =>
    s.toLowerCase().replace(/[!-/:-@[-`{-~]/g, " ").split(/\s+/).filter(Boolean);
  const target = tokenize(centerName);
  if (!pages.length || !target.length) return { index: 0, score: 0 };
  const locationToken = target[target.length - 1];
  let best = 0;
  let bestScore = 0;
  pages.forEach((p, i) => {
    const words = new Set(tokenize(p.name));
    let score = target.reduce((n, w) => n + (words.has(w) ? 1 : 0), 0);
    if (words.has(locationToken)) score += 3;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  return { index: best, score: bestScore };
}

function pickActivePage(pages: FbPageInput[], centerName: string): number {
  return pages.length < 2 ? 0 : bestPageMatch(pages, centerName).index;
}

/** The center's display name, for matching Pages against it. */
export async function centerDisplayName(tenantId: string): Promise<string> {
  const profile = await prisma.businessProfile.findUnique({ where: { tenantId } });
  if (profile?.name) return profile.name;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  return tenant?.name ?? "";
}

/**
 * Replace this center's connection with a fresh set from OAuth. The Page whose
 * name best matches the center becomes the active one (first Page as fallback).
 * Idempotent per center.
 *
 * `pending: true` stores the Pages WITHOUT connecting them (connected=false,
 * nothing active) — used when none of the OAuth'd Pages looks like this
 * center's Page, so the user must explicitly confirm before anything publishes.
 */
export async function persistConnection(
  tenantId: string,
  conn: { userName?: string; userToken?: string; adAccountId?: string; pages: FbPageInput[] },
  opts?: { pending?: boolean }
) {
  await prisma.fbConnection.upsert({
    where: { tenantId },
    create: {
      tenantId,
      userName: conn.userName ?? null,
      userToken: conn.userToken ? encrypt(conn.userToken) : null,
      adAccountId: conn.adAccountId ?? null,
    },
    update: {
      userName: conn.userName ?? null,
      userToken: conn.userToken ? encrypt(conn.userToken) : null,
      adAccountId: conn.adAccountId ?? null,
    },
  });

  await prisma.connectedPage.deleteMany({ where: { tenantId } });
  if (conn.pages.length) {
    const pending = !!opts?.pending;
    const activeIdx = pending ? -1 : pickActivePage(conn.pages, await centerDisplayName(tenantId));
    await prisma.connectedPage.createMany({
      data: conn.pages.map((p, i) => ({
        tenantId,
        pageId: p.id,
        name: p.name,
        category: p.category ?? null,
        picture: p.picture ?? null,
        city: p.city ?? null,
        igUserId: p.igUserId ?? null,
        igUsername: p.igUsername ?? null,
        pageToken: encrypt(p.token),
        connected: !pending,
        isActive: i === activeIdx,
      })),
    });
  }
}

/** The full connection for a center (defaults to the active center). */
export async function getConnection(tenantId?: string | null): Promise<FbConnectionData | null> {
  const id = await tid(tenantId);
  if (!id) return null;
  const [rows, meta] = await Promise.all([
    prisma.connectedPage.findMany({ where: { tenantId: id, connected: true }, orderBy: { isActive: "desc" } }),
    prisma.fbConnection.findUnique({ where: { tenantId: id } }),
  ]);
  if (!rows.length) return null;
  const pages: FbPageData[] = rows
    .map((r): FbPageData | null => {
      const token = decrypt(r.pageToken);
      if (!token) return null;
      return { id: r.pageId, name: r.name, token, category: r.category ?? undefined, picture: r.picture ?? undefined, city: r.city ?? undefined, igUserId: r.igUserId ?? undefined, igUsername: r.igUsername ?? undefined };
    })
    .filter((p): p is FbPageData => p !== null);
  if (!pages.length) return null;
  const active = rows.find((r) => r.isActive) ?? rows[0];
  return {
    userName: meta?.userName ?? undefined,
    userToken: meta?.userToken ? decrypt(meta.userToken) ?? undefined : undefined,
    adAccountId: meta?.adAccountId ?? undefined,
    activePageId: active.pageId,
    pages,
  };
}

/** The active Page (with decrypted token) for a center. */
export async function getActivePage(tenantId?: string | null): Promise<FbPageData | null> {
  const conn = await getConnection(tenantId);
  if (!conn) return null;
  return conn.pages.find((p) => p.id === conn.activePageId) ?? conn.pages[0] ?? null;
}

/** Choose which connected Page is active for this center. */
export async function setActivePage(tenantId: string, pageId: string): Promise<boolean> {
  const exists = await prisma.connectedPage.findFirst({ where: { tenantId, pageId } });
  if (!exists) return false;
  await prisma.$transaction([
    prisma.connectedPage.updateMany({ where: { tenantId }, data: { isActive: false } }),
    prisma.connectedPage.updateMany({ where: { tenantId, pageId }, data: { isActive: true } }),
  ]);
  return true;
}

/** Pages stored by a mismatched connect, awaiting the user's explicit decision. */
export async function pendingPages(tenantId?: string | null) {
  const id = await tid(tenantId);
  if (!id) return [];
  const rows = await prisma.connectedPage.findMany({ where: { tenantId: id, connected: false } });
  return rows.map((r) => ({ id: r.pageId, name: r.name, category: r.category, picture: r.picture }));
}

/** User confirmed "connect anyway": activate the pending pages, chosen one active. */
export async function activatePending(tenantId: string, pageId?: string): Promise<boolean> {
  const rows = await prisma.connectedPage.findMany({ where: { tenantId, connected: false } });
  if (!rows.length) return false;
  const chosen = rows.find((r) => r.pageId === pageId) ?? rows[0];
  await prisma.$transaction([
    prisma.connectedPage.updateMany({ where: { tenantId }, data: { connected: true, isActive: false } }),
    prisma.connectedPage.updateMany({ where: { tenantId, pageId: chosen.pageId }, data: { isActive: true } }),
  ]);
  return true;
}

/** User declined the mismatched connect: drop the pending pages (+ meta if orphaned). */
export async function discardPending(tenantId: string) {
  await prisma.connectedPage.deleteMany({ where: { tenantId, connected: false } });
  const remaining = await prisma.connectedPage.count({ where: { tenantId } });
  if (!remaining) await prisma.fbConnection.deleteMany({ where: { tenantId } });
}

/** Fully disconnect this center's Facebook (removes pages + connection meta). */
export async function disconnect(tenantId: string) {
  await prisma.$transaction([
    prisma.connectedPage.deleteMany({ where: { tenantId } }),
    prisma.fbConnection.deleteMany({ where: { tenantId } }),
  ]);
}
