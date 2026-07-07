// Derive REAL insight series (trend, best times/days) from a center's own posts
// and their analytics. Returns EMPTY arrays when there isn't enough real data —
// so the UI shows an honest empty state instead of dummy numbers.
import type { Post, PostAnalytics } from "@/lib/types";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const eng = (a?: PostAnalytics) => (a ? a.reactions + a.comments + a.shares : 0);

export interface TrendPoint { label: string; reach: number; engagement: number }

/** Weekly reach + engagement, built from published posts. Empty if < 2 weeks. */
export function weeklyTrend(posts: Post[], analytics: PostAnalytics[]): TrendPoint[] {
  const byWeek = new Map<string, { reach: number; engagement: number; t: number }>();
  for (const p of posts) {
    if (p.status !== "published" || !p.publishedAt) continue;
    const d = new Date(p.publishedAt);
    if (isNaN(d.getTime())) continue;
    // Bucket to the week's Monday.
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = `${monday.getDate()} ${MON[monday.getMonth()]}`;
    const a = analytics.find((x) => x.postId === p.id);
    const cur = byWeek.get(key) ?? { reach: 0, engagement: 0, t: monday.getTime() };
    cur.reach += a?.reach ?? 0;
    cur.engagement += eng(a);
    byWeek.set(key, cur);
  }
  const arr = Array.from(byWeek.entries())
    .map(([label, v]) => ({ label, reach: v.reach, engagement: v.engagement, t: v.t }))
    .sort((a, b) => a.t - b.t)
    .map(({ label, reach, engagement }) => ({ label, reach, engagement }));
  return arr.length >= 2 ? arr : [];
}

export interface BarPoint { label: string; value: number }

const TIME_BUCKETS = [
  { label: "6am", h: 6 }, { label: "9am", h: 9 }, { label: "12pm", h: 12 },
  { label: "3pm", h: 15 }, { label: "6pm", h: 18 }, { label: "9pm", h: 21 },
];

/** Engagement by time-of-day bucket. Empty if no published posts. */
export function bestTimes(posts: Post[], analytics: PostAnalytics[]): { data: BarPoint[]; highlight: number } {
  const vals = TIME_BUCKETS.map((b) => ({ label: b.label, value: 0 }));
  let any = false;
  for (const p of posts) {
    if (!p.publishedAt) continue;
    const d = new Date(p.publishedAt);
    if (isNaN(d.getTime())) continue;
    any = true;
    const a = analytics.find((x) => x.postId === p.id);
    const hr = d.getHours();
    let idx = 0, best = 99;
    TIME_BUCKETS.forEach((b, i) => { const diff = Math.abs(b.h - hr); if (diff < best) { best = diff; idx = i; } });
    vals[idx].value += eng(a) + 1;
  }
  const highlight = vals.reduce((mi, v, i, arr) => (v.value > arr[mi].value ? i : mi), 0);
  return { data: any ? vals : [], highlight };
}

/** Engagement by weekday. Empty if no published posts. */
export function bestDays(posts: Post[], analytics: PostAnalytics[]): { data: BarPoint[]; highlight: number } {
  const order = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  const vals = order.map((d) => ({ label: DOW[d], value: 0, dow: d }));
  let any = false;
  for (const p of posts) {
    if (!p.publishedAt) continue;
    const d = new Date(p.publishedAt);
    if (isNaN(d.getTime())) continue;
    any = true;
    const a = analytics.find((x) => x.postId === p.id);
    const slot = vals.find((v) => v.dow === d.getDay());
    if (slot) slot.value += eng(a) + 1;
  }
  const data = vals.map(({ label, value }) => ({ label, value }));
  const highlight = data.reduce((mi, v, i, arr) => (v.value > arr[mi].value ? i : mi), 0);
  return { data: any ? data : [], highlight };
}

/** Reach growth % between the first and last trend points (0 if not enough data). */
export function growthPct(trend: TrendPoint[]): number {
  if (trend.length < 2) return 0;
  const first = trend[0].reach, last = trend[trend.length - 1].reach;
  if (!first) return 0;
  return Math.round(((last - first) / first) * 100);
}
