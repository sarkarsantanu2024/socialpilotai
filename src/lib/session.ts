// Real server session. A signed (HMAC-SHA256) cookie carries the tenant id and
// an expiry — stateless, tamper-proof, no session table needed. Server-only.
import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";

export const SESSION_COOKIE = "sp_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  return process.env.TOKEN_ENC_KEY || process.env.SESSION_SECRET || "sp-dev-secret-change-me";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createToken(tenantId: string): string {
  const body = Buffer.from(
    JSON.stringify({ t: tenantId, e: Date.now() + MAX_AGE * 1000 })
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readToken(token?: string | null): string | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  // constant-time compare
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  )
    return null;
  try {
    const { t, e } = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!t || !e || Date.now() > e) return null;
    return t as string;
  } catch {
    return null;
  }
}

export function setSessionCookie(tenantId: string) {
  cookies().set(SESSION_COOKIE, createToken(tenantId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export function getSessionTenantId(): string | null {
  return readToken(cookies().get(SESSION_COOKIE)?.value);
}
