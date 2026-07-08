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

// Edit a draft/scheduled post before it's published. Scoped to the tenant's own
// rows. Only fields the editor exposes (title, caption, hashtags) are updatable.
export async function PATCH(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const id = String(b.id ?? "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  // Never edit an already-published post here — it's live on Facebook.
  const existing = await prisma.post.findFirst({ where: { id, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (existing.status === "published") {
    return NextResponse.json({ error: "Published posts can't be edited here." }, { status: 400 });
  }

  const caption = typeof b.caption === "string" ? b.caption : existing.caption;
  const title = typeof b.title === "string" && b.title.trim()
    ? b.title.trim().slice(0, 80)
    : existing.title;
  const hashtags = Array.isArray(b.hashtags) ? b.hashtags : existing.hashtags;

  const post = await prisma.post.update({ where: { id }, data: { caption, title, hashtags } });
  return NextResponse.json({
    ok: true,
    post: { id: post.id, title: post.title, caption: post.caption, hashtags: post.hashtags },
  });
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
