import { NextResponse } from "next/server";
import { getCurrentUser, canAccessCenter } from "@/lib/access";
import { setActiveCenter } from "@/lib/session";

// Switch the active center. The user must have access to it (super-admin, the
// owning org's HO, or a manager/staff assigned to it) — enforced server-side.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { centerId } = (await req.json().catch(() => ({}))) as { centerId?: string };
  if (!centerId) return NextResponse.json({ error: "centerId is required." }, { status: 400 });
  if (!(await canAccessCenter(user, centerId))) {
    return NextResponse.json({ error: "You don't have access to that center." }, { status: 403 });
  }

  setActiveCenter(centerId);
  return NextResponse.json({ ok: true });
}
