import { NextResponse } from "next/server";
import { publishPost } from "@/lib/meta";
import { connectedPage } from "@/lib/demo/data";
import { getConnection, activePage } from "@/lib/fb/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // If a real Facebook Page is connected, publish there for real; else demo.
  const page = activePage(getConnection());

  const result = await publishPost({
    pageId: page?.id ?? connectedPage.pageId,
    pageToken: page?.token,
    caption: body.caption ?? "",
    assetUrl: body.assetUrl,
    scheduledAt: body.scheduledAt,
  });

  return NextResponse.json({ ...result, live: !!page, pageName: page?.name ?? null });
}
