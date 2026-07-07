// Subscription plans + UPI payment config. UPI id / payee come from env so you
// can point it at your real UPI without code changes.
export interface Plan {
  id: "starter" | "pro";
  name: string;
  price: number; // INR / month
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 499,
    features: ["1 Facebook Page", "AI posts & scheduling", "Analytics & best-time insights"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 999,
    features: [
      "Everything in Starter",
      "Ad recommendations & campaigns",
      "Lead capture & ROI",
      "Real AI image generation",
      "Priority AI generation",
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

/** Feature gate: is the org on a paid Pro plan? (drives real AI images, ads…) */
export function isPro(plan: string | null | undefined) {
  return plan === "pro";
}
