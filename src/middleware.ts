import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cookie name kept in sync with src/lib/session.ts. We only check PRESENCE here
// (Edge runtime can't run the Node HMAC verify) — every server page/route then
// verifies the signature via getCurrentTenant/getSessionTenantId. A forged
// cookie passes the middleware but is rejected at the data layer.
const SESSION_COOKIE = "sp_session";

// Public routes anyone can reach without a session.
const PUBLIC_PATHS = ["/", "/login", "/signup", "/privacy", "/terms"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const authed = !!token && token.includes(".");
  // Invite links and Facebook connect links are public — the recipient (a branch
  // owner) has no account yet.
  const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/invite/") || pathname.startsWith("/connect/");

  // Gate the app routes behind login.
  if (!authed && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Logged-in users shouldn't see the auth screens.
  if (authed && (pathname === "/login" || pathname === "/signup")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals, API routes and static files.
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
