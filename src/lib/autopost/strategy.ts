// ───────────────────────────────────────────────────────────────
// Auto-content STRATEGY. Thinks like a seasoned digital-marketing
// strategist planning a local business's weekly content calendar:
//
//  • A 3-posts-per-week base rhythm built on CONTENT PILLARS that walk
//    the audience down the funnel, instead of random promo spam:
//       Mon — EDUCATE        (value: start the week with a useful tip)
//       Wed — PROOF/EDUCATE  (trust · alternates each week)
//       Sat — OFFER          (demo/admission with a clear CTA · weekend,
//                             published as a multi-image SLIDESHOW)
//    3 quality posts/week is the sweet spot for a local Page: Meta's
//    algorithm rewards CONSISTENCY, and daily posting dilutes reach. A
//    pure "book now" every post burns the audience; this mix keeps reach
//    healthy AND drives enquiries.
//
//  • When a FESTIVAL falls in the week it's added as a bonus community/
//    brand post (not selling — the trust that makes OFFERs convert).
//
//  • Evening prime time (8:00 PM IST): parents home, kids' study hour,
//    Indian FB engagement peaks 8–10 PM.
//
//  • Topics ROTATE through a per-vertical bank so nothing repeats for
//    weeks, and the Wed slot alternates Educate/Proof so all pillars air.
// ───────────────────────────────────────────────────────────────
import type { BusinessType } from "@/lib/types";

export type Pillar = "educate" | "proof" | "offer";

// ── Per-center schedule config (stored on Tenant.autoPostConfig as JSON). ──
// Everything is optional; DEFAULTS give the strategist's recommended rhythm:
// Mon/Wed/Sat at 8 PM IST, weekly, ongoing, with a weekend slideshow +
// festival greetings.
export interface AutoPostConfig {
  days?: number[]; // days of week, 0=Sun … 6=Sat (IST)
  time?: string; // "HH:mm" 24h, IST
  frequency?: "weekly" | "fortnightly" | "monthly"; // monthly = first week of the month
  startDate?: string; // "YYYY-MM-DD" (IST) — post only from this date (inclusive)
  endDate?: string; // "YYYY-MM-DD" (IST) — stop after this date (inclusive)
  slideshow?: boolean; // publish the OFFER post as a multi-image slideshow
  festivals?: boolean; // add festival greeting posts
  reelSlot?: boolean; // leave a weekly REEL PLACEHOLDER draft (caption ready, owner adds the clip)
}

export const DEFAULT_AUTOPOST: Required<AutoPostConfig> = {
  days: [1, 3, 6],
  time: "20:00",
  frequency: "weekly",
  startDate: "",
  endDate: "",
  slideshow: true,
  festivals: true,
  reelSlot: true,
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

// Accept whatever JSON is in the DB / request body and return a safe, complete config.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeAutoPostConfig(raw: any): Required<AutoPostConfig> {
  const c = raw && typeof raw === "object" ? raw : {};
  const days: number[] = Array.isArray(c.days)
    ? Array.from(new Set<number>(c.days.map(Number).filter((d: number) => Number.isInteger(d) && d >= 0 && d <= 6))).sort()
    : DEFAULT_AUTOPOST.days;
  return {
    days: days.length ? days : DEFAULT_AUTOPOST.days,
    time: typeof c.time === "string" && TIME_RE.test(c.time) ? c.time : DEFAULT_AUTOPOST.time,
    frequency: c.frequency === "fortnightly" || c.frequency === "monthly" ? c.frequency : "weekly",
    startDate: typeof c.startDate === "string" && DATE_RE.test(c.startDate) ? c.startDate : "",
    endDate: typeof c.endDate === "string" && DATE_RE.test(c.endDate) ? c.endDate : "",
    slideshow: c.slideshow !== false,
    festivals: c.festivals !== false,
    reelSlot: c.reelSlot !== false,
  };
}

const IST_OFFSET_MS = 5.5 * 3600_000;

