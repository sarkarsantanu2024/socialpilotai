// ───────────────────────────────────────────────────────────────
// Auto-content STRATEGY. Thinks like a seasoned digital-marketing
// strategist planning a local business's weekly content calendar:
//
//  • A 2-posts-per-week base rhythm built on CONTENT PILLARS that walk
//    the audience down the funnel, instead of random promo spam:
//       Wed — EDUCATE/PROOF  (value & trust · alternates each week)
//       Sat — OFFER          (demo/admission with a clear CTA · weekend)
//    2–3 quality posts/week is the sweet spot for a local Page: Meta's
//    algorithm rewards CONSISTENCY, and daily posting dilutes reach. A
//    pure "book now" every post burns the audience; this mix keeps reach
//    healthy AND drives enquiries.
//
//  • When a FESTIVAL falls in the week it becomes the natural 3rd post
//    (community/brand, not selling — the trust that makes OFFERs convert).
//    No festival that week → 2 posts, which does NOT hurt reach.
//
//  • Evening prime time (8:00 PM IST): parents home, kids' study hour,
//    Indian FB engagement peaks 8–10 PM.
//
//  • Topics ROTATE through a per-vertical bank so nothing repeats for
//    weeks, and the Wed slot alternates Educate/Proof so all pillars air.
// ───────────────────────────────────────────────────────────────
import type { BusinessType } from "@/lib/types";

export type Pillar = "educate" | "proof" | "offer";

// Base rhythm: 2 posts/week, well spaced. JS getUTCDay() → 3=Wed, 6=Sat.
// The Wed slot alternates its pillar by week so Educate and Proof both air.
export const WEEKLY_PLAN: { day: number; pillars: Pillar[] }[] = [
  { day: 3, pillars: ["educate", "proof"] },
  { day: 6, pillars: ["offer"] },
];

// 20:00 IST == 14:30 UTC (IST = UTC+5:30). 20:00 < 24, so no date shift.
export const POST_HOUR_UTC = 14;
export const POST_MIN_UTC = 30;

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

// The upcoming Wed/Sat 8 PM IST slots strictly in the future, within the next
// `withinDays`. The Wed slot's pillar alternates by week. Generating a few days
// ahead is what gives the owner a review window before posts go live.
export function upcomingSlots(from: Date, withinDays = 9): { at: Date; pillar: Pillar }[] {
  const out: { at: Date; pillar: Pillar }[] = [];
  for (let i = 0; i <= withinDays; i++) {
    const d = new Date(from.getTime() + i * 86_400_000);
    const plan = WEEKLY_PLAN.find((p) => p.day === d.getUTCDay());
    if (!plan) continue;
    const at = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), POST_HOUR_UTC, POST_MIN_UTC, 0));
    if (at.getTime() <= from.getTime()) continue;
    const pillar = plan.pillars[weekIndex(at) % plan.pillars.length];
    out.push({ at, pillar });
  }
  return out;
}

// Curated, India-relevant stock photo per vertical (public Pexels CDN, no key).
// Mirrors the pool used by /api/image so auto-posts look consistent with manual ones.
const STOCK: Record<string, number[]> = {
  abacus: [8613095, 31864404, 1019470, 8612925, 6692923, 7188764],
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
