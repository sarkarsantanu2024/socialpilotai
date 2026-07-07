"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, CalendarHeart, Check, RefreshCw, ArrowRight } from "lucide-react";

type Festival = { name: string; emoji: string; blurb: string; date: string };
type Post = { title: string; caption: string; hashtags: string[] };

export function UpcomingFestival({ festival, daysAway }: { festival: Festival; daysAway: number }) {
  const [post, setPost] = useState<Post | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function generate() {
    setBusy(true); setSaved(false);
    const res = await fetch("/api/festival-post", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: festival.name, blurb: festival.blurb }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (data.ok) setPost(data.post);
  }

  async function saveDraft() {
    if (!post) return;
    setBusy(true);
    const caption = `${post.caption}\n\n${post.hashtags.join(" ")}`;
    await fetch("/api/posts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: post.title, caption, type: "image", hashtags: post.hashtags, source: "festival" }),
    }).catch(() => {});
    setBusy(false); setSaved(true);
  }

  const when = daysAway === 0 ? "today" : daysAway === 1 ? "tomorrow" : `in ${daysAway} days`;

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-3 bg-gradient-to-br from-amber-50 to-brand-50 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm">{festival.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700"><CalendarHeart className="h-3.5 w-3.5" /> Upcoming festival · {when}</p>
          <p className="font-bold">{festival.name}</p>
          <p className="truncate text-xs text-ink-500">{festival.blurb}</p>
        </div>
        {!post && (
          <button onClick={generate} disabled={busy} className="btn-primary text-sm disabled:opacity-60">
            {busy ? <><RefreshCw className="h-4 w-4 animate-spin" /> Writing…</> : <><Sparkles className="h-4 w-4" /> Generate post</>}
          </button>
        )}
      </div>

      {post && (
        <div className="space-y-3 p-4">
          <p className="whitespace-pre-wrap text-sm text-ink-800">{post.caption}</p>
          <p className="text-sm font-medium text-brand-600">{post.hashtags.join(" ")}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={saveDraft} disabled={busy || saved} className="btn-primary text-sm disabled:opacity-60">
              {saved ? <><Check className="h-4 w-4" /> Saved to drafts</> : "Save as draft"}
            </button>
            <button onClick={generate} disabled={busy} className="btn-ghost text-sm"><RefreshCw className="h-4 w-4" /> Regenerate</button>
            <Link href="/studio" className="btn-ghost text-sm">Open Studio <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      )}
    </div>
  );
}
