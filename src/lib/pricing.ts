// Marketing pricing catalog — the SINGLE SOURCE OF TRUTH for the three
// monthly-recurring plans shown on the landing page. Kept deliberately free of
// any server-only / db imports so it is safe to import from client components.
//
// Post-review, the billing flow (src/lib/plans.ts, BillingClient) and
// entitlement gating should read from this same catalog so pricing changes
// propagate everywhere from one place.
//
//   1) Single Center — one business owner / one Facebook page (flat ₹/mo)
//   2) Head Office    — franchise HO managing all its branches (flat ₹/mo)
//   3) Custom Center  — pick features, price computes live

export type MarketingPlanId = "single" | "ho" | "custom";

export interface MarketingPlan {
  id: MarketingPlanId;
  name: string;
  tagline: string;
  price: number | null; // flat ₹/month; null for the custom builder
  popular?: boolean;
  features: string[];
  centersIncluded?: number;
  perExtraCenter?: number;
}

export const SINGLE_CENTER: MarketingPlan = {
  id: "single",
  name: "Single Center",
  tagline: "For one shop, gym, or coaching centre",
  price: 999,
  features: [
    "1 Facebook Page",
    "AI Content Studio — captions, hashtags, ideas",
    "Schedule & auto-publish",
    "Analytics & best-time insights",
    "Lead capture + 1-tap WhatsApp follow-up",
  ],
};

export const HEAD_OFFICE: MarketingPlan = {
  id: "ho",
  name: "Head Office",
  tagline: "For franchises & multi-branch brands",
  price: 4999,
  popular: true,
  centersIncluded: 10,
  perExtraCenter: 499,
  features: [
    "Everything in Single Center — for every branch",
    "Head-office console: all centers at a glance",
    "Team roles — managers & staff per branch",
    "Per-branch WhatsApp self-connect (no setup)",
    "Auto-post + festival content engine",
    "Org-wide analytics & priority AI",
  ],
};

export const CUSTOM_PLAN: MarketingPlan = {
  id: "custom",
  name: "Custom Center",
  tagline: "Pick only what you need — price updates live",
  price: null,
  features: [],
};

/** Flat, fixed-price plans (excludes the custom builder). */
export const FLAT_PLANS: MarketingPlan[] = [SINGLE_CENTER, HEAD_OFFICE];

// ---- Custom builder ---------------------------------------------------------

export interface CustomFeature {
  id: string;
  label: string;
  price: number; // ₹/month
}

export const CUSTOM_BASE: CustomFeature = { id: "base", label: "Base — 1 Page + dashboard", price: 199 };

export const CUSTOM_FEATURES: CustomFeature[] = [
  { id: "ai", label: "AI Content Studio", price: 200 },
  { id: "schedule", label: "Schedule & auto-publish", price: 150 },
  { id: "analytics", label: "Analytics & best-time", price: 150 },
  { id: "ads", label: "Ad decisioning (which post to boost)", price: 250 },
  { id: "leads", label: "Lead capture + WhatsApp", price: 200 },
  { id: "autopost", label: "Auto-post + festival engine", price: 150 },
  { id: "priority", label: "Priority AI generation", price: 200 },
];

// A sensible starting selection so the card reads like a real plan, not empty.
export const CUSTOM_DEFAULT = ["ai", "schedule", "analytics"];

/** Live monthly total for a custom selection = base + picked features. */
export function customTotal(picked: string[]): number {
  return (
    CUSTOM_BASE.price +
    CUSTOM_FEATURES.filter((f) => picked.includes(f.id)).reduce((sum, f) => sum + f.price, 0)
  );
}

/** Human label for a plan id — used to echo the choice into signup. */
export function planLabel(id: string | null | undefined): string | null {
  switch (id) {
    case "single":
      return SINGLE_CENTER.name;
    case "ho":
      return HEAD_OFFICE.name;
    case "custom":
      return CUSTOM_PLAN.name;
    default:
      return null;
  }
}
