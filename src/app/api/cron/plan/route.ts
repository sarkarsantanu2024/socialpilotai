import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateVariations, generateFestivalPost } from "@/lib/ai";
import { upcomingFestivals, daysUntil } from "@/lib/festivals";
import {
  upcomingSlots,
  weekIndex,
  topicFor,
  curatedStock,
  curatedStockSet,
  normalizeAutoPostConfig,
  istSlotTime,
} from "@/lib/autopost/strategy";
import { posterConfigured, renderBrandedPoster } from "@/lib/design/poster";
import type { BusinessProfile, BusinessType } from "@/lib/types";

// Auto-content planner. An external scheduler (Vercel Cron) hits this daily; for
// every OPT-IN center with a connected Page it ensures the upcoming week's 3
// pillar posts (Mon/Wed/Sat 8 PM IST — Sat as a multi-image slideshow) + any
// imminent festival post exist as SCHEDULED drafts. The owner can review/edit/delete them in Posts → Scheduled
// before the publish cron sends them at the due time. Idempotent (safe to run
// daily) and budgeted (never generates so much it times out — daily runs top up).
export const maxDuration = 60;

// Cap AI generations per invocation so a big franchise can't blow the function
// timeout. Idempotency means the next daily run continues where this left off.
const MAX_GEN_PER_RUN = 10;

function toProfile(bp: {
  id: string; name: string; type: string; city: string; language: string; tone: string; audience: string;
}): BusinessProfile {
  return {
    id: bp.id,
    name: bp.name,
    type: bp.type as BusinessType,
    city: bp.city,
    language: bp.language,
    tone: bp.tone,
    audience: bp.audience,
  };
}

function dayBounds(d: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get("authorization")?.replace("Bearer ", "") || searchParams.get("secret");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date(Date.parse(searchParams.get("now") ?? "") || Date.now());

  // Opt-in centers that have a connected Page (no point scheduling for a center
  // that can't publish). Cap the centers scanned per run.
  const centers = await prisma.tenant.findMany({
    where: { autoPost: true, pages: { some: { connected: true } } },
    include: { businessProfile: true, brandKit: true },
    take: 100,
  });

  let generated = 0;
  const created: { tenantId: string; kind: string; scheduledAt: string }[] = [];
  const skippedNoProfile: string[] = [];

  for (const center of centers) {
    if (generated >= MAX_GEN_PER_RUN) break;
    const bp = center.businessProfile;
    if (!bp) {
      skippedNoProfile.push(center.id);
      continue;
    }
    const profile = toProfile(bp);
    const type = profile.type;
    // Per-center schedule (days/time/frequency/date-range/toggles) with defaults.
    const cfg = normalizeAutoPostConfig(center.autoPostConfig);

    // ---- Weekly pillar posts ----
    for (const slot of upcomingSlots(now, cfg)) {
      if (generated >= MAX_GEN_PER_RUN) break;
      const { start, end } = dayBounds(slot.at);
      const exists = await prisma.post.findFirst({
        where: { tenantId: center.id, source: "auto", scheduledAt: { gte: start, lt: end } },
        select: { id: true },
      });
      if (exists) continue;

      const topic = topicFor(type, slot.pillar, weekIndex(slot.at));
      let variation;
      try {
        [variation] = await generateVariations({ prompt: topic, type: "image", profile });
      } catch {
        continue; // AI hiccup — try again on the next daily run
      }
      if (!variation) continue;

      // Visuals. The OFFER post can go out as a multi-image SLIDESHOW
      // (3 curated photos → a real Facebook carousel); other slots use a single
      // photo, optionally composed into a branded poster (Placid).
      const pick = weekIndex(slot.at) + slot.at.getUTCDay();
      const slides = slot.carousel ? curatedStockSet(type, pick, 3) : [];
      const bg = slides[0] ?? curatedStock(type, pick);
      let assetUrl: string | null = bg ?? null;
      if (!slides.length && posterConfigured()) {
        const poster = await renderBrandedPoster({
          headline: variation.title,
          subline: [bp.name, bp.city].filter(Boolean).join(" · "),
          cta: variation.cta,
          backgroundUrl: bg,
          logoUrl: center.brandKit?.logoUrl ?? undefined,
        });
        if (poster) assetUrl = poster;
      }

      await prisma.post.create({
        data: {
          tenantId: center.id,
          type: "image",
          status: "scheduled",
          approvalStatus: "approved",
          source: "auto",
          title: variation.title.slice(0, 80) || "Scheduled post",
          caption: variation.caption,
          hashtags: variation.hashtags,
          assetUrl,
          assetUrls: slides.length > 1 ? slides : [],
          scheduledAt: slot.at,
        },
      });
      generated++;
      created.push({ tenantId: center.id, kind: `weekly:${slot.pillar}`, scheduledAt: slot.at.toISOString() });
    }

    // ---- Festival post (imminent, community/brand bonus post; capped at 1 and
    // opt-out via the center's config) ----
    for (const fest of cfg.festivals ? upcomingFestivals(now, 6, 1) : []) {
      if (generated >= MAX_GEN_PER_RUN) break;
      const d = daysUntil(fest.date, now);
      if (d < 0) continue;
      // Same publish time-of-day the center chose for its regular posts.
      const [fy, fm, fd] = fest.date.split("-").map(Number);
      const festAt = istSlotTime({ y: fy, m: fm - 1, d: fd }, cfg.time);
      if (festAt.getTime() <= now.getTime()) continue; // already past today's slot
      if (cfg.startDate && fest.date < cfg.startDate) continue;
      if (cfg.endDate && fest.date > cfg.endDate) continue;
      const { start, end } = dayBounds(festAt);
      const exists = await prisma.post.findFirst({
        where: { tenantId: center.id, source: "auto-festival", scheduledAt: { gte: start, lt: end } },
        select: { id: true },
      });
      if (exists) continue;

      let post;
      try {
        post = await generateFestivalPost({ festival: { name: fest.name, blurb: fest.blurb }, profile });
      } catch {
        continue;
      }

      const fbg = curatedStock(type, weekIndex(festAt));
      let fAsset: string | null = fbg ?? null;
      if (posterConfigured()) {
        const poster = await renderBrandedPoster({
          headline: post.title,
          subline: [bp.name, bp.city].filter(Boolean).join(" · "),
          backgroundUrl: fbg,
          logoUrl: center.brandKit?.logoUrl ?? undefined,
        });
        if (poster) fAsset = poster;
      }

      await prisma.post.create({
        data: {
          tenantId: center.id,
          type: "image",
          status: "scheduled",
          approvalStatus: "approved",
          source: "auto-festival",
          title: post.title.slice(0, 80) || `${fest.name} greetings`,
          caption: post.caption,
          hashtags: post.hashtags,
          assetUrl: fAsset,
          scheduledAt: festAt,
        },
      });
      generated++;
      created.push({ tenantId: center.id, kind: `festival:${fest.name}`, scheduledAt: festAt.toISOString() });
    }
  }

  return NextResponse.json({
    ranAt: now.toISOString(),
    centersScanned: centers.length,
    generated,
    created,
    skippedNoProfile,
    budgetReached: generated >= MAX_GEN_PER_RUN,
  });
}
