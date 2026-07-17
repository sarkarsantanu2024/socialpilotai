"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ShieldCheck, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { planId, getPlan, type PlanId } from "@/lib/plans";

type Plan = { id: PlanId; name: string; price: number; features: string[] };
type Billing = { plan: string; planStatus: string; planRenewsAt: string | null; pending: { id: string; plan: string; amount: number; createdAt: string } | null } | null;
type Pending = { id: string; plan: string; amount: number; upiRef: string | null; orgName: string; createdAt: string };

export function BillingClient({
  plans, qr, upi, billing, isSuperadmin, pendingAll,
}: {
  plans: Plan[]; qr: Record<string, string>; upi: { upi: string; name: string };
  billing: Billing; isSuperadmin: boolean; pendingAll: Pending[];
}) {
  const router = useRouter();
  const [pay, setPay] = useState<Plan | null>(null);
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const current = billing?.plan ?? "trial";
  const currentId = planId(current); // normalise legacy starter/pro
  const currentName = currentId === "trial" ? "Trial" : getPlan(currentId)?.name ?? current;

  async function submitPayment() {
    if (!pay) return;
    setBusy(true);
    const r = await fetch("/api/billing/request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: pay.id, upiRef: ref }),
    });
    setBusy(false);
    if (r.ok) { setPay(null); setRef(""); router.refresh(); }
  }

  async function decide(id: string, action: "activate" | "reject") {
    await fetch("/api/billing/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) }).catch(() => {});
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Current plan */}
      {billing && (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm text-ink-500">Current plan</p>
            <p className="text-2xl font-bold">{currentName}{currentId !== "trial" && <span className="ml-2 align-middle text-sm font-medium text-emerald-600">● {billing.planStatus}</span>}</p>
            {billing.planRenewsAt && <p className="text-xs text-ink-400">Renews {new Date(billing.planRenewsAt).toLocaleDateString()}</p>}
          </div>
          {billing.pending && (
            <span className="chip bg-amber-50 text-amber-700"><Clock className="h-3.5 w-3.5" /> {billing.pending.plan} payment pending activation</span>
          )}
        </div>
      )}

      {/* Super-admin: pending activations */}
      {isSuperadmin && (
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="h-5 w-5 text-brand-600" /> Pending activations <span className="chip bg-ink-100 text-ink-600">{pendingAll.length}</span></h2>
          <div className="mt-3 divide-y divide-ink-100">
            {pendingAll.length === 0 && <p className="py-6 text-center text-sm text-ink-400">No pending payments.</p>}
            {pendingAll.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.orgName}</p>
                  <p className="text-xs text-ink-400 capitalize">{p.plan} · ₹{p.amount}{p.upiRef ? ` · ref ${p.upiRef}` : ""} · {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={() => decide(p.id, "activate")} className="btn-primary text-xs"><Check className="h-3.5 w-3.5" /> Activate</button>
                <button onClick={() => decide(p.id, "reject")} className="btn-ghost text-xs text-rose-600 hover:bg-rose-50"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => {
          const active = currentId === plan.id;
          return (
            <div key={plan.id} className={cn("card p-6", plan.id === "ho" && "ring-2 ring-brand-500")}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                {plan.id === "ho" && <span className="chip bg-brand-50 text-brand-700">Most popular</span>}
              </div>
              <p className="mt-2 text-3xl font-extrabold">₹{plan.price}<span className="text-sm font-medium text-ink-500">/month</span></p>
              <ul className="mt-4 space-y-2 text-sm text-ink-600">
                {plan.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> {f}</li>)}
              </ul>
              <button
                disabled={active}
                onClick={() => setPay(plan)}
                className={cn("mt-6 w-full", active ? "btn-ghost cursor-default" : plan.id === "ho" ? "btn-primary" : "btn-ghost")}
              >
                {active ? "Current plan" : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Pay modal */}
      {pay && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setPay(null)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Pay ₹{pay.price} — {pay.name}</h3>
              <button onClick={() => setPay(null)} className="rounded-lg p-1 hover:bg-ink-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid place-items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr[pay.id]} alt="UPI QR" className="h-52 w-52 rounded-xl border border-ink-100" />
              <p className="mt-2 text-xs text-ink-500">Scan with any UPI app (GPay, PhonePe, Paytm…)</p>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-ink-100 bg-ink-50 p-2.5">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{upi.upi}</span>
              <button onClick={() => { navigator.clipboard.writeText(upi.upi).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }} className="btn-ghost px-2 py-1 text-xs">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <label className="mt-3 block text-xs font-medium text-ink-600">UPI reference / transaction ID (optional)
              <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. 4291xxxxxx" className="input mt-1 text-sm" />
            </label>
            <button disabled={busy} onClick={submitPayment} className="btn-primary mt-4 w-full disabled:opacity-60">
              {busy ? "Submitting…" : "I've paid — request activation"}
            </button>
            <p className="mt-2 text-center text-[11px] text-ink-400">Your plan activates once the payment is confirmed by our team.</p>
          </div>
        </div>
      )}
    </div>
  );
}
