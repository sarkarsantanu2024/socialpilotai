import { NextResponse } from "next/server";
import { videoUploadStart, videoUploadTransfer, videoUploadFinish, videoPermalink } from "@/lib/meta";
import { getActivePage, type FbPageData } from "@/lib/fb/connection";
import { getCurrentTenant } from "@/lib/currentTenant";
import { getCurrentUser } from "@/lib/access";
import { canAdminOrg } from "@/lib/org";
import { trialExpiredForCenter } from "@/lib/billing";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/db";

// Real video/reel publishing to a connected Facebook Page via the resumable
// upload protocol. The browser drives three calls against this one route:
//   1. JSON  {action:"start", fileSize}            → upload session + video id
//   2. FORM  {sessionId, startOffset, chunk}  ×N   → relay each <4MB chunk
//   3. JSON  {action:"finish", sessionId, ...}     → set caption, persist, notify
// Chunks are relayed (never buffered whole) so this also works within
// serverless request-body limits — a 60MB reel goes up as ~20 small requests.
//
// Scope: by default the ACTIVE center's Page. An HO broadcast passes `centerId`
// (in every phase) to target another center's Page — allowed only for an
// owner/HO of that center's organization (or a platform admin).
export const maxDuration = 60;

async function resolveTarget(centerId?: string | null): Promise<
  { page: FbPageData; tenantId: string | null } | { error: string; status: number }
> {
  if (!centerId) {
    const page = await getActivePage();
    if (!page) {
      return { error: "Connect your Facebook Page first (Settings → Connect Facebook Page) to publish.", status: 400 };
    }
    const tenant = await getCurrentTenant();
    return { page, tenantId: tenant?.id ?? null };
  }
  const user = await getCurrentUser();
  const tenant = await prisma.tenant.findUnique({ where: { id: centerId } });
  if (!user || !tenant?.organizationId || !(await canAdminOrg(user, tenant.organizationId))) {
    return { error: "Only an owner/HO or platform admin can publish to this center.", status: 403 };
  }
  const page = await getActivePage(centerId);
  if (!page) return { error: "This center has no Facebook Page connected.", status: 400 };
  return { page, tenantId: centerId };
}

export async function POST(req: Request) {
  // Chunk relay (multipart) — hot path, keep it lean.
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    try {
      const fd = await req.formData();
      const target = await resolveTarget(fd.get("centerId") ? String(fd.get("centerId")) : null);
      if ("error" in target) return NextResponse.json({ ok: false, error: target.error }, { status: target.status });
      const sessionId = String(fd.get("sessionId") ?? "");
      const startOffset = Number(fd.get("startOffset") ?? 0);
      const chunk = fd.get("chunk");
      if (!sessionId || !(chunk instanceof Blob) || !chunk.size) {
        return NextResponse.json({ ok: false, error: "Malformed upload chunk." }, { status: 400 });
      }
      const next = await videoUploadTransfer(target.page.id, target.page.token, sessionId, startOffset, chunk);
      return NextResponse.json({ ok: true, ...next });
    } catch (e) {
      const error = (e as Error).message;
      console.warn("[publish/video] transfer failed:", error);
      return NextResponse.json({ ok: false, error });
    }
  }

  const body = await req.json().catch(() => ({}));
  const target = await resolveTarget(body.centerId ? String(body.centerId) : null);
  if ("error" in target) {
    return NextResponse.json(
      { ok: false, error: target.error, needsConnection: target.status === 400 },
      { status: target.status }
    );
  }
  const { page, tenantId } = target;

  try {
    if (body.action === "start") {
      // Gate once, up front — before any bytes move.
      if (tenantId && (await trialExpiredForCenter(tenantId))) {
        return NextResponse.json(
          { ok: false, upgrade: true, error: "Your free trial has ended. Upgrade to keep publishing." },
          { status: 403 }
        );
      }
      const fileSize = Number(body.fileSize);
      if (!fileSize || fileSize < 1) return NextResponse.json({ ok: false, error: "Missing video file size." }, { status: 400 });
      const session = await videoUploadStart(page.id, page.token, fileSize);
      return NextResponse.json({ ok: true, ...session });
    }

    if (body.action === "finish") {
      const scheduled = !!body.scheduledAt;
      const caption: string = body.caption ?? "";
      const type: string = body.type === "reel" ? "reel" : "video";
      const fromHO = body.source === "ho-publish";
      await videoUploadFinish({
        pageId: page.id,
        pageToken: page.token,
        sessionId: String(body.sessionId ?? ""),
        description: caption,
        // Reels have no title surface; a title on plain videos labels the Watch card.
        title: type === "video" ? (body.title as string | undefined) : undefined,
        scheduledAt: body.scheduledAt,
      });
      const videoId = String(body.videoId ?? "");
      const permalink = scheduled ? "" : await videoPermalink(videoId, page.token);

      // Persist to the center's history (same shape as /api/publish does for images).
      if (tenantId) {
        const data = {
          type,
          status: scheduled ? "scheduled" : "published",
          approvalStatus: "approved",
          title: ((body.title as string) ?? caption.split("\n")[0] ?? "Video").slice(0, 80) || "Video",
          caption,
          hashtags: Array.isArray(body.hashtags) ? body.hashtags : [],
          music: (body.music as string) ?? null,
          assetUrl: null, // the clip lives on Facebook; the live overlay brings its thumbnail
          scheduledAt: scheduled ? new Date(body.scheduledAt) : null,
          publishedAt: scheduled ? null : new Date(),
          fbPostId: videoId || null,
          source: (body.source as string) ?? "studio",
        };
        if (body.postId) {
          await prisma.post.updateMany({ where: { id: body.postId, tenantId }, data });
        } else {
          await prisma.post.create({ data: { ...data, tenantId } });
        }
        await notify(tenantId, {
          title: fromHO
            ? scheduled ? "Head Office scheduled a video" : "Head Office posted a video"
            : scheduled ? "Video scheduled" : "Video published",
          body: `"${data.title}" ${scheduled ? "is scheduled — Facebook will publish it on time" : "is now live on your Page"}.`,
          type: "publish",
          href: "/posts",
        });
      }

      return NextResponse.json({ ok: true, fbPostId: videoId, permalink, live: true, pageName: page.name, scheduled });
    }

    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  } catch (e) {
    const error = (e as Error).message;
    console.warn("[publish/video] failed:", error);
    return NextResponse.json({ ok: false, error, live: true, pageName: page.name });
  }
}
