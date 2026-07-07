import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Clears an invalid/stale session cookie, then sends the user to /login. This
// breaks the redirect loop that a present-but-unresolvable cookie would cause
// (the Edge middleware can only check that a cookie exists, not that it's valid).
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
