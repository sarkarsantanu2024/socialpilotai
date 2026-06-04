import Link from "next/link";
import { Rocket, Megaphone, ShieldCheck, ExternalLink, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/Stat";
import { GoLiveButton } from "@/components/ads/GoLiveButton";
import { adAccount } from "@/lib/demo/data";
import { getClientSamples } from "@/lib/clientData";
import { inr, compact, fmtDate } from "@/lib/utils";

export default function CampaignsPage() {
  const { campaigns } = getClientSamples();
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalResults = campaigns.reduce((s, c) => s + c.results, 0);
  const totalReach = campaigns.reduce((s, c) => s + c.reach, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        phase="Phase 6 · Ads execution"
        title="Campaigns"
        subtitle="Every campaign is created PAUSED in a sandbox account. The 'Go live' button is the ONLY thing that could ever spend money — and it's disabled until you fund a real account."
        actions={
          <Link href="/ads" className="btn-primary">
            <Megaphone className="h-4 w-4" /> New from recommendation
          </Link>
        }
      />

      {/* Sandbox banner */}
      <div className="card flex flex-wrap items-center gap-3 bg-amber-50/60 p-4">
        <ShieldCheck className="h-5 w-5 text-amber-600" />
        <p className="text-sm text-amber-800">
          Ad account <b className="font-mono">{adAccount.actId}</b> ·{" "}
          <Badge tone="amber">Sandbox</Badge> · funding {adAccount.fundingOk ? "ready" : "not connected"} — campaigns
          cannot deliver or charge.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Campaigns" value={String(campaigns.length)} icon={<Rocket className="h-5 w-5" />} />
        <StatCard label="Total spend" value={inr(totalSpend)} delta={{ value: "Sandbox ₹0 risk", up: true }} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="Total reach" value={compact(totalReach)} icon={<Megaphone className="h-5 w-5" />} />
        <StatCard label="Total results" value={compact(totalResults)} icon={<Rocket className="h-5 w-5" />} />
      </div>

      <div className="space-y-4">
        {campaigns.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.status} />
                  <Badge tone={c.objective === "leads" ? "violet" : "blue"}>{c.objective}</Badge>
                  {c.isSandbox && <Badge tone="amber">sandbox</Badge>}
                </div>
                <h3 className="mt-1.5 font-semibold">{c.name}</h3>
                <p className="text-xs text-ink-400">Created {fmtDate(c.createdAt)} · {inr(c.dailyBudget)}/day × {c.days} days</p>
              </div>

              <div className="flex shrink-0 gap-2">
                {c.status === "PAUSED" ? (
                  <GoLiveButton campaignId={c.fbCampaignId} dailyBudget={c.dailyBudget} days={c.days} />
                ) : (
                  <a href="#" className="btn-ghost text-sm">
                    Ads Manager <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* metrics row */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4 sm:grid-cols-4">
              <Metric label="Spend" value={inr(c.spend)} />
              <Metric label="Reach" value={c.reach ? compact(c.reach) : "—"} />
              <Metric label="Results" value={c.results ? compact(c.results) : "—"} />
              <Metric label="Cost / result" value={c.costPerResult ? inr(c.costPerResult) : "—"} />
            </div>

            {/* fb ids */}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-ink-400">
              <span>Campaign: <span className="font-mono">{c.fbCampaignId}</span></span>
              <span>Ad Set: <span className="font-mono">{c.adsetId}</span></span>
              <span>Ad: <span className="font-mono">{c.adId}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}
