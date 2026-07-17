import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/currentTenant";
import { planForCenter } from "@/lib/billing";
import { can } from "@/lib/plans";

// Toggle the weekly auto-content engine for the ACTIVE center (opt-in, default
// off). When on, the plan cron generates & schedules this center's posts.
export async function POST(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const autoPost = !!b.autoPost;

  // Auto-posting is a paid (Head Office) feature; turning it OFF is always allowed.
  if (autoPost) {
    const plan = await planForCenter(tenant.id);
    if (!can(plan, "autopost")) {
      return NextResponse.json(
        { error: "Auto-posting is a Head Office feature. Upgrade to enable it.", upgrade: true },
        { status: 403 }
      );
    }
  }

  await prisma.tenant.update({ where: { id: tenant.id }, data: { autoPost } });
  return NextResponse.json({ ok: true, autoPost });
}
