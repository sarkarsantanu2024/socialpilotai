import { NextResponse } from "next/server";
import { fbAppConfigured } from "@/lib/config";
import { getConnection, getActivePage } from "@/lib/fb/connection";

// Connection status for the ACTIVE CENTER (from the DB). Never returns tokens.
export async function GET() {
  const conn = await getConnection();
  const active = await getActivePage();
  return NextResponse.json({
    configured: fbAppConfigured(),
    connected: !!conn,
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
