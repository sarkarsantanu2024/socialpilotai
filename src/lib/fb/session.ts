// Server-side store for the connected Facebook Page(s). For the demo we keep the
// (encrypted) page tokens in an httpOnly cookie; production moves these to the
// `connected_pages` table per the architecture. Page access tokens don't expire.
import { cookies } from "next/headers";
import { encrypt, decrypt } from "@/lib/crypto";

const COOKIE = "fb_conn";

export interface FbPage {
  id: string;
  name: string;
  token: string;
  category?: string;
  picture?: string; // page profile photo URL (used as the brand logo)
  city?: string; // page location city (drives profile + ad targeting)
}

export interface FbConnection {
  userName?: string;
  activePageId: string;
  pages: FbPage[];
  userToken?: string; // long-lived user token (Marketing API / ads_management)
  adAccountId?: string; // act_xxx, when an ad account is connected (premium)
}

export function getConnection(): FbConnection | null {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  const json = decrypt(raw);
  if (!json) return null;
  try {
    return JSON.parse(json) as FbConnection;
  } catch {
    return null;
  }
}

export function setConnection(conn: FbConnection) {
  cookies().set(COOKIE, encrypt(JSON.stringify(conn)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 days
  });
}

export function clearConnection() {
  cookies().delete(COOKIE);
}

export function activePage(conn: FbConnection | null): FbPage | null {
  if (!conn) return null;
  return conn.pages.find((p) => p.id === conn.activePageId) ?? conn.pages[0] ?? null;
}
