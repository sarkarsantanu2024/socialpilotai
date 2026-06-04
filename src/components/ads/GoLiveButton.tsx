"use client";

import { useState } from "react";
import { Rocket, ShieldAlert, Check, RefreshCw, X } from "lucide-react";
import { cn, inr } from "@/lib/utils";

// "Go live" — the only action that can spend money. Gated behind an explicit
// confirmation modal; the server enforces the funded-account guard.
export function GoLiveButton({
  campaignId,
  dailyBudget,
  days,
  className,
}: {
  campaignId: string;
  dailyBudget?: number;
  days?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { live: boolean; sandbox?: boolean }>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/campaign/go-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(
          data.reason === "not_funded"
            ? "This ad account has no funding source yet. Add a payment method in Meta Ads Manager, then try again."
            : data.reason || "Could not go live."
        );
      } else {
        setDone({ live: !!data.live, sandbox: !!data.sandbox });
        setOpen(false);
      }
    } catch {
      setError("Network error — please retry.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium",
          done.live ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"
        )}
      >
        <Check className="h-4 w-4" />
        {done.live ? "Live & delivering" : "Activated (sandbox — no spend)"}
      </span>
    );
  }

  const total = dailyBudget && days ? dailyBudget * days : undefined;

  return (
    <>
      <button onClick={() => setOpen(true)} className={cn("btn bg-emerald-600 text-white hover:bg-emerald-700", className)}>
        <Rocket className="h-4 w-4" /> Go live
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={() => !busy && setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold">Go live with this campaign?</h3>
                <p className="mt-1 text-sm text-ink-500">
                  This is the only action that can spend money. It runs on the
                  client&apos;s own funded ad account.
                  {total ? <> Budget: <b>{inr(dailyBudget!)}/day × {days} days</b> (up to <b>{inr(total)}</b>).</> : null}
                </p>
                <p className="mt-2 text-xs text-ink-400">
                  No funded account connected → activates in <b>sandbox</b> only (cannot deliver or charge).
                </p>
              </div>
            </div>

            {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} disabled={busy} className="btn-ghost text-sm">
                <X className="h-4 w-4" /> Cancel
              </button>
              <button onClick={confirm} disabled={busy} className="btn bg-emerald-600 text-white hover:bg-emerald-700 text-sm">
                {busy ? <><RefreshCw className="h-4 w-4 animate-spin" /> Going live…</> : <><Rocket className="h-4 w-4" /> Yes, go live</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
