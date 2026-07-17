"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Building2, Store, SlidersHorizontal } from "lucide-react";
import { cn, inr } from "@/lib/utils";
import {
  FLAT_PLANS,
  CUSTOM_BASE,
  CUSTOM_FEATURES,
  CUSTOM_DEFAULT,
  customTotal,
  type MarketingPlan,
} from "@/lib/pricing";

// Icon per plan id (kept in the view layer, not the data catalog).
const PLAN_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  single: Store,
  ho: Building2,
};

export function Pricing() {
  const [picked, setPicked] = useState<string[]>(CUSTOM_DEFAULT);
  const total = useMemo(() => customTotal(picked), [picked]);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  const customQuery = `plan=custom&features=${encodeURIComponent(picked.join(","))}&price=${total}`;

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Simple pricing</h2>
      <p className="mt-2 text-center text-ink-500">
        Monthly plans for every kind of business. Start free for 14 days. Cancel anytime.
      </p>

      <div className="mt-8 grid items-start gap-4 lg:grid-cols-3">
        {/* Flat plans (Single Center, Head Office) */}
        {FLAT_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} href={`/signup?plan=${plan.id}`} cta="Start free trial" />
        ))}

        {/* 3 — Custom (Center) with live price */}
        <div className="card p-6">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          <h3 className="mt-3 text-lg font-bold">Custom Center</h3>
          <p className="text-sm text-ink-500">Pick only what you need — price updates live</p>

          <p className="mt-3 text-3xl font-extrabold">
            {inr(total)}
            <span className="text-sm font-medium text-ink-500">/month</span>
          </p>

          <div className="mt-4 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <span className="grid h-4 w-4 place-items-center rounded bg-ink-100 text-[10px]">✓</span>
              {CUSTOM_BASE.label}
              <span className="ml-auto text-xs text-ink-400">{inr(CUSTOM_BASE.price)}</span>
            </div>
            {CUSTOM_FEATURES.map((f) => {
              const on = picked.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition",
                    on
                      ? "border-brand-200 bg-brand-50 text-ink-700"
                      : "border-ink-100 bg-white text-ink-500 hover:border-ink-200",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-4 w-4 place-items-center rounded border",
                      on ? "border-brand-500 bg-brand-500 text-white" : "border-ink-300",
                    )}
                  >
                    {on && <Check className="h-3 w-3" />}
                  </span>
                  {f.label}
                  <span className="ml-auto text-xs text-ink-400">+{inr(f.price)}</span>
                </button>
              );
            })}
          </div>

          <Link href={`/signup?${customQuery}`} className="btn-ghost mt-6 w-full">
            Start free trial
          </Link>
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan, href, cta }: { plan: MarketingPlan; href: string; cta: string }) {
  const Icon = PLAN_ICON[plan.id] ?? Store;
  const note =
    plan.centersIncluded != null && plan.perExtraCenter != null
      ? `Includes up to ${plan.centersIncluded} centers · +${inr(plan.perExtraCenter)}/mo per extra branch`
      : null;

  return (
    <div className={cn("card flex h-full flex-col p-6", plan.popular && "ring-2 ring-brand-500")}>
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </span>
        {plan.popular && <span className="chip bg-brand-50 text-brand-700">Most popular</span>}
      </div>
      <h3 className="mt-3 text-lg font-bold">{plan.name}</h3>
      <p className="text-sm text-ink-500">{plan.tagline}</p>

      <p className="mt-3 text-3xl font-extrabold">
        {inr(plan.price ?? 0)}
        <span className="text-sm font-medium text-ink-500">/month</span>
      </p>

      <ul className="mt-4 space-y-2 text-sm text-ink-600">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}
          </li>
        ))}
      </ul>

      {note && <p className="mt-4 text-xs text-ink-400">{note}</p>}

      <Link href={href} className={cn("mt-6 w-full", plan.popular ? "btn-primary" : "btn-ghost")}>
        {cta}
      </Link>
    </div>
  );
}
