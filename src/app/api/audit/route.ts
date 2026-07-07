import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/access";
import { canAdminOrg, primaryOrgId } from "@/lib/org";
import { listAudit } from "@/lib/audit";

// Activity log for the org the caller administers (HO owner / super-admin).
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const orgId = new URL(req.url).searchParams.get("orgId") ?? primaryOrgId(user);
  if (!orgId || !(await canAdminOrg(user, orgId))) return NextResponse.json({ entries: [] });
  return NextResponse.json({ entries: await listAudit(orgId) });
}
