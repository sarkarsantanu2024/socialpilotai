import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FB_GRAPH_VERSION, fbAppConfigured, fbRedirectUri } from "@/lib/config";
import { setConnection, type FbPage } from "@/lib/fb/session";
import { rememberPageToken } from "@/lib/fb/store";
import { SESSION_COOKIE } from "@/lib/auth";

const GRAPH = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;

// Step 2 of OAuth: exchange the code for tokens, fetch the user's Pages (each
// with its own non-expiring Page access token), and store them encrypted.
// On success we also start the app SESSION — so "Continue with Facebook" both
// connects the Page AND logs the user in.
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const loggedIn = cookies().get(SESSION_COOKIE)?.value === "1";
  // Failures: show the message where the user can see it (login if signed out).
  const fail = (q: string) => NextResponse.redirect(new URL(`${loggedIn ? "/settings" : "/login"}?fb=${q}`, origin));

  if (!fbAppConfigured()) return NextResponse.redirect(new URL("/login?fb=not_configured", origin));

  const code = new URL(req.url).searchParams.get("code");
  const error = new URL(req.url).searchParams.get("error");
  if (error || !code) return fail("denied");

  try {
    // a) code → short-lived user token
    const tokenRes = await fetch(
      `${GRAPH}/oauth/access_token?` +
        new URLSearchParams({
          client_id: process.env.FB_APP_ID!,
          client_secret: process.env.FB_APP_SECRET!,
          redirect_uri: fbRedirectUri(),
          code,
        }),
      { cache: "no-store" }
    );
    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) return fail("token_failed");

    // b) short-lived → long-lived user token (~60 days)
    const longRes = await fetch(
      `${GRAPH}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: process.env.FB_APP_ID!,
          client_secret: process.env.FB_APP_SECRET!,
          fb_exchange_token: tokenJson.access_token,
        }),
      { cache: "no-store" }
    );
    const longJson = await longRes.json();
    const userToken = longJson.access_token ?? tokenJson.access_token;

    // c) who am I + the Pages I manage (with per-Page tokens that don't expire)
    const [meRes, pagesRes] = await Promise.all([
      fetch(`${GRAPH}/me?fields=name&access_token=${userToken}`, { cache: "no-store" }),
      fetch(`${GRAPH}/me/accounts?fields=id,name,access_token,category,picture{url},location{city}&access_token=${userToken}`, { cache: "no-store" }),
    ]);
    const me = await meRes.json();
    const pagesJson = await pagesRes.json();
    const pages: FbPage[] = (pagesJson.data ?? []).map(
      (p: { id: string; name: string; access_token: string; category?: string; picture?: { data?: { url?: string } }; location?: { city?: string } }) => ({
        id: p.id,
        name: p.name,
        token: p.access_token,
        category: p.category,
        picture: p.picture?.data?.url,
        city: p.location?.city,
      })
    );

    if (!pages.length) return fail("no_pages");

    // Premium (best-effort): find an ad account + subscribe each Page to the
    // Lead Ads webhook. Silently ignored if those scopes weren't granted.
    let adAccountId: string | undefined;
    try {
      const adRes = await fetch(`${GRAPH}/me/adaccounts?fields=id,account_status&access_token=${userToken}`, { cache: "no-store" });
      const adJson = await adRes.json();
      adAccountId = adJson.data?.[0]?.id; // e.g. "act_123..."
    } catch {
      /* no ads scope — skip */
    }

    for (const p of pages) {
      rememberPageToken(p.id, p.token); // so the leadgen webhook can fetch leads
      try {
        await fetch(`${GRAPH}/${p.id}/subscribed_apps`, {
          method: "POST",
          body: new URLSearchParams({ subscribed_fields: "leadgen", access_token: p.token }),
        });
      } catch {
        /* no leads scope — skip */
      }
    }

    setConnection({ userName: me.name, activePageId: pages[0].id, pages, userToken, adAccountId });

    // Log into the app too (Facebook login = app login) and land on Settings.
    const res = NextResponse.redirect(new URL("/settings?fb=connected", origin));
    res.cookies.set(SESSION_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return fail("token_failed");
  }
}
