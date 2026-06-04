import { NextResponse } from "next/server";
import { fbAppConfigured } from "@/lib/config";
import { getConnection, activePage } from "@/lib/fb/session";

// Connection status for the UI. Never returns tokens to the browser.
export async function GET() {
  const conn = getConnection();
  const active = activePage(conn);
  return NextResponse.json({
    configured: fbAppConfigured(),
    connected: !!conn,
    userName: conn?.userName ?? null,
    activePageId: conn?.activePageId ?? null,
    pages: conn?.pages.map((p) => ({ id: p.id, name: p.name })) ?? [],
    adsConnected: !!conn?.adAccountId,
    adAccountId: conn?.adAccountId ?? null,
    // Active page identity — drives the app's brand (name, logo, category).
    activePage: active ? { id: active.id, name: active.name, category: active.category ?? null, picture: active.picture ?? null } : null,
  });
}
