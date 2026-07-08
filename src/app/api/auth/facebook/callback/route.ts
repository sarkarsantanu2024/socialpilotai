import { NextResponse } from "next/server";
import { FB_GRAPH_VERSION, fbAppConfigured, fbRedirectUri } from "@/lib/config";
import { persistConnection, type FbPageInput } from "@/lib/fb/connection";
import { rememberPageToken } from "@/lib/fb/store";
import { getSessionTenantId } from "@/lib/session";
import { decodeOAuthState } from "@/lib/fb/oauthState";
import { verifyConnectToken } from "@/lib/fb/connectToken";
import { prisma } from "@/lib/db";

const GRAPH = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;

// Step 2 of OAuth: exchange the code for tokens, fetch the user's Pages (each
// with its own non-expiring Page access token), and store them encrypted against
// the CURRENTLY LOGGED-IN tenant. Facebook is a "connect your Page" action here,
// not a login method — the user must already be signed in.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  // Where to land after connecting — carried through OAuth `state` (default Settings).
  const { returnTo, connect } = decodeOAuthState(url.searchParams.get("state"));
  const dest = returnTo ?? "/settings";
  // Connect-link flow: a branch owner (no login) connecting their own Page. The
  // signed token names the target center — re-verified here, never trusted raw.
  const connectCenterId = connect ? verifyConnectToken(connect)?.centerId ?? null : null;
  // Otherwise fall back to the logged-in user's active center.
  const tenantId = connectCenterId ?? getSessionTenantId();
  if (!tenantId) {
    // Connect link was bad/expired → tell them; a normal connect w/o session → login.
    if (connect) return NextResponse.redirect(new URL("/connect/done?fb=expired", origin));
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(dest)}`, origin));
  }
  // User is signed in — surface success/failure back where they started.
  const back = (q: string) => {
    const u = new URL(dest, origin);
    u.searchParams.set("fb", q);
    return NextResponse.redirect(u);
  };
  const fail = back;

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
      fetch(`${GRAPH}/me/accounts?fields=id,name,access_token,category,picture{url},location{city},instagram_business_account{id,username}&access_token=${userToken}`, { cache: "no-store" }),
    ]);
    const me = await meRes.json();
    const pagesJson = await pagesRes.json();
    const pages: FbPageInput[] = (pagesJson.data ?? []).map(
      (p: { id: string; name: string; access_token: string; category?: string; picture?: { data?: { url?: string } }; location?: { city?: string }; instagram_business_account?: { id?: string; username?: string } }) => ({
        id: p.id,
        name: p.name,
        token: p.access_token,
        category: p.category,
        picture: p.picture?.data?.url,
        city: p.location?.city,
        igUserId: p.instagram_business_account?.id,
        igUsername: p.instagram_business_account?.username,
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

    // Persist the connection (encrypted tokens) to THIS center in the DB — so
    // each center is isolated, the webhook + cron can act without a session, and
    // the link survives logout. Then seed brand identity (logo/city) from the
    // Page — best effort.
    try {
      await persistConnection(tenantId, { userName: me.name, userToken, adAccountId, pages });
      const p = pages[0];
      if (p.picture) {
        await prisma.brandKit.update({ where: { tenantId }, data: { logoUrl: p.picture } });
      }
      if (p.city) {
        const bp = await prisma.businessProfile.findUnique({ where: { tenantId } });
        if (bp && !bp.city) await prisma.businessProfile.update({ where: { tenantId }, data: { city: p.city } });
      }
    } catch (e) {
      console.warn("[fb/callback] persist failed:", (e as Error).message);
    }

    // Page connected — land where the flow started (Settings, Organization, or
    // the connect-link success page).
    return back("connected");
  } catch {
    return fail("token_failed");
  }
}
