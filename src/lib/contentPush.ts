// HO → Center content push. An owner/super-admin composes content once and
// either (a) fans it out to many centers as PENDING drafts they approve, or
// (b) publishes it straight to each center's connected Facebook Page.
// {center} and {city} placeholders are localized per center. Server-only.
import "server-only";
import { prisma } from "@/lib/db";
import { canAdminOrg, primaryOrgId } from "@/lib/org";
import { getActivePage } from "@/lib/fb/connection";
import { publishPost, publishInstagram } from "@/lib/meta";
import type { PostType } from "@/lib/types";

type MinUser = { id: string; platformRole: string; memberships: { role: string; organizationId: string; centerId: string | null }[] };

function localize(text: string, center: { name: string; city: string }) {
  return text
    .replace(/\{center\}/gi, center.name)
    .replace(/\{city\}/gi, center.city || "your city");
}

export interface PushInput {
  orgId?: string;
  title: string;
  caption: string;
  hashtags?: string[];
  type?: PostType;
  assetUrl?: string;
  suggestedAt?: string; // ISO
  centerIds?: string[]; // omitted / empty = all centers in the org
}

export async function pushContent(user: MinUser, input: PushInput): Promise<{ pushId: string; pushed: number; orgId: string; centerIds: string[] }> {
  const orgId = input.orgId ?? primaryOrgId(user);
  if (!orgId) throw new Error("No organization to push to.");
  if (!(await canAdminOrg(user, orgId))) throw new Error("Only an owner/HO or platform admin can push content.");
  if (!input.caption.trim()) throw new Error("Write some content first.");

  const where = input.centerIds?.length
    ? { organizationId: orgId, id: { in: input.centerIds } }
    : { organizationId: orgId };
  const centers = await prisma.tenant.findMany({ where, include: { businessProfile: true } });
  if (!centers.length) throw new Error("No centers to push to.");

  const push = await prisma.contentPush.create({
    data: {
      organizationId: orgId,
      createdByUserId: user.id,
      title: input.title.trim() || input.caption.trim().slice(0, 48),
      caption: input.caption,
      hashtags: input.hashtags ?? [],
      type: input.type ?? "image",
      assetUrl: input.assetUrl ?? null,
      suggestedAt: input.suggestedAt ? new Date(input.suggestedAt) : null,
      targetCount: centers.length,
    },
  });

  await prisma.post.createMany({
    data: centers.map((c) => {
      const ctx = { name: c.businessProfile?.name ?? c.name ?? "our centre", city: c.businessProfile?.city ?? "" };
      return {
        tenantId: c.id,
        type: input.type ?? "image",
        status: "draft", // stays a draft until the center approves
        approvalStatus: "pending",
        pushId: push.id,
        source: "pushed",
        title: localize(input.title || "Pushed post", ctx).slice(0, 80),
        caption: localize(input.caption, ctx),
        hashtags: input.hashtags ?? [],
        assetUrl: input.assetUrl ?? null,
        scheduledAt: input.suggestedAt ? new Date(input.suggestedAt) : null,
      };
    }),
  });

  return { pushId: push.id, pushed: centers.length, orgId, centerIds: centers.map((c) => c.id) };
}

export interface PublishToCentersInput {
  orgId?: string;
  title: string;
  caption: string;
  hashtags?: string[];
  type?: PostType;
  assetUrl?: string;
  scheduledAt?: string; // ISO — when set, schedule instead of publish now
  centerIds?: string[]; // omitted / empty = all centers in the org
  instagram?: boolean; // best-effort IG cross-post (immediate only)
}

export type CenterPublishResult = {
  centerId: string;
  name: string;
  status: "published" | "scheduled" | "skipped" | "failed";
  reason?: string; // for skipped/failed
  permalink?: string;
  pageName?: string;
};

/**
 * Publish (or schedule) the same content straight to EACH selected center's
 * connected Facebook Page, using that center's own Page token. Centers without a
 * connected Page are skipped (reported, never silently dropped). Caption is
 * localized per center via {center}/{city}.
 */
