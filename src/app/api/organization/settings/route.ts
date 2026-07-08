import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/access";
import { primaryOrgId, updateOrgSettings, applyOrgBrandToAllCenters } from "@/lib/org";
import { audit } from "@/lib/audit";

// Edit head-office identity (org name) + default brand kit new centers inherit.
// Owner/HO or super-admin only.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const orgId: string | null = body.orgId ?? primaryOrgId(user);
  if (!orgId) return NextResponse.json({ error: "No organization to edit." }, { status: 400 });

  try {
    await updateOrgSettings(user, orgId, body);
    // Optionally cascade the HO brand onto every existing center.
    let applied = 0;
    if (body.applyToAll) {
      applied = (await applyOrgBrandToAllCenters(user, orgId)).count;
    }
    await audit({
      organizationId: orgId,
      actorUserId: user.id,
      actorName: user.name ?? user.username,
      action: "org.settings",
      detail: body.applyToAll ? `Updated head-office settings + applied brand to ${applied} centers` : "Updated head-office settings",
    });
    return NextResponse.json({ ok: true, applied });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
