import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/access";
import { getRollup } from "@/lib/rollup";

// Cross-center performance for the HO / super-admin.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const orgId = new URL(req.url).searchParams.get("orgId") ?? undefined;
  const data = await getRollup(user, orgId);
  if (!data) return NextResponse.json({ centers: [], totals: null });
  return NextResponse.json(data);
}
