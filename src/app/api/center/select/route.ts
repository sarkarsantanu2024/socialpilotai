import { NextResponse } from "next/server";
import { getCurrentUser, canAccessCenter } from "@/lib/access";
import { setActiveCenter, HO_MODE } from "@/lib/session";

// Switch the active center. The user must have access to it (super-admin, the
// owning org's HO, or a manager/staff assigned to it) — enforced server-side.
// { headOffice: true } switches an owner/super-admin to Head-office (org-wide) mode.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { centerId, headOffice } = (await req.json().catch(() => ({}))) as { centerId?: string; headOffice?: boolean };

  if (headOffice) {
    const isOwnerOrAdmin = user.platformRole === "superadmin" || user.memberships.some((m) => m.role === "owner");
    if (!isOwnerOrAdmin) return NextResponse.json({ error: "Only head office can do that." }, { status: 403 });
    setActiveCenter(HO_MODE);
    return NextResponse.json({ ok: true });
  }

  if (!centerId) return NextResponse.json({ error: "centerId is required." }, { status: 400 });
  if (!(await canAccessCenter(user, centerId))) {
    return NextResponse.json({ error: "You don't have access to that center." }, { status: 403 });
  }

  setActiveCenter(centerId);
  return NextResponse.json({ ok: true });
}
