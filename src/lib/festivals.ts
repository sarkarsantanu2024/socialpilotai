// Real Indian festival calendar helpers. The dated list lives in lib/demo/data
// (it's a real 2026 calendar, not mock analytics) — these helpers surface the
// upcoming ones so the app can proactively nudge festival posts.
import { festivals } from "@/lib/demo/data";
import type { Festival } from "@/lib/types";

function tsOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getTime();
}

/** Whole days from `from` until the given date (0 = today, negative = past). */
export function daysUntil(dateStr: string, from: Date = new Date()): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  return Math.round((tsOf(dateStr) - start) / 86400000);
}

/** Festivals falling within the next `withinDays`, soonest first. */
export function upcomingFestivals(from: Date = new Date(), withinDays = 30, limit = 3): Festival[] {
  return festivals
    .filter((f) => {
      const d = daysUntil(f.date, from);
      return d >= 0 && d <= withinDays;
    })
    .sort((a, b) => tsOf(a.date) - tsOf(b.date))
    .slice(0, limit);
}
