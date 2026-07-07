import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/access";
import { getOrgOverview } from "@/lib/org";

// Management overview (centers + members + pending invites) for the org the
// caller administers (HO owner or super-admin). Used by /organization.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const orgId = new URL(req.url).searchParams.get("orgId") ?? undefined;
  const overview = await getOrgOverview(user, orgId);
  if (!overview) return NextResponse.json({ error: "No organization to manage." }, { status: 403 });
  return NextResponse.json(overview);
}
