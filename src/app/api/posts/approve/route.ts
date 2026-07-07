import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/access";
import { getSessionTenantId } from "@/lib/session";
import { audit } from "@/lib/audit";

// Approve or reject a pending post for the active center. Staff cannot approve —
// only a center manager, the org owner/HO, or a platform super-admin.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  const tenantId = getSessionTenantId();
  if (!user || !tenantId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { postId, action } = (await req.json().catch(() => ({}))) as { postId?: string; action?: string };
  if (!postId || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "postId and a valid action are required." }, { status: 400 });
  }

  const post = await prisma.post.findFirst({ where: { id: postId, tenantId } });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  // Authorisation: super-admin, the owning org's owner, or this center's manager.
  const center = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { organizationId: true } });
  const isOwner = !!center?.organizationId && user.memberships.some((m) => m.role === "owner" && m.organizationId === center.organizationId);
  const isManager = user.memberships.some((m) => m.centerId === tenantId && m.role === "manager");
  if (user.platformRole !== "superadmin" && !isOwner && !isManager) {
    return NextResponse.json({ error: "You don't have permission to approve content." }, { status: 403 });
  }

  const actorName = user.name ?? user.username;
  if (action === "reject") {
    await prisma.post.delete({ where: { id: postId } });
    await audit({ organizationId: center?.organizationId, centerId: tenantId, actorUserId: user.id, actorName, action: "content.reject", detail: `Rejected "${post.title}"` });
    return NextResponse.json({ ok: true, rejected: true });
  }
  // Approve → becomes a normal draft the center can publish/schedule as usual.
  await prisma.post.update({ where: { id: postId }, data: { approvalStatus: "approved" } });
  await audit({ organizationId: center?.organizationId, centerId: tenantId, actorUserId: user.id, actorName, action: "content.approve", detail: `Approved "${post.title}"` });
  return NextResponse.json({ ok: true, approved: true });
}