// A given IST calendar date + the config's IST wall-clock time → UTC instant.
export function istSlotTime(istDate: { y: number; m: number; d: number }, time: string): Date {
  const [h, min] = time.split(":").map(Number);
  return new Date(Date.UTC(istDate.y, istDate.m, istDate.d, h, min) - IST_OFFSET_MS);
}

// Topic prompts fed to the caption AI, phrased as a brief to a copywriter. Each
// pillar is a rotating bank; the week index selects one so topics cycle.
const BANKS: Partial<Record<BusinessType, Record<Pillar, string[]>>> = {
  abacus: {
    educate: [
      "How abacus training sharpens a child's concentration and memory — explain the benefit warmly to parents",
      "Why mental maths gives kids a real edge in school exams and everyday life",
      "Turn screen time into brain time — abacus as a productive after-school habit",
      "The right age to start abacus (5–12) and why early training matters most",
      "How abacus builds a child's confidence and lightning-fast calculation",
      "Left brain + right brain: how abacus develops both for all-round growth",
    ],
    proof: [
      "Celebrate a student who solved 50 sums in 2 minutes — invite parents to see what's possible",
      "Congratulate our district-level abacus competition winners with pride",
      "Share a parent's words on how their child improved in maths after joining us",
      "Level-up / certificate day highlights — proud moments from our centre",
      "From shy to confident: a student's journey to becoming a quick calculator",
      "A day at our centre — happy, focused kids learning with the abacus",
    ],
    offer: [
      "Free abacus demo class this week for ages 5–12 — limited seats, book now",
      "New batch admission open — reserve your child's seat today",
      "Refer a friend to our next free demo class — both families benefit",
      "Affordable monthly fees — enrol this week and give your child a head start",
      "Weekend speed-maths workshop — register now, only a few spots left",
      "Admissions closing soon for this batch — book a free demo before seats fill",
    ],
  },
};

// Generic fallback for any vertical without a tailored bank.
const GENERIC: Record<Pillar, string[]> = {
  educate: [
    "Share a genuinely useful tip your audience will value",
    "Explain a key benefit of your service in simple, warm words",
  ],
  proof: [
    "Highlight a happy customer or a real success story",
    "Show a proud, authentic moment from your business",
  ],
  offer: [
    "Invite people to a free trial or demo this week with a clear call to action",
    "Announce a limited-time offer and how to book",
  ],
};

// Rotating topic for a given vertical + pillar + week.
export function topicFor(type: BusinessType, pillar: Pillar, weekIndex: number): string {
  const bank = BANKS[type]?.[pillar] ?? GENERIC[pillar];
  return bank[((weekIndex % bank.length) + bank.length) % bank.length];
}

// Week number since epoch — advances every 7 days so the topic bank cycles.
export function weekIndex(d: Date): number {
  return Math.floor(d.getTime() / (7 * 86_400_000));
}

const PILLARS: Pillar[] = ["educate", "proof", "offer"];

export interface Slot {
  at: Date;
  pillar: Pillar;
  carousel: boolean; // publish as a multi-image slideshow
}

// The upcoming slots (strictly in the future, within `withinDays`) for a
// center's schedule config. Pillars rotate across the selected days AND across
// weeks so content stays varied even on a 1-day-a-week schedule. Generating a
// few days ahead is what gives the owner a review window before posts go live.
export function upcomingSlots(from: Date, config?: AutoPostConfig | null, withinDays = 9): Slot[] {
  const cfg = normalizeAutoPostConfig(config);
  const out: Slot[] = [];
  const istFrom = new Date(from.getTime() + IST_OFFSET_MS);
  for (let i = 0; i <= withinDays; i++) {
    // Walk IST calendar days — day-of-week and date-range checks are IST-local.
    const istDay = new Date(Date.UTC(istFrom.getUTCFullYear(), istFrom.getUTCMonth(), istFrom.getUTCDate() + i));
    const pos = cfg.days.indexOf(istDay.getUTCDay());
    if (pos === -1) continue;
    const dateStr = istDay.toISOString().slice(0, 10);
    if (cfg.startDate && dateStr < cfg.startDate) continue;
    if (cfg.endDate && dateStr > cfg.endDate) continue;
    const at = istSlotTime({ y: istDay.getUTCFullYear(), m: istDay.getUTCMonth(), d: istDay.getUTCDate() }, cfg.time);
    if (at.getTime() <= from.getTime()) continue;
    const w = weekIndex(at);
    if (cfg.frequency === "fortnightly" && w % 2 === 1) continue;
    if (cfg.frequency === "monthly" && istDay.getUTCDate() > 7) continue;
    const pillar = PILLARS[(pos + w) % PILLARS.length];
    out.push({ at, pillar, carousel: cfg.slideshow && pillar === "offer" });
  }
  return out;
}

