"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Festival, Post } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CalendarClient({ posts, festivals }: { posts: Post[]; festivals: Festival[] }) {
  // default June 2026 (demo "today")
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5); // 0-indexed → June

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = "2026-06-03";

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function postsOn(key: string) {
    return posts.filter((p) => (p.scheduledAt ?? p.publishedAt ?? "").startsWith(key));
  }
  function festivalOn(key: string) {
    return festivals.find((f) => f.date === key);
  }

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 p-4">
        <h2 className="text-lg font-bold">{MONTHS[month]} {year}</h2>
        <div className="flex items-center gap-2">
          <div className="hidden gap-3 text-xs text-ink-500 sm:flex">
            <Legend color="bg-emerald-500" label="Published" />
            <Legend color="bg-brand-500" label="Scheduled" />
            <Legend color="bg-amber-500" label="Festival" />
          </div>
          <button onClick={() => shift(-1)} className="rounded-lg border border-ink-200 p-1.5 hover:bg-ink-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => shift(1)} className="rounded-lg border border-ink-200 p-1.5 hover:bg-ink-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-ink-100 bg-ink-50 text-center text-xs font-semibold text-ink-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="min-h-[64px] border-b border-r border-ink-100 bg-ink-50/40 sm:min-h-[110px]" />;
          const key = toKey(year, month, d);
          const dayPosts = postsOn(key);
          const fest = festivalOn(key);
          const isToday = key === today;
          return (
            <div key={i} className={cn("min-h-[64px] border-b border-r border-ink-100 p-1.5 sm:min-h-[110px] sm:p-2", isToday && "bg-brand-50/50")}>
              <div className="flex items-center justify-between">
                <span className={cn("grid h-6 w-6 place-items-center rounded-full text-xs font-medium", isToday ? "bg-brand-600 text-white" : "text-ink-500")}>
                  {d}
                </span>
                {fest && <span className="text-base leading-none" title={fest.name}>{fest.emoji}</span>}
              </div>

              <div className="mt-1 space-y-1">
                {fest && (
                  <p className="hidden truncate rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 sm:block">
                    {fest.name}
                  </p>
                )}
                {dayPosts.map((p) => (
                  <p
                    key={p.id}
                    className={cn(
                      "truncate rounded px-1.5 py-0.5 text-[10px] font-medium",
                      p.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-brand-50 text-brand-700"
                    )}
                    title={p.title}
                  >
                    <span className="hidden sm:inline">{p.title}</span>
                    <span className="sm:hidden">•</span>
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} /> {label}
    </span>
  );
}
