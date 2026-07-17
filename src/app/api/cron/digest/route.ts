import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";

// Weekly plain-language digest. An external scheduler (Vercel Cron) hits this once
// a week; for every center with activity it drops an in-app notification
// summarising the week (posts published, new leads, posts scheduled ahead).
//
// Delivery is IN-APP only. Email/WhatsApp delivery of this digest needs a provider
// (none is configured), so that's a separate follow-up.
export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get("authorization")?.replace("Bearer ", "") || searchParams.get("secret");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date(Date.parse(searchParams.get("now") ?? "") || Date.now());
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  // Cheap DB aggregates only (no live Facebook fetch → safe to run over many centers).
  const [published, leads, scheduled] = await Promise.all([
    prisma.post.groupBy({ by: ["tenantId"], where: { status: "published", publishedAt: { gte: weekAgo } }, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["tenantId"], where: { createdAt: { gte: weekAgo } }, _count: { _all: true } }),
    prisma.post.groupBy({ by: ["tenantId"], where: { status: "scheduled", scheduledAt: { gte: now } }, _count: { _all: true } }),
  ]);

  const pubMap = new Map(published.map((r) => [r.tenantId, r._count._all]));
  const leadMap = new Map(leads.map((r) => [r.tenantId, r._count._all]));
  const schedMap = new Map(scheduled.map((r) => [r.tenantId, r._count._all]));

  const ids = Array.from(
    new Set<string>([
      ...Array.from(pubMap.keys()),
      ...Array.from(leadMap.keys()),
      ...Array.from(schedMap.keys()),
    ])
  );

  let sent = 0;
  for (const id of ids) {
    const p = pubMap.get(id) ?? 0;
    const l = leadMap.get(id) ?? 0;
    const s = schedMap.get(id) ?? 0;

    const parts: string[] = [];
    if (p) parts.push(`${p} post${p === 1 ? "" : "s"} published`);
    if (l) parts.push(`${l} new lead${l === 1 ? "" : "s"}`);

    const body = parts.length
      ? `This week: ${parts.join(" · ")}.${s ? ` ${s} post${s === 1 ? "" : "s"} scheduled ahead.` : ""}`
      : `${s} post${s === 1 ? "" : "s"} scheduled for the week ahead.`;

    await notify(id, { title: "📊 Your weekly summary", body, type: "info", href: "/analytics" });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
