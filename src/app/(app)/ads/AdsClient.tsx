"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Target,
  Users,
  MapPin,
  Wallet,
  CalendarRange,
  TrendingUp,
  Check,
  X,
  ShieldCheck,
  Rocket,
  RefreshCw,
  Pencil,
} from "lucide-react";
import { cn, inr } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { GoLiveButton } from "@/components/ads/GoLiveButton";
import type { AdRecommendation, Campaign } from "@/lib/types";

const MAX_DAILY = 1000;
const MAX_TOTAL = 5000;

export function AdsClient({ initial }: { initial: AdRecommendation[] }) {
  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-3 bg-emerald-50/60 p-4">
        <ShieldCheck className="h-5 w-5 text-emerald-600" />
        <p className="text-sm text-emerald-800">
          Nothing runs without your explicit approval. Spend caps enforced:{" "}
          <b>max {inr(MAX_DAILY)}/day</b> and <b>{inr(MAX_TOTAL)} total</b>. On
          approval we create a <b>PAUSED</b> campaign in a sandbox account — it
          cannot spend until you press "Go live".
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
  const [state, setState] = useState<"pending" | "approving" | "approved" | "rejected">("pending");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [editing, setEditing] = useState(false);

  const total = budget * days;
  const overCap = budget > MAX_DAILY || total > MAX_TOTAL;

  async function approve() {
    setState("approving");
    const res = await fetch("/api/campaign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recId: rec.id, dailyBudget: budget, days }),
    });
    const data = await res.json();
    setCampaign(data.campaign);
    setState("approved");
  }

  if (state === "rejected") {
    return (
      <div className="card flex items-center justify-between p-5 opacity-70">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-500"><X className="h-5 w-5" /></span>
          <div>
            <p className="font-semibold">Recommendation rejected</p>
            <p className="text-sm text-ink-500">{rec.postTitle}</p>
          </div>
        </div>
        <button onClick={() => setState("pending")} className="btn-ghost text-xs">Undo</button>
      </div>
    );
  }

  return (
    <div className={cn("card overflow-hidden", state === "approved" && "ring-2 ring-emerald-200")}>
      {/* header */}
      <div className="flex gap-3 border-b border-ink-100 p-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-100">
          <Image src={rec.postThumb} alt="" fill className="object-cover" sizes="64px" unoptimized />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge tone={rec.objective === "leads" ? "violet" : "blue"}>
              {rec.objective === "leads" ? "Lead generation" : "Engagement"}
            </Badge>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" /> Score {rec.score}/100
            </span>
          </div>
          <p className="mt-1 line-clamp-1 font-semibold">{rec.postTitle}</p>
          <p className="text-xs text-ink-400">Recommended to promote</p>
        </div>
      </div>

      {/* rationale */}
      <div className="p-4">
        <p className="text-sm leading-relaxed text-ink-700">{rec.rationale}</p>

        {/* audience */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Field icon={<MapPin className="h-4 w-4" />} label="Locations" value={rec.audience.locations.join(", ")} />
          <Field icon={<Users className="h-4 w-4" />} label="Age" value={`${rec.audience.ageMin}–${rec.audience.ageMax}`} />
        </div>
        <div className="mt-3 flex flex-wrap items-start gap-1.5">
          <Target className="mt-0.5 h-4 w-4 text-ink-400" />
          {rec.audience.interests.map((i) => (
            <span key={i} className="chip bg-ink-100 text-ink-600">{i}</span>
          ))}
        </div>

        {/* budget controls */}
        <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Budget & duration</p>
            {state === "pending" && (
              <button onClick={() => setEditing((e) => !e)} className="text-xs font-medium text-brand-600 hover:underline">
                <Pencil className="mr-1 inline h-3 w-3" />{editing ? "Done" : "Edit"}
              </button>
            )}
          </div>

          {editing ? (
            <div className="mt-3 space-y-3">
              <div>
                <label className="flex justify-between text-xs text-ink-500"><span>Daily budget</span><span className="font-semibold text-ink-700">{inr(budget)}</span></label>
                <input type="range" min={50} max={1200} step={50} value={budget} onChange={(e) => setBudget(+e.target.value)} className="w-full accent-brand-600" />
              </div>
              <div>
                <label className="flex justify-between text-xs text-ink-500"><span>Days</span><span className="font-semibold text-ink-700">{days}</span></label>
                <input type="range" min={1} max={14} value={days} onChange={(e) => setDays(+e.target.value)} className="w-full accent-brand-600" />
              </div>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <Field icon={<Wallet className="h-4 w-4" />} label="Daily" value={inr(budget)} />
              <Field icon={<CalendarRange className="h-4 w-4" />} label="Days" value={String(days)} />
              <Field icon={<Wallet className="h-4 w-4" />} label="Total cap" value={inr(total)} />
            </div>
          )}

          {overCap && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              ⚠ Exceeds spend cap ({inr(MAX_DAILY)}/day, {inr(MAX_TOTAL)} total). Lower the budget to approve.
            </p>
          )}
        </div>

        {/* expected */}
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-brand-50 p-3 text-center">
          <Expected label="Est. reach" value={rec.expected.reach} />
          <Expected label="Est. results" value={rec.expected.results} />
          <Expected label="Cost / result" value={rec.expected.costPerResult} />
        </div>

        {/* approved state */}
        {state === "approved" && campaign && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="h-4 w-4" />
              <p className="text-sm font-semibold">Campaign created — PAUSED & safe</p>
            </div>
            <dl className="mt-2 space-y-1 text-xs text-emerald-800">
              <IdRow label="Campaign ID" value={campaign.fbCampaignId} />
              <IdRow label="Ad Set ID" value={campaign.adsetId} />
              <IdRow label="Ad ID" value={campaign.adId} />
            </dl>
            <GoLiveButton campaignId={campaign.fbCampaignId} dailyBudget={budget} days={days} className="mt-3 w-full" />
            <p className="mt-1.5 text-center text-[11px] text-emerald-700">
              In sandbox this won't deliver or charge. Production needs a funded account.
            </p>
          </div>
        )}

        {/* actions */}
        {state !== "approved" && (
          <div className="mt-4 flex gap-2">
            <button onClick={() => setState("rejected")} className="btn-ghost flex-1">
              <X className="h-4 w-4" /> Reject
            </button>
            <button onClick={approve} disabled={overCap || state === "approving"} className="btn-primary flex-1">
              {state === "approving" ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Creating…</>
              ) : (
                <><Check className="h-4 w-4" /> Approve</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-ink-400">{icon} {label}</p>
      <p className="mt-0.5 font-medium text-ink-700">{value}</p>
    </div>
  );
}

function Expected({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-brand-500">{label}</p>
      <p className="text-sm font-bold text-brand-800">{value}</p>
    </div>
  );
}

function IdRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
