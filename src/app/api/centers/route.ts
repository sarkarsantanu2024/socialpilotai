import { NextResponse } from "next/server";
import { getCurrentUser, listAccessibleCenters } from "@/lib/access";
import { getSession } from "@/lib/session";

// Lists the centers the logged-in user may operate (for the center switcher).
// Optional ?q= filters by center name (used by super-admins with many centers).
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q") ?? undefined;
  const centers = await listAccessibleCenters(user, { search: q, take: 200 });
  const activeCenterId = getSession()?.centerId ?? null;

  return NextResponse.json({
    activeCenterId,
    isSuperadmin: user.platformRole === "superadmin",
    // So the header shows "Owner / HO" even before any center exists (role is
    // otherwise inferred from the centers list, which can be empty).
    isOwner: user.memberships.some((m) => m.role === "owner"),
    centers,
  });
}
