import { NextResponse } from "next/server";
import { FB_GRAPH_VERSION, fbAppConfigured, fbRedirectUri, fbScopes } from "@/lib/config";

// Step 1 of OAuth: send the user to Facebook's login/consent dialog.
// ?premium=1 also requests Ads & Leads permissions (Marketing API + Lead Ads).
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!fbAppConfigured()) {
    // No Meta app yet — show the hint on the login page (works whether or not
    // the user is signed in).
    return NextResponse.redirect(new URL("/login?fb=not_configured", origin));
  }
  const premium = new URL(req.url).searchParams.get("premium") === "1";
  const params = new URLSearchParams({
    client_id: process.env.FB_APP_ID!,
    redirect_uri: fbRedirectUri(),
    scope: fbScopes(premium),
    response_type: "code",
    state: premium ? "premium" : "core",
  });
  return NextResponse.redirect(
    `https://www.facebook.com/${FB_GRAPH_VERSION}/dialog/oauth?${params.toString()}`
  );
}
