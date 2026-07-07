import { NextResponse } from "next/server";
import { getSessionTenantId } from "@/lib/session";
import { listNotifications, markRead } from "@/lib/notify";

// Notifications for the active center. GET = list; POST = mark read.
export async function GET() {
  const tenantId = getSessionTenantId();
  if (!tenantId) return NextResponse.json({ notifications: [] });
  return NextResponse.json({ notifications: await listNotifications(tenantId) });
}

export async function POST(req: Request) {
  const tenantId = getSessionTenantId();
  if (!tenantId) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  await markRead(tenantId, Array.isArray(body.ids) ? body.ids : undefined);
  return NextResponse.json({ ok: true });
}
