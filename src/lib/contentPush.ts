// HO → Center publishing. An owner/super-admin composes content once and
// publishes (or schedules) it straight to each center's connected Facebook Page.
// {center} and {city} placeholders are localized per center. Server-only.
import "server-only";
import { prisma } from "@/lib/db";
import { canAdminOrg, primaryOrgId } from "@/lib/org";
import { trialExpiredForOrg } from "@/lib/billing";
import { getActivePage } from "@/lib/fb/connection";
import { publishPost, publishInstagram } from "@/lib/meta";
import type { PostType } from "@/lib/types";

type MinUser = { id: string; platformRole: string; memberships: { role: string; organizationId: string; centerId: string | null }[] };

function localize(text: string, center: { name: string; city: string }) {
  return text
    .replace(/\{center\}/gi, center.name)
    .replace(/\{city\}/gi, center.city || "your city");
}

export interface PublishToCentersInput {
  orgId?: string;
  title: string;
  caption: string;
  hashtags?: string[];
  type?: PostType;
  assetUrl?: string;
  assetUrls?: string[]; // multiple images → a real multi-photo (carousel) post per branch
  scheduledAt?: string; // ISO — when set, schedule instead of publish now
  centerIds?: string[]; // omitted / empty = all centers in the org
  instagram?: boolean; // best-effort IG cross-post (immediate only)
  // Optional per-center overrides (keyed by center/tenant id). A center listed
  // here uses its own caption/hashtags instead of the shared broadcast default;
  // {center}/{city} tokens are still localized. Centers absent = shared default.
  overrides?: Record<string, { caption?: string; hashtags?: string[] }>;
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
  if (await trialExpiredForOrg(orgId)) throw new Error("Your free trial has ended. Upgrade to keep publishing.");

  const where = input.centerIds?.length
    ? { organizationId: orgId, id: { in: input.centerIds } }
    : { organizationId: orgId };
  const centers = await prisma.tenant.findMany({ where, include: { businessProfile: true } });
  if (!centers.length) throw new Error("No centers to publish to.");

  const isScheduled = !!input.scheduledAt;
  const hashtags = input.hashtags ?? [];
  // Images to publish: the explicit list (carousel) or the single assetUrl.
  const media = (input.assetUrls?.length ? input.assetUrls : input.assetUrl ? [input.assetUrl] : []).filter(Boolean);
  // For the DB row keep only a public http(s) image. Uploaded/AI data-URLs aren't
  // stored — the image is on Facebook after publishing, and clientData overlays the
  // real FB image back onto the post once the Page API indexes it.
  const httpAsset = media.find((u) => /^https?:\/\//.test(u)) ?? null;
  const results: CenterPublishResult[] = [];

  for (const c of centers) {
    const name = c.businessProfile?.name ?? c.name ?? "Untitled center";
    const ctx = { name, city: c.businessProfile?.city ?? "" };
    // Per-center override wins over the shared broadcast default (tokens still localized).
    const ov = input.overrides?.[c.id];
    const baseCaption = ov?.caption?.trim() ? ov.caption : input.caption;
    const centerHashtags = ov?.hashtags?.length ? ov.hashtags : hashtags;
    const caption = localize(baseCaption, ctx);
    const fbCaption = centerHashtags.length ? `${caption}\n\n${centerHashtags.join(" ")}` : caption;

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
        assetUrl: media[0],
        assetUrls: media.length > 1 ? media : undefined,
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
          hashtags: centerHashtags,
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
