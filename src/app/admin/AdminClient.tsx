"use client";

import { useState } from "react";
import { Plane, Building2, Store, Users, CreditCard, Check, X, LogOut, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Org = { id: string; name: string; plan: string; centers: number; members: number; firstCenterId: string | null; createdAt: string };
type Overview = { counts: { orgs: number; centers: number; users: number; pendingPayments: number }; orgs: Org[] };
type Pending = { id: string; plan: string; amount: number; upiRef: string | null; orgName: string; createdAt: string };

export function AdminClient({ name, overview, pending }: { name: string; overview: Overview; pending: Pending[] }) {
  const [pends, setPends] = useState(pending);
  const [busy, setBusy] = useState<string | null>(null);

  async function logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  }

  async function openCenter(centerId: string | null) {
    if (!centerId) return;
    await fetch("/api/center/select", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ centerId }) }).catch(() => {});
    window.location.href = "/dashboard";
  }

  async function decide(id: string, action: "activate" | "reject") {
    setBusy(id);
    await fetch("/api/billing/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) }).catch(() => {});
    setBusy(null);
    setPends((p) => p.filter((x) => x.id !== id));
  }

  const c = overview.counts;
  const tiles = [
    { label: "Organizations", value: c.orgs, icon: Building2 },
    { label: "Centers", value: c.centers, icon: Store },
    { label: "Users", value: c.users, icon: Users },
    { label: "Pending payments", value: c.pendingPayments, icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink-100 bg-white/80 px-5 backdrop-blur sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white"><Plane className="h-5 w-5 -rotate-45" /></span>
          <div>
            <p className="text-sm font-bold leading-tight">SocialPilot<span className="text-brand-600"> AI</span></p>
            <p className="flex items-center gap-1 text-[11px] leading-tight text-ink-400"><ShieldCheck className="h-3 w-3" /> Platform admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-ink-500 sm:inline">{name}</span>
          <button onClick={logout} className="btn-ghost text-sm"><LogOut className="h-4 w-4" /> Log out</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold">Platform overview</h1>
          <p className="mt-1 text-sm text-ink-500">Every organization and center on SocialPilot, and payments awaiting activation.</p>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="card p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm text-ink-500">{t.label}</p>
                <span className="text-brand-500"><t.icon className="h-5 w-5" /></span>
              </div>
              <p className="mt-2 text-3xl font-bold">{t.value}</p>
            </div>
          ))}
        </div>

        {/* Pending payments */}
        {pends.length > 0 && (
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold"><CreditCard className="h-5 w-5 text-brand-600" /> Payments to activate <span className="chip bg-amber-50 text-amber-700">{pends.length}</span></h2>
            <div className="mt-3 divide-y divide-ink-100">
              {pends.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.orgName}</p>
                    <p className="text-xs text-ink-400 capitalize">{p.plan} · ₹{p.amount}{p.upiRef ? ` · ref ${p.upiRef}` : ""} · {new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button disabled={busy === p.id} onClick={() => decide(p.id, "activate")} className="btn-primary text-xs disabled:opacity-60"><Check className="h-3.5 w-3.5" /> Activate</button>
                  <button disabled={busy === p.id} onClick={() => decide(p.id, "reject")} className="btn-ghost text-xs text-rose-600 hover:bg-rose-50"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organizations */}
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Building2 className="h-5 w-5 text-brand-600" /> Organizations</h2>
          {overview.orgs.length === 0 ? (
            <div className="grid place-items-center py-12 text-center">
              <p className="font-medium text-ink-600">No organizations yet</p>
              <p className="mt-1 max-w-sm text-sm text-ink-400">As customers sign up and create their businesses, every organization and its centers will appear here for you to oversee.</p>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-ink-400">
                  <tr><th className="py-2 pr-3 font-semibold">Organization</th><th className="px-3 py-2 font-semibold">Plan</th><th className="px-3 py-2 font-semibold">Centers</th><th className="px-3 py-2 font-semibold">Members</th><th className="px-3 py-2"></th></tr>
                </thead>
                <tbody>
                  {overview.orgs.map((o) => (
                    <tr key={o.id} className="border-t border-ink-100">
                      <td className="py-2.5 pr-3 font-medium">{o.name}</td>
                      <td className="px-3 py-2.5"><span className={cn("chip capitalize", o.plan === "pro" ? "bg-brand-50 text-brand-700" : o.plan === "starter" ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500")}>{o.plan}</span></td>
                      <td className="px-3 py-2.5 text-ink-600">{o.centers}</td>
                      <td className="px-3 py-2.5 text-ink-600">{o.members}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button disabled={!o.firstCenterId} onClick={() => openCenter(o.firstCenterId)} className="btn-ghost text-xs disabled:opacity-40">Open <ArrowRight className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