// The weekly REEL-SLOT suggestion: video can't be auto-generated, so the planner
// leaves a placeholder DRAFT (caption/hashtags/music ready) on a day the regular
// schedule doesn't use — the owner attaches a real clip and publishes. Prefers
// Friday, then falls through to any day not already taken by cfg.days.
const REEL_DAY_PREFERENCE = [5, 0, 2, 4, 1, 6, 3];

export function upcomingReelSlots(from: Date, config?: AutoPostConfig | null, withinDays = 9): Date[] {
  const cfg = normalizeAutoPostConfig(config);
  if (!cfg.reelSlot) return [];
  const day = REEL_DAY_PREFERENCE.find((d) => !cfg.days.includes(d)) ?? 5;
  const out: Date[] = [];
  const istFrom = new Date(from.getTime() + 5.5 * 3600_000);
  for (let i = 0; i <= withinDays; i++) {
    const istDay = new Date(Date.UTC(istFrom.getUTCFullYear(), istFrom.getUTCMonth(), istFrom.getUTCDate() + i));
    if (istDay.getUTCDay() !== day) continue;
    const dateStr = istDay.toISOString().slice(0, 10);
    if (cfg.startDate && dateStr < cfg.startDate) continue;
    if (cfg.endDate && dateStr > cfg.endDate) continue;
    const at = istSlotTime({ y: istDay.getUTCFullYear(), m: istDay.getUTCMonth(), d: istDay.getUTCDate() }, cfg.time);
    if (at.getTime() <= from.getTime()) continue;
    const w = weekIndex(at);
    if (cfg.frequency === "fortnightly" && w % 2 === 1) continue;
    if (cfg.frequency === "monthly" && istDay.getUTCDate() > 7) continue;
    out.push(at);
  }
  return out;
}

// Curated, India-relevant stock photo per vertical (public Pexels CDN, no key).
// Mirrors the pool used by /api/image so auto-posts look consistent with manual ones.
const STOCK: Record<string, number[]> = {
  abacus: [8613095, 31864404, 8613089, 8612925, 6692923, 7188764],
  coaching: [35745592, 35745581, 18870256, 35745583, 8617762, 8618062],
  playschool: [4047662, 8612877, 30279471, 17332827, 29279438],
  gym: [5221029, 11661410, 10795063, 13534122, 11439928],
  salon: [17548721, 20826575, 7755209, 11876088, 36874235],
  restaurant: [8818723, 29148133, 17223838, 35008222],
};

export function curatedStock(type: string, pick: number): string | undefined {
  const pool = STOCK[type];
  if (!pool?.length) return undefined;
  const id = pool[((pick % pool.length) + pool.length) % pool.length];
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900&h=900&fit=crop`;
}

// N DISTINCT curated images starting at `pick` — the slides of an auto-generated
// slideshow (multi-photo carousel) post. Fewer if the vertical's pool is small.
export function curatedStockSet(type: string, pick: number, n: number): string[] {
  const pool = STOCK[type];
  if (!pool?.length) return [];
  const count = Math.min(n, pool.length);
  return Array.from({ length: count }, (_, i) => curatedStock(type, pick + i)!) ;
}
