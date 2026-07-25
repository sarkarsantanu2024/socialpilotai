import { NextResponse } from "next/server";
import { pendingPages, activatePending, discardPending, centerDisplayName } from "@/lib/fb/connection";
import { getSessionTenantId } from "@/lib/session";

// A mismatched Facebook connect stores the account's Pages as PENDING (nothing
// connected). This route lets the user decide in the dialog:
//   GET    → the pending Pages + this center's name (to render the dialog)
//   POST   → { pageId? } connect anyway (activate; chosen/first Page active)
//   DELETE → cancel — drop the pending Pages, center stays unconnected

export async function GET() {
  const tenantId = getSessionTenantId();
  if (!tenantId) return NextResponse.json({ pages: [], centerName: "" });
  const [pages, centerName] = await Promise.all([pendingPages(tenantId), centerDisplayName(tenantId)]);
  return NextResponse.json({ pages, centerName });
}

export async function POST(req: Request) {
  const tenantId = getSessionTenantId();
  if (!tenantId) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const ok = await activatePending(tenantId, body.pageId ? String(body.pageId) : undefined);
  return NextResponse.json({ ok });
}

export async function DELETE() {
  const tenantId = getSessionTenantId();
  if (!tenantId) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  await discardPending(tenantId);
  return NextResponse.json({ ok: true });
}
