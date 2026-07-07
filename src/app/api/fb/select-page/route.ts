import { NextResponse } from "next/server";
import { setActivePage } from "@/lib/fb/connection";
import { getSessionTenantId } from "@/lib/session";

// Choose which connected Page is active for the current center (when it manages
// several). Scoped to the active center — you can't change another center's Page.
export async function POST(req: Request) {
  const tenantId = getSessionTenantId();
  if (!tenantId) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const pageId = body.pageId as string | undefined;
  if (!pageId) return NextResponse.json({ ok: false }, { status: 400 });
  const ok = await setActivePage(tenantId, pageId);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
