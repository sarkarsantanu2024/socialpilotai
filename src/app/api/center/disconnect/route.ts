import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/access";
import { canAdminOrg } from "@/lib/org";
import { disconnect } from "@/lib/fb/connection";
import { prisma } from "@/lib/db";

// Disconnect Facebook for a SPECIFIC center from the HO console. Removes that
// center's pages + tokens. Only an owner/HO (or super-admin) of the center's org
// may do this.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { centerId } = (await req.json().catch(() => ({}))) as { centerId?: string };
  if (!centerId) return NextResponse.json({ error: "Missing centerId." }, { status: 400 });

  const center = await prisma.tenant.findUnique({ where: { id: centerId }, select: { organizationId: true } });
  if (!center?.organizationId) return NextResponse.json({ error: "Center not found." }, { status: 404 });
  if (!(await canAdminOrg(user, center.organizationId))) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  await disconnect(centerId).catch(() => {});
  return NextResponse.json({ ok: true });
}
