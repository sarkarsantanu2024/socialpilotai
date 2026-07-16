import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/access";
import { canAdminOrg, primaryOrgId, createCenter, bulkCreateCenters } from "@/lib/org";
import { centerLimit } from "@/lib/plans";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

// Create one center, or many at once (bulk onboarding). Only the org's owner/HO
// or a super-admin may add centers to an organization.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const orgId: string | null = body.orgId ?? primaryOrgId(user);
  if (!orgId) return NextResponse.json({ error: "No organization to add centers to." }, { status: 400 });
  if (!(await canAdminOrg(user, orgId))) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  // Branch limit by plan: free & single = 1 branch, Head Office = many.
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, _count: { select: { centers: true } } },
  });
  const limit = centerLimit(org?.plan);
  const existing = org?._count.centers ?? 0;
  const adding = Array.isArray(body.centers) ? body.centers.length : 1;
  if (existing + adding > limit) {
    return NextResponse.json(
      {
        error: `Your plan includes ${limit} branch${limit === 1 ? "" : "es"}. Upgrade to Head Office to add more branches.`,
        upgrade: true,
      },
      { status: 403 }
    );
  }

  const actorName = user.name ?? user.username;
  try {
    if (Array.isArray(body.centers)) {
      const { created } = await bulkCreateCenters(orgId, body.centers);
      await audit({ organizationId: orgId, actorUserId: user.id, actorName, action: "center.bulk_create", detail: `Added ${created} centers` });
      return NextResponse.json({ ok: true, created });
    }
    const center = await createCenter(orgId, body);
    await audit({ organizationId: orgId, centerId: center.id, actorUserId: user.id, actorName, action: "center.create", detail: `Added center "${body.name}"` });
    return NextResponse.json({ ok: true, centerId: center.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
