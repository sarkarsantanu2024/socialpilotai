import Link from "next/link";
import { Building2, Users, Megaphone, Facebook, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/ui/Stat";
import { cn } from "@/lib/utils";
import { Greeting } from "./Greeting";

type Row = { id: string; name: string; city: string; published: number; leads: number; connected: boolean };
type Rollup = { centers: Row[]; totals: { centers: number; published: number; leads: number; connected: number } };

/**
 * Head-office dashboard: real org-wide totals rolled up across every center, plus
 * a per-center breakdown. Shown when an owner/HO is in head-office mode (no single
 * center selected) — previously this view rendered a center-scoped dashboard with
 * nothing in it, which read as "all zeros".
 *
 * Only metrics we can aggregate cheaply and truthfully are shown. Reach/engagement
 * are per-Page Facebook metrics (one live API call per center), so we point to the
 * center's own Analytics instead of inventing an org-wide number.
 */
export function HoDashboard({ rollup }: { rollup: Rollup }) {
  const { centers, totals } = rollup;

  return (
    <div className="space-y-6">
      <Greeting liveName={null} />
      <p className="-mt-3 text-sm text-ink-500">
        Head office · across all {totals.centers} {totals.centers === 1 ? "center" : "centers"}. Switch to a
        center from the top bar to see its posts, analytics &amp; leads.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Centers" value={String(totals.centers)} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Facebook connected" value={`${totals.connected}/${totals.centers}`} icon={<Facebook className="h-5 w-5" />} />
        <StatCard label="Posts published" value={String(totals.published)} icon={<Megaphone className="h-5 w-5" />} />
        <StatCard label="Leads captured" value={String(totals.leads)} icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 p-4">
          <h2 className="font-semibold">Centers at a glance</h2>
          <Link href="/organization" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
            Open HO console <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {centers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="p-3 font-semibold">Center</th>
                  <th className="p-3 font-semibold">Facebook</th>
                  <th className="p-3 font-semibold">Published</th>
                  <th className="p-3 font-semibold">Leads</th>
                </tr>
              </thead>
              <tbody>
                {centers.map((c) => (
                  <tr key={c.id} className="border-t border-ink-100">
                    <td className="p-3">
                      <p className="font-medium">{c.name}</p>
                      {c.city && <p className="text-xs text-ink-400">{c.city}</p>}
                    </td>
                    <td className="p-3">
                      <span className={cn("chip text-[10px]", c.connected ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500")}>
                        {c.connected ? "Connected" : "Not connected"}
                      </span>
                    </td>
                    <td className="p-3 text-ink-600">{c.published}</td>
                    <td className="p-3 text-ink-600">{c.leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-6 text-center text-sm text-ink-400">No centers yet — add your first branch in the HO console.</p>
        )}
      </div>

      <p className="px-1 text-xs text-ink-400">
        Reach &amp; engagement are per-Page Facebook metrics — switch into a center from the top bar to see its
        Analytics.
      </p>
    </div>
  );
}
