import { NextResponse } from "next/server";
import { getConnection, setConnection } from "@/lib/fb/session";

// Choose which connected Page is active (when the user manages several).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pageId = body.pageId as string | undefined;
  const conn = getConnection();
  if (!conn || !pageId || !conn.pages.some((p) => p.id === pageId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  setConnection({ ...conn, activePageId: pageId });
  return NextResponse.json({ ok: true });
}
