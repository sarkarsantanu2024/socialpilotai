import { NextResponse } from "next/server";
import { FB_GRAPH_VERSION, fbAppConfigured, fbRedirectUri, fbScopes } from "@/lib/config";
import { encodeOAuthState, sanitizeReturnTo } from "@/lib/fb/oauthState";

// Step 1 of OAuth: send the user to Facebook's login/consent dialog.
// ?premium=1 also requests Ads & Leads permissions (Marketing API + Lead Ads).
// ?returnTo=/organization lands the user back there after connecting (default: /settings).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  if (!fbAppConfigured()) {
    // No Meta app yet — show the hint on the login page (works whether or not
    // the user is signed in).
    return NextResponse.redirect(new URL("/login?fb=not_configured", origin));
  }
  const premium = url.searchParams.get("premium") === "1";
  // ?connect=<signed token> → a branch owner connecting THEIR page via a shared
  // link (no login). The token is re-verified in the callback; here we just pass
  // it through state and default the landing to the connect success page.
  const connect = url.searchParams.get("connect");
  const returnTo = connect ? "/connect/done" : sanitizeReturnTo(url.searchParams.get("returnTo"));
  const params = new URLSearchParams({
    client_id: process.env.FB_APP_ID!,
    redirect_uri: fbRedirectUri(),
    scope: fbScopes(premium),
    response_type: "code",
    state: encodeOAuthState({ premium, returnTo, connect }),
  });
  return NextResponse.redirect(
    `https://www.facebook.com/${FB_GRAPH_VERSION}/dialog/oauth?${params.toString()}`
  );
}