export async function publishToCenters(
  user: MinUser,
  input: PublishToCentersInput
): Promise<{ orgId: string; results: CenterPublishResult[]; published: number; scheduled: number; skipped: number; failed: number; centerIds: string[] }> {
  const orgId = input.orgId ?? primaryOrgId(user);
  if (!orgId) throw new Error("No organization to publish to.");
  if (!(await canAdminOrg(user, orgId))) throw new Error("Only an owner/HO or platform admin can publish to centers.");
  if (!input.caption.trim()) throw new Error("Write some content first.");

  const where = input.centerIds?.length
    ? { organizationId: orgId, id: { in: input.centerIds } }
    : { organizationId: orgId };
  const centers = await prisma.tenant.findMany({ where, include: { businessProfile: true } });
  if (!centers.length) throw new Error("No centers to publish to.");

  const isScheduled = !!input.scheduledAt;
  const hashtags = input.hashtags ?? [];
  const httpAsset = input.assetUrl && /^https?:\/\//.test(input.assetUrl) ? input.assetUrl : null;
  const results: CenterPublishResult[] = [];

  for (const c of centers) {
    const name = c.businessProfile?.name ?? c.name ?? "Untitled center";
    const ctx = { name, city: c.businessProfile?.city ?? "" };
    const caption = localize(input.caption, ctx);
    const fbCaption = hashtags.length ? `${caption}\n\n${hashtags.join(" ")}` : caption;

    const page = await getActivePage(c.id);
    if (!page) {
      results.push({ centerId: c.id, name, status: "skipped", reason: "No Facebook Page connected" });
      continue;
    }

    try {
      const result = await publishPost({
        pageId: page.id,
        pageToken: page.token,
        caption: fbCaption,
        assetUrl: input.assetUrl,
        scheduledAt: input.scheduledAt,
      });

      await prisma.post.create({
        data: {
          tenantId: c.id,
          type: input.type ?? "image",
          status: isScheduled ? "scheduled" : "published",
          approvalStatus: "approved", // HO-published — no center approval needed
          source: "ho-publish",
          title: localize(input.title || caption.split("\n")[0] || "Post", ctx).slice(0, 80) || "Post",
          caption,
          hashtags,
          assetUrl: httpAsset,
          scheduledAt: isScheduled ? new Date(input.scheduledAt as string) : null,
          publishedAt: isScheduled ? null : new Date(),
          fbPostId: result.fbPostId ?? null,
        },
      });

      // Best-effort Instagram cross-post (immediate + public image + linked IG).
      if (input.instagram && !isScheduled && page.igUserId && httpAsset) {
        try {
          await publishInstagram({ igUserId: page.igUserId, imageUrl: httpAsset, caption: fbCaption, pageToken: page.token });
        } catch { /* IG is best-effort; the FB publish already succeeded */ }
      }

      results.push({ centerId: c.id, name, status: isScheduled ? "scheduled" : "published", permalink: result.permalink, pageName: page.name });
    } catch (e) {
      results.push({ centerId: c.id, name, status: "failed", reason: (e as Error).message });
    }
  }

  const published = results.filter((r) => r.status === "published").length;
  const scheduled = results.filter((r) => r.status === "scheduled").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const centerIds = results.filter((r) => r.status === "published" || r.status === "scheduled").map((r) => r.centerId);

  return { orgId, results, published, scheduled, skipped, failed, centerIds };
}

/** Pushes for an org, with how many centers have approved so far. */
export async function listPushes(user: MinUser, orgId?: string) {
  const targetOrgId = orgId ?? primaryOrgId(user);
  if (!targetOrgId || !(await canAdminOrg(user, targetOrgId))) return [];
  const pushes = await prisma.contentPush.findMany({
    where: { organizationId: targetOrgId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const out = [];
  for (const p of pushes) {
    const [approved, pending] = await Promise.all([
      prisma.post.count({ where: { pushId: p.id, approvalStatus: "approved" } }),
      prisma.post.count({ where: { pushId: p.id, approvalStatus: "pending" } }),
    ]);
    out.push({
      id: p.id, title: p.title, type: p.type, targetCount: p.targetCount,
      approved, pending, createdAt: p.createdAt.toISOString(),
    });
  }
  return out;
}
