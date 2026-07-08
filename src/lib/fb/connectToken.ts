// Signed, stateless "connect this Page" token for a single center. Lets a branch
// owner (who has NO SocialPilot login) open a link and connect THEIR OWN Facebook
// Page to that center — no Business-Manager admin dance, no account. The token is
// HMAC-signed and short-lived; it's re-verified server-side in the OAuth callback,
// so nothing about the target center is ever trusted from client input.
import "server-only";
import crypto from "crypto";

const TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function secret() {
  return process.env.TOKEN_ENC_KEY || process.env.SESSION_SECRET || "sp-dev-secret-change-me";
}
function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(`connect:${payload}`).digest("base64url");
}

export function signConnectToken(centerId: string): string {
  const body = Buffer.from(JSON.stringify({ c: centerId, e: Date.now() + TTL_MS })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyConnectToken(token: string | null | undefined): { centerId: string } | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!p.c || !p.e || Date.now() > p.e) return null;
    return { centerId: p.c as string };
  } catch {
    return null;
  }
}
