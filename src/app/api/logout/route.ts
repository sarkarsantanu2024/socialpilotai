import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { clearConnection } from "@/lib/fb/session";

// Clears the session server-side. Needed because the Facebook login flow sets
// sp_session as httpOnly, which client-side JS can't delete. Also drops the
// Facebook Page connection so logout fully signs out.
export async function POST() {
  cookies().delete(SESSION_COOKIE);
  clearConnection();
  return NextResponse.json({ ok: true });
}
