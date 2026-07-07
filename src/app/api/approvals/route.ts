import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionTenantId } from "@/lib/session";

// Pending-approval posts for the ACTIVE CENTER (HO-pushed or staff drafts).
export async function GET() {
  const tenantId = getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const posts = await prisma.post.findMany({
    where: { tenantId, approvalStatus: "pending" },
    orderBy: { scheduledAt: "asc" },
  });
  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id, title: p.title, caption: p.caption, hashtags: p.hashtags,
      type: p.type, assetUrl: p.assetUrl, source: p.source,
      scheduledAt: p.scheduledAt?.toISOString() ?? null,
    })),
  });
}
