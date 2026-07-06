// Draft persistence for the logged-in tenant. Studio "Save draft" → POST here.
// Posts page "Remove" → DELETE here (also removes the local DB row).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/currentTenant";

export async function POST(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const caption = String(b.caption ?? "");
  const post = await prisma.post.create({
    data: {
      tenantId: tenant.id,
      type: (b.type as string) ?? "image",
      status: "draft",
      title: (b.title ?? caption.split("\n")[0] ?? "Draft").slice(0, 80) || "Draft",
      caption,
      hashtags: Array.isArray(b.hashtags) ? b.hashtags : [],
      music: b.music ?? null,
      assetUrl: b.assetUrl ?? null,
      source: (b.source as string) ?? "studio",
    },
  });
  return NextResponse.json({ ok: true, post: { id: post.id } });
}

export async function DELETE(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  // Scoped delete — a tenant can only delete their own rows. No-op if it's an
  // FB-only post (not in our DB), which the caller deletes via /api/publish.
  await prisma.post.deleteMany({ where: { id, tenantId: tenant.id } });
  return NextResponse.json({ ok: true });
}
