"use client";

import { useState } from "react";
import { Rocket, X, ExternalLink, Check } from "lucide-react";

// One-tap "Boost this post": shows the AI's suggested budget/audience, then
// deep-links to the post on Facebook where the owner taps the native "Boost
// post" button. No ad-account plumbing, no App Review, no money handled by us.
export function BoostButton({
  fbPostId, title, budget = 250, days = 7, audience, className,
}: {
  fbPostId?: string | null; title: string; budget?: number; days?: number; audience?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const fbUrl = fbPostId ? `https://www.facebook.com/${fbPostId}` : null;

  return (
    <>
      <button onClick={() => setOpen(true)} className={className ?? "btn bg-white text-brand-700 hover:bg-brand-50"}>
        <Rocket className="h-4 w-4" /> Boost this post
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-md p-6 text-ink-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold"><Rocket className="h-5 w-5 text-brand-600" /> Boost this post</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-ink-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-ink-500">&ldquo;{title}&rdquo;</p>

            <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">AI recommendation</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Budget: <b>₹{budget}/day</b> for <b>{days} days</b> (₹{budget * days} total)</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Objective: <b>Get more engagement & leads</b></li>
                {audience && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Audience: <b>{audience}</b></li>}
              </ul>
            </div>

            {fbUrl ? (
              <>
                <a href={fbUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="btn-primary mt-4 w-full">
                  Open on Facebook & tap “Boost” <ExternalLink className="h-4 w-4" />
                </a>
                <p className="mt-2 text-center text-[11px] text-ink-400">You pay Facebook directly and stay in full control — nothing is charged through SocialPilot.</p>
              </>
            ) : (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">Publish this post to your Facebook Page first, then you can boost it.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
