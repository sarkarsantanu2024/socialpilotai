// HO → Center content push. An owner/super-admin composes content once and
// fans it out to many centers as PENDING drafts (each center approves before it
// goes live). {center} and {city} placeholders are localized per center.
// Server-only.
import "server-only";
import { prisma } from "@/lib/db";
import { canAdminOrg, primaryOrgId } from "@/lib/org";
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
