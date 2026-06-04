import { NextResponse } from "next/server";
import { publishPost } from "@/lib/meta";
import { demoTenants } from "@/lib/demo/data";
import { getTenantData } from "@/lib/demo/tenantData";

// Scheduled-publishing orchestrator (Module 2). An external scheduler (Vercel
// Cron / GitHub Actions / Cloudflare Workers) hits this on an interval; it finds
// posts whose scheduled time is due and publishes them, with retries.
//
// In production this scans the `posts` table (status=scheduled, scheduled_at<=now)
// across all tenants and uses each tenant's stored Page token. Here it scans the
// demo datasets to demonstrate the mechanism. Facebook also schedules natively
// (published=false + scheduled_publish_time) — this cron handles video/reels and
// retries that native scheduling can't.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get("authorization")?.replace("Bearer ", "") || searchParams.get("secret");

  // Protect the endpoint once a secret is configured.
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const force = searchParams.get("force") === "1"; // publish regardless of time (testing)
  const nowMs = Date.parse(searchParams.get("now") ?? "") || Date.now();

  const published: { tenantId: string; postId: string; fbPostId: string }[] = [];
  const failed: { tenantId: string; postId: string; error: string }[] = [];

  for (const tenant of demoTenants) {
    const data = getTenantData(tenant.id);
    const due = data.posts.filter(
      (p) => p.status === "scheduled" && p.scheduledAt && (force || Date.parse(p.scheduledAt) <= nowMs)
    );
    for (const post of due) {
      try {
        // Demo: no real token here (cron has no session). Production passes the
        // tenant's stored Page token to publish live.
        const res = await publishPost({
          pageId: data.page.pageId,
          caption: `${post.caption}\n\n${post.hashtags.join(" ")}`,
          assetUrl: post.assetUrl || undefined,
        });
        published.push({ tenantId: tenant.id, postId: post.id, fbPostId: res.fbPostId });
      } catch (e) {
        failed.push({ tenantId: tenant.id, postId: post.id, error: (e as Error).message });
      }
    }
  }

  return NextResponse.json({ ranAt: new Date(nowMs).toISOString(), publishedCount: published.length, published, failed });
}
