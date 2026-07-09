import { NextResponse } from "next/server";
import { publishPost, publishInstagram, GRAPH_VERSION } from "@/lib/meta";
import { getActivePage } from "@/lib/fb/connection";
import { getCurrentTenant } from "@/lib/currentTenant";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // If a real Facebook Page is connected, publish there for real; else record-only.
  const page = await getActivePage();
  const tenant = await getCurrentTenant();
  const scheduled = !!body.scheduledAt;

  // Require a real Facebook connection to publish/schedule — no silent "demo" posts.
  if (!page) {
    return NextResponse.json(
      {
        ok: false,
        needsConnection: true,
        error: "Connect your Facebook Page first (Settings → Connect Facebook Page) to publish.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await publishPost({
      pageId: page?.id ?? tenant?.id ?? "local",
      pageToken: page?.token,
      caption: body.caption ?? "",
      assetUrl: body.assetUrl,
      assetUrls: Array.isArray(body.assetUrls) ? body.assetUrls : undefined,
      scheduledAt: body.scheduledAt,
    });

    // Persist to the tenant's history so it shows in Posts / Calendar / Analytics.
    if (tenant) {
      const caption: string = body.caption ?? "";
      const data = {
        type: (body.type as string) ?? "image",
        status: scheduled ? "scheduled" : "published",
        title: (body.title ?? caption.split("\n")[0] ?? "Post").slice(0, 80) || "Post",
        caption,
        hashtags: Array.isArray(body.hashtags) ? body.hashtags : [],
        music: body.music ?? null,
        // Never store base64 data-URLs in the DB (the image is on Facebook now;
        // clientData overlays the real FB image). Keep only public http(s) URLs.
        assetUrl: body.assetUrl && /^https?:\/\//.test(body.assetUrl) ? body.assetUrl : null,
        scheduledAt: scheduled ? new Date(body.scheduledAt) : null,
        publishedAt: scheduled ? null : new Date(),
        fbPostId: result.fbPostId ?? null,
        source: (body.source as string) ?? "studio",
      };
      if (body.postId) {
        await prisma.post.updateMany({ where: { id: body.postId, tenantId: tenant.id }, data });
      } else {
        await prisma.post.create({ data: { ...data, tenantId: tenant.id } });
      }
      await notify(tenant.id, {
        title: scheduled ? "Post scheduled" : "Post published",
        body: `"${data.title}" ${scheduled ? "is scheduled" : "is now live on your Page"}.`,
        type: "publish",
        href: "/posts",
      });
    }

    // Optional cross-post to Instagram (immediate publishes only; IG needs a
    // PUBLIC image URL — stock images work, AI/uploaded data-URLs don't).
    let instagram: { ok: boolean; permalink?: string; error?: string } | undefined;
    if (body.instagram && !scheduled) {
      if (!page.igUserId) {
        instagram = { ok: false, error: "No Instagram account is linked to this Page." };
      } else if (!(body.assetUrl && /^https?:\/\//.test(body.assetUrl))) {
        instagram = { ok: false, error: "Instagram needs a public image (a stock image works; AI/uploaded images can't be cross-posted yet)." };
      } else {
        try {
          const ig = await publishInstagram({ igUserId: page.igUserId, imageUrl: body.assetUrl, caption: body.caption ?? "", pageToken: page.token });
          instagram = { ok: true, permalink: ig.permalink };
        } catch (e) {
          instagram = { ok: false, error: (e as Error).message };
        }
      }
    }

    return NextResponse.json({ ok: true, ...result, live: !!page, pageName: page?.name ?? null, instagram });
  } catch (e) {
    // Surface the real Graph API error to the UI instead of a silent 500.
    const error = (e as Error).message;
    console.warn("[publish] failed:", error);
    return NextResponse.json({ ok: false, error, live: !!page, pageName: page?.name ?? null });
  }
}

// Delete a published post/photo from the connected Page (used to clean up test
// posts). Destructive + outward-facing, so the UI confirms before calling this.
//
// Graph API gotcha: a PHOTO node (the `fbid` you see in a photo URL) does NOT
// support DELETE — only the underlying PAGE POST does. So we:
//   1) try deleting the id as given (works for feed posts: {page}_{post}),
//   2) if that fails, treat it as a photo: read its `page_story_id` (the real
//      deletable post id) and delete that instead.
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing post id" });

  const page = await getActivePage();
  if (!page) return NextResponse.json({ ok: false, error: "Demo mode — nothing to delete on Facebook" });

  const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
  const token = encodeURIComponent(page.token);

  const tryDelete = async (targetId: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch(`${base}/${targetId}?access_token=${token}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && !data.error) return { ok: true };
    return { ok: false, error: data.error?.message ?? "Delete failed" };
  };

  try {
    // 1) Delete as-is (page post / feed story).
    const first = await tryDelete(id);
    if (first.ok) return NextResponse.json({ ok: true });

    // 2) Photo id → resolve the underlying page post and delete that.
    const metaRes = await fetch(`${base}/${id}?fields=page_story_id&access_token=${token}`);
    const meta = await metaRes.json().catch(() => ({}));
    if (meta.page_story_id) {
      const second = await tryDelete(meta.page_story_id);
      if (second.ok) return NextResponse.json({ ok: true });
      return NextResponse.json({ ok: false, error: second.error });
    }

    return NextResponse.json({ ok: false, error: first.error });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message });
  }
}
