import { NextResponse } from "next/server";
import { getSessionTenantId } from "@/lib/session";
import { disconnect } from "@/lib/fb/connection";

// Disconnect Facebook for the ACTIVE CENTER only (removes its pages + tokens).
export async function POST() {
  const tenantId = getSessionTenantId();
  if (tenantId) await disconnect(tenantId).catch(() => {});
  return NextResponse.json({ ok: true });
}
