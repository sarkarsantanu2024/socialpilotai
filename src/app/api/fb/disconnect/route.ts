import { NextResponse } from "next/server";
import { clearConnection } from "@/lib/fb/session";
import { getSessionTenantId } from "@/lib/session";
import { clearPages } from "@/lib/fb/pages";

export async function POST() {
  clearConnection();
  const tenantId = getSessionTenantId();
  if (tenantId) await clearPages(tenantId).catch(() => {});
  return NextResponse.json({ ok: true });
}
