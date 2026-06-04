// AES-256-GCM helpers for encrypting Facebook tokens at rest (in the session
// cookie now; in the `connected_pages`/`ad_accounts` tables in production).
// Key comes from TOKEN_ENC_KEY (32-byte hex). Falls back to a derived dev key
// with a warning so local dev works without setup — DO NOT rely on that in prod.
import crypto from "crypto";

function key(): Buffer {
  const hex = process.env.TOKEN_ENC_KEY;
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) return Buffer.from(hex, "hex");
  if (process.env.NODE_ENV === "production") {
    // Surface misconfiguration loudly rather than silently using a weak key.
    console.warn("[crypto] TOKEN_ENC_KEY missing/invalid — using a derived dev key. Set a 32-byte hex key in production.");
  }
  return crypto.scryptSync("socialpilot-dev-key", "socialpilot-salt", 32);
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv.tag.ciphertext, base64url so it's cookie-safe
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function decrypt(payload: string): string | null {
  try {
    const [ivB, tagB, dataB] = payload.split(".");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(dataB, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
