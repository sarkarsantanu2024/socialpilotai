import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/access";
import { createInvite } from "@/lib/org";
import { audit } from "@/lib/audit";

// Create an invite link. Body: { role, centerId?, email?, orgId? }.
// Returns the shareable link — the recipient sets their own password (no
// credentials are ever shared).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  try {
    const invite = await createInvite(user, {
      orgId: body.orgId,
      role: body.role,
      centerId: body.centerId,
      email: body.email,
    });
    await audit({ organizationId: invite.organizationId, actorUserId: user.id, actorName: user.name ?? user.username, action: "invite.create", detail: `Invited a ${invite.role}${invite.email ? ` (${invite.email})` : ""}` });
    const link = new URL(`/invite/${invite.token}`, new URL(req.url).origin).toString();
    return NextResponse.json({ ok: true, id: invite.id, token: invite.token, link });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
