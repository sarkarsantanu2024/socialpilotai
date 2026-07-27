import { NextResponse } from "next/server";
import { publishPost } from "@/lib/meta";
import { prisma } from "@/lib/db";
import { tenantPage } from "@/lib/fb/pages";

// Scheduled-publishing orchestrator. An external scheduler (Vercel Cron) hits
// this on an interval; it finds posts whose scheduled time is due, publishes
// them to the owning tenant's connected Page (using the stored, encrypted token),
// and marks them published. Protected by CRON_SECRET.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get("authorization")?.replace("Bearer ", "") || searchParams.get("secret");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const force = searchParams.get("force") === "1"; // publish regardless of time (testing)
  const now = new Date(Date.parse(searchParams.get("now") ?? "") || Date.now());

  const due = await prisma.post.findMany({
    where: {
      status: "scheduled",
      approvalStatus: "approved", // never auto-publish content awaiting approval
      ...(force ? {} : { scheduledAt: { lte: now } }),
    },
    take: 50,
    orderBy: { scheduledAt: "asc" },
  });

  const published: { tenantId: string; postId: string; fbPostId: string; live: boolean }[] = [];
  const failed: { tenantId: string; postId: string; error: string }[] = [];

  for (const post of due) {
    // A scheduled row that already carries an fbPostId is QUEUED ON FACEBOOK
    // (Studio/HO scheduling and video uploads all schedule server-side with
    // scheduled_publish_time) — Facebook publishes it, we only flip our row.
    // Re-publishing here would put a DUPLICATE post on the Page.
    if (post.fbPostId) {
      await prisma.post.update({ where: { id: post.id }, data: { status: "published", publishedAt: post.scheduledAt ?? now } });
      published.push({ tenantId: post.tenantId, postId: post.id, fbPostId: post.fbPostId, live: true });
      continue;
    }
    // A video/reel row with no fbPostId has no clip on Facebook; publishing it
    // via /feed would post caption-only text, so mark it failed instead.
    if (post.type === "reel" || post.type === "video") {
      await prisma.post.update({ where: { id: post.id }, data: { status: "failed" } });
      failed.push({ tenantId: post.tenantId, postId: post.id, error: "Video post has no uploaded clip — re-create it in Studio with the video attached." });
      continue;
    }
    const page = await tenantPage(post.tenantId).catch(() => null);
    try {
      const res = await publishPost({
        pageId: page?.pageId ?? post.tenantId,
        pageToken: page?.token,
        caption: `${post.caption}${post.hashtags.length ? "\n\n" + post.hashtags.join(" ") : ""}`,
        assetUrl: post.assetUrl || undefined,
        // Multi-image slideshow → a real multi-photo (carousel) Facebook post.
        assetUrls: post.assetUrls?.length ? post.assetUrls : undefined,
      });
      await prisma.post.update({
        where: { id: post.id },
        data: { status: "published", publishedAt: now, fbPostId: res.fbPostId },
      });
      published.push({ tenantId: post.tenantId, postId: post.id, fbPostId: res.fbPostId, live: !!page });
    } catch (e) {
      failed.push({ tenantId: post.tenantId, postId: post.id, error: (e as Error).message });
    }
  }

  return NextResponse.json({
    ranAt: now.toISOString(),
    publishedCount: published.length,
    published,
    failed,
  });
}
