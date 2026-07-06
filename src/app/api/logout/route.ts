import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";
import { clearConnection } from "@/lib/fb/session";

// Clears the session server-side (the cookie is httpOnly, so client JS can't
// delete it) and drops the Facebook Page connection so logout fully signs out.
export async function POST() {
  clearSessionCookie();
  clearConnection();
  return NextResponse.json({ ok: true });
}
