"use client";

import { useState } from "react";
import Image from "next/image";
import { Target, MapPin, Wallet, CalendarRange, TrendingUp, X, ShieldCheck, Sparkles } from "lucide-react";
import { inr } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { BoostButton } from "@/components/ui/BoostButton";
import type { AdRecommendation } from "@/lib/types";

export function AdsClient({ initial }: { initial: AdRecommendation[] }) {
  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-3 bg-emerald-50/60 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
        <p className="text-sm text-emerald-800">
          AI finds your best-performing post to promote. Boost it on Facebook in one tap — you pay
          Facebook directly and stay in full control. <b>Nothing is ever charged through SocialPilot.</b>
        </p>
      </div>

      {initial.length === 0 ? (
        <div className="card grid min-h-[200px] place-items-center p-8 text-center text-sm text-ink-500">
          <div>
            <p className="font-medium text-ink-700">No recommendation yet</p>
            <p className="mt-1 max-w-sm">Publish a few posts to your Page — once they gather engagement, AI will recommend your best post to promote here.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {initial.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ rec }: { rec: AdRecommendation }) {
  const [budget, setBudget] = useState(rec.dailyBudget);
  const [days, setDays] = useState(rec.days);
  const [dismissed, setDismissed] = useState(false);
  const total = budget * days;
  // Rough, budget-scaled ESTIMATE (not a real forecast). ~₹25–₹40 per lead and a
  // ~₹60–₹90 reach-per-rupee proxy for a local boost — so the range at least
  // responds to the budget/days the user sets, and is labelled as an estimate.
  const estLeadsLow = Math.max(1, Math.round(total / 40));
  const estLeadsHigh = Math.max(estLeadsLow, Math.round(total / 25));
  const estReachLow = Math.round(total * 60).toLocaleString("en-IN");
  const estReachHigh = Math.round(total * 90).toLocaleString("en-IN");
  const audienceLine = [rec.audience.locations.join(", "), rec.audience.interests.slice(0, 3).join(", ")].filter(Boolean).join(" · ");

  if (dismissed) {
    return (
      <div className="card flex items-center justify-between p-5 opacity-70">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-500"><X className="h-5 w-5" /></span>
          <div>
            <p className="font-semibold">Dismissed</p>
            <p className="text-sm text-ink-500">{rec.postTitle}</p>
          </div>
        </div>
        <button onClick={() => setDismissed(false)} className="btn-ghost text-xs">Undo</button>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b border-ink-100 p-4">
        {rec.postThumb ? (
          <Image src={rec.postThumb} alt="" width={56} height={56} className="h-14 w-14 rounded-lg object-cover" />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-lg bg-brand-50 text-brand-500"><Sparkles className="h-6 w-6" /></span>
        )}
        <div className="min-w-0 flex-1">
          <Badge tone="violet"><TrendingUp className="mr-1 inline h-3 w-3" /> Top performer · {rec.score}</Badge>
          <p className="mt-1 line-clamp-1 font-semibold">{rec.postTitle}</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-sm text-ink-600">{rec.rationale}</p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-ink-600"><Target className="h-4 w-4 text-ink-400" /> <span className="capitalize">{rec.objective}</span></div>
          <div className="flex items-center gap-2 text-ink-600"><MapPin className="h-4 w-4 text-ink-400" /> <span className="truncate">{audienceLine}</span></div>
        </div>

        {/* Editable AI-suggested budget */}
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] font-medium text-ink-500">Daily budget (₹)
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-ink-200 px-2.5"><Wallet className="h-4 w-4 text-ink-400" />
              <input type="number" min={50} step={50} value={budget} onChange={(e) => setBudget(Math.max(0, +e.target.value))} className="w-full bg-transparent py-2 text-sm outline-none" />
            </div>
          </label>
          <label className="text-[11px] font-medium text-ink-500">Days
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-ink-200 px-2.5"><CalendarRange className="h-4 w-4 text-ink-400" />
              <input type="number" min={1} max={30} value={days} onChange={(e) => setDays(Math.max(1, +e.target.value))} className="w-full bg-transparent py-2 text-sm outline-none" />
            </div>
          </label>
        </div>

        <div className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
          <div className="flex justify-between"><span>Total spend (on Facebook)</span><b className="text-ink-700">{inr(total)}</b></div>
          <div className="mt-1 flex justify-between"><span>Estimated outcome</span><span>~{estLeadsLow}–{estLeadsHigh} leads · {estReachLow}–{estReachHigh} reach</span></div>
          <p className="mt-1 text-[10px] text-ink-400">Rough estimate — actual Facebook ad results vary.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <BoostButton fbPostId={rec.postFbId} title={rec.postTitle} budget={budget} days={days} audience={audienceLine} className="btn-primary flex-1" />
          <button onClick={() => setDismissed(true)} className="btn-ghost text-sm text-ink-500"><X className="h-4 w-4" /> Dismiss</button>
        </div>
      </div>
    </div>
  );
}
