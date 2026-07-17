// Subscription plans, entitlements + UPI payment config.
//
// Canonical plan ids: trial (free) | single | ho | custom. Legacy values are
// normalised by planId() (starter → single, pro → ho) so old rows keep working.
//
// GENEROUS FREE, BY DESIGN: FB connect, AI text, schedule/publish, analytics and
// leads are NEVER gated — only the flags below are. This also guarantees a
// trial-plan user (e.g. the Meta App Review tester) can demo every reviewed
// Facebook permission. Gated features are NOT Meta permissions.

export type PlanId = "trial" | "single" | "ho" | "custom";

export type Feature =
  | "ai_image" // real AI (Imagen) image generation
  | "ads" // ad decisioning / Boost
  | "multi_center" // more than one branch (HO)
  | "autopost" // weekly auto-post + festival engine
  | "team" // invite managers / staff
  | "priority_ai"; // priority AI generation

const SINGLE_FEATURES: Feature[] = ["ai_image", "ads", "priority_ai"];
const HO_FEATURES: Feature[] = [
  ...SINGLE_FEATURES,
  "multi_center",
  "autopost",
  "team",
];

export const PLAN_FEATURES: Record<PlanId, Feature[]> = {
  trial: [], // generous free — see note above
  single: SINGLE_FEATURES,
  ho: HO_FEATURES,
  custom: SINGLE_FEATURES, // until per-feature custom storage lands
};

// Max branches per plan (free & single = 1; ho/custom = many).
export const CENTER_LIMIT: Record<PlanId, number> = {
  trial: 1,
  single: 1,
  ho: 999,
  custom: 999,
};

/** Normalise any stored/legacy plan string to a canonical id. */
export function planId(plan: string | null | undefined): PlanId {
  switch ((plan ?? "").toLowerCase()) {
    case "single":
    case "starter":
      return "single";
    case "ho":
    case "pro":
      return "ho";
    case "custom":
      return "custom";
    default:
      return "trial";
  }
}

/** Is this plan entitled to a feature? The single source of truth for gating. */
export function can(
  plan: string | null | undefined,
  feature: Feature,
): boolean {
  return PLAN_FEATURES[planId(plan)].includes(feature);
}

/** How many branches this plan may create. */
export function centerLimit(plan: string | null | undefined): number {
  return CENTER_LIMIT[planId(plan)];
}

/** Back-compat: "is on a paid plan" (single/ho/custom). */
export function isPro(plan: string | null | undefined): boolean {
  return planId(plan) !== "trial";
}

// ---- Billing catalog (the upgrade options shown in Billing) ----------------

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // INR / month
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "single",
    name: "Single Center",
    price: 999,
    features: [
      "1 Facebook Page",
      "AI posts & scheduling",
      "Real AI image generation",
      "Analytics & best-time insights",
      "Lead capture + WhatsApp",
      "Ad decisioning",
    ],
  },
  {
    id: "ho",
    name: "Head Office",
    price: 4999,
    features: [
      "Everything in Single Center",
      "Multiple branches + HO console",
      "Team roles (managers & staff)",
      "Per-branch WhatsApp self-connect",
      "Auto-post + festival engine",
      "Org-wide analytics & priority AI",
    ],
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function payee() {
  return {
    upi: process.env.PAYEE_UPI_ID || "your-upi-id@bank",
    name: process.env.PAYEE_NAME || "SocialPilot AI",
  };
}

/**
 * Optional static payee QR image (a public path like "/payment-qr.jpg", or a URL).
 * When set, Billing shows THIS branded QR instead of a generated UPI QR. Note a
 * static QR carries the VPA but NOT the amount, so the UI tells the payer what to
 * enter. Unset → fall back to a generated QR with the amount pre-filled.
 */
export function qrImage(): string | null {
  return process.env.PAYEE_QR_IMAGE || null;
}

/** UPI deep-link that any UPI app / QR scanner understands. */
export function upiUri(amount: number, note: string) {
  const p = payee();
  const params = new URLSearchParams({
    pa: p.upi,
    pn: p.name,
    am: String(amount),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}
