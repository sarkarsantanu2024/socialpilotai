import { NextResponse } from "next/server";
import { fbAppConfigured, FB_GRAPH_VERSION } from "@/lib/config";
import { getConnection, getActivePage } from "@/lib/fb/connection";

// Lightweight validation of the active Page token. Page access tokens are
// long-lived but CAN be invalidated (password change, permission removal, app
// de-auth). A 190/OAuthException means the user must reconnect. Transient/network
// errors are NOT treated as needing reconnect.
async function tokenNeedsReconnect(token: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${FB_GRAPH_VERSION}/me?fields=id&access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );
    const j = await res.json();
    return !!(j.error && (j.error.code === 190 || j.error.type === "OAuthException"));
  } catch {
    return false;
  }
}

// Connection status for the ACTIVE CENTER (from the DB). Never returns tokens.
export async function GET() {
  const conn = await getConnection();
  const active = await getActivePage();
  const needsReconnect = active ? await tokenNeedsReconnect(active.token) : false;

  return NextResponse.json({
    configured: fbAppConfigured(),
    connected: !!conn,
    needsReconnect,
    userName: conn?.userName ?? null,
    activePageId: conn?.activePageId ?? null,
    pages: conn?.pages.map((p) => ({ id: p.id, name: p.name })) ?? [],
    adsConnected: !!conn?.adAccountId,
    adAccountId: conn?.adAccountId ?? null,
    // Active page identity — drives the app's brand (name, logo, category).
    activePage: active
      ? { id: active.id, name: active.name, category: active.category ?? null, picture: active.picture ?? null, city: active.city ?? null }
      : null,
  });
}
