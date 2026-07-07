import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

// Signs the user out (clears the httpOnly session cookie). The Facebook Page
// connection is NOT touched — it lives per-center in the DB and must persist
// across logins so the center stays connected.
export async function POST() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
