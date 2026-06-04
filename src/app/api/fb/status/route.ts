import { NextResponse } from "next/server";
import { fbAppConfigured } from "@/lib/config";
import { getConnection } from "@/lib/fb/session";

// Connection status for the Settings UI. Never returns tokens to the browser.
export async function GET() {
  const conn = getConnection();
  return NextResponse.json({
    configured: fbAppConfigured(),
    connected: !!conn,
    userName: conn?.userName ?? null,
    activePageId: conn?.activePageId ?? null,
    pages: conn?.pages.map((p) => ({ id: p.id, name: p.name })) ?? [],
    adsConnected: !!conn?.adAccountId,
    adAccountId: conn?.adAccountId ?? null,
  });
}
