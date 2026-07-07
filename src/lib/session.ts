// Real server session. A signed (HMAC-SHA256) cookie carries the logged-in
// USER id and the ACTIVE CENTER id (+ expiry) — stateless, tamper-proof, no
// session table. A user may have access to many centers (super-admin / HO);
// the active center is what every page renders. Server-only.
import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";

export const SESSION_COOKIE = "sp_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface Session {
  userId: string;
  centerId: string | null; // active center (a Tenant id)
}

function secret() {
  return process.env.TOKEN_ENC_KEY || process.env.SESSION_SECRET || "sp-dev-secret-change-me";
}
function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createToken(session: Session): string {
  const body = Buffer.from(
    JSON.stringify({ u: session.userId, c: session.centerId, e: Date.now() + MAX_AGE * 1000 })
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readSession(token?: string | null): Session | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!p.e || Date.now() > p.e) return null;
    // New token shape { u: userId, c: activeCenterId }. Pre-Phase-1 tokens were
    // { t: tenantId } — those are no longer valid (a tenantId is not a userId),
    // so we reject them and force a clean re-login.
    if (p.u) return { userId: p.u as string, centerId: (p.c ?? null) as string | null };
    return null;
  } catch {
    return null;
  }
}

function write(session: Session) {
  cookies().set(SESSION_COOKIE, createToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Start a session for a user, with an optional active center. */
export function setSession(userId: string, centerId: string | null) {
  write({ userId, centerId });
}

/** Change only the active center, keeping the same user. No-op if not logged in. */
export function setActiveCenter(centerId: string) {
  const s = getSession();
  if (!s) return;
  write({ userId: s.userId, centerId });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export function getSession(): Session | null {
  return readSession(cookies().get(SESSION_COOKIE)?.value);
}

export function getSessionUserId(): string | null {
  return getSession()?.userId ?? null;
}

/**
 * The active center id — kept as the historical name so all existing callers
 * (clientData, api routes, fb callback) continue to work unchanged.
 */
export function getSessionTenantId(): string | null {
  return getSession()?.centerId ?? null;
}
