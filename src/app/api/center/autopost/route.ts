import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/currentTenant";
import { planForCenter } from "@/lib/billing";
import { can } from "@/lib/plans";
import { normalizeAutoPostConfig } from "@/lib/autopost/strategy";

// Toggle + configure the auto-content engine for the ACTIVE center (opt-in,
// default off). When on, the plan cron generates & schedules this center's
// posts per the stored schedule (days, IST time, frequency, date range,
// slideshow/festival toggles).
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

  // Sanitize whatever the client sent into a complete, safe config. An end date
  // before the start date would silently schedule nothing — reject it instead.
  const config = normalizeAutoPostConfig(b.config);
  if (config.startDate && config.endDate && config.endDate < config.startDate) {
    return NextResponse.json({ error: "The end date is before the start date." }, { status: 400 });
  }

  await prisma.tenant.update({ where: { id: tenant.id }, data: { autoPost, autoPostConfig: config } });
  return NextResponse.json({ ok: true, autoPost, config });
}
