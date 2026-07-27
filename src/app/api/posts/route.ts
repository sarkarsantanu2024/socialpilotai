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

// Edit a draft/scheduled post before it's published: title, caption, hashtags,
// music, schedule time and the creative (single image or slideshow slides).
// Scoped to the tenant's own rows.
const IMG_RE = /^(https?:\/\/|data:image\/)/;
const MAX_IMG_CHARS = 6_000_000; // ~4.5MB of base64 — matches what FB accepts as bytes
const MAX_SLIDES = 5;

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
  // A scheduled post that carries an fbPostId is already QUEUED ON FACEBOOK
  // (Facebook publishes it, not our cron) — editing our copy would silently
  // diverge from what actually goes live. Delete + re-create is the honest path.
  if (existing.fbPostId) {
    return NextResponse.json(
      { error: "This post is already queued on Facebook. Delete it and create a new one to change it." },
      { status: 400 }
    );
  }

  const caption = typeof b.caption === "string" ? b.caption : existing.caption;
  const title = typeof b.title === "string" && b.title.trim()
    ? b.title.trim().slice(0, 80)
    : existing.title;
  const hashtags = Array.isArray(b.hashtags)
    ? b.hashtags.map(String).filter(Boolean).slice(0, 15)
    : existing.hashtags;
  const music = typeof b.music === "string" ? (b.music.trim() || null) : existing.music;

  // Creative. `slides` replaces the whole set: [] clears, 1 = single image,
  // 2+ = slideshow. Accepts public URLs and uploaded data-URLs (published as
  // bytes at publish time, and replaced by the live FB image afterwards).
  let assetUrl = existing.assetUrl;
  let assetUrls = existing.assetUrls;
  if (Array.isArray(b.slides)) {
    const slides = b.slides
      .map(String)
      .filter((u: string) => IMG_RE.test(u) && u.length <= MAX_IMG_CHARS)
      .slice(0, MAX_SLIDES);
    assetUrl = slides[0] ?? null;
    assetUrls = slides.length > 1 ? slides : [];
  }

  // Reschedule (scheduled posts only — drafts have no publish time).
  let scheduledAt = existing.scheduledAt;
  if (existing.status === "scheduled" && typeof b.scheduledAt === "string") {
    const t = new Date(b.scheduledAt);
    if (isNaN(t.getTime())) return NextResponse.json({ error: "Invalid schedule time." }, { status: 400 });
    scheduledAt = t;
  }

  const post = await prisma.post.update({
    where: { id },
    data: { caption, title, hashtags, music, assetUrl, assetUrls, scheduledAt },
  });
  return NextResponse.json({
    ok: true,
    post: {
      id: post.id,
      title: post.title,
      caption: post.caption,
      hashtags: post.hashtags,
      music: post.music,
      assetUrl: post.assetUrl ?? "",
      assetUrls: post.assetUrls,
      scheduledAt: post.scheduledAt?.toISOString(),
    },
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
