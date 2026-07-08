// Encodes the small bit of context we round-trip through Facebook's OAuth `state`
// param: whether premium scopes were requested, and where to land afterwards.
// Server-only. `state` comes back from Facebook verbatim, so returnTo is always
// re-sanitized on decode to prevent open redirects.
import "server-only";

/** Only allow internal absolute paths — block open redirects & protocol-relative URLs. */
export function sanitizeReturnTo(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("://") || value.includes("\\")) return null;
  return value;
}

export function encodeOAuthState(data: { premium: boolean; returnTo: string | null; connect?: string | null }): string {
  const json = JSON.stringify({
    p: data.premium ? 1 : 0,
    r: sanitizeReturnTo(data.returnTo) ?? undefined,
    c: data.connect || undefined, // signed per-center connect token (re-verified server-side)
  });
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeOAuthState(state: string | null): { premium: boolean; returnTo: string | null; connect: string | null } {
  if (!state) return { premium: false, returnTo: null, connect: null };
  // New format: base64url-encoded JSON.
  try {
    const o = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    if (o && typeof o === "object") {
      return { premium: o.p === 1 || o.p === true, returnTo: sanitizeReturnTo(o.r), connect: typeof o.c === "string" ? o.c : null };
    }
  } catch {
    /* fall through to the legacy plain-string form */
  }
  // Legacy: state was just "premium" / "core".
  return { premium: state === "premium", returnTo: null, connect: null };
}
