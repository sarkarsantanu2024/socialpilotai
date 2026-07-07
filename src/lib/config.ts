// Central config + the DEMO_MODE switch.
// DEMO_MODE is ON when explicitly set, OR whenever the relevant credential
// is missing — so the app is always demoable with ₹0 and zero setup.

export const FB_GRAPH_VERSION = process.env.FB_GRAPH_VERSION ?? "v20.0";

export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE !== "false"; // default: true

// A value counts as "set" only if it's non-empty AND not a leftover placeholder
// (so an unfilled `PASTE_..._HERE` in .env.local doesn't trigger the real path).
function isSet(v?: string) {
  return !!v && v.trim() !== "" && !v.includes("PASTE_") && !v.includes("_HERE");
}

export function hasGemini() {
  return !DEMO_MODE && isSet(process.env.GEMINI_API_KEY);
}

export function hasFacebook() {
  return !DEMO_MODE && !!process.env.FB_APP_ID && !!process.env.FB_APP_SECRET;
}

// Whether a real Meta app is configured (independent of DEMO_MODE) — enables the
// "Connect Facebook" OAuth flow. Live publishing then uses the stored page token.
export function fbAppConfigured() {
  return !!process.env.FB_APP_ID && !!process.env.FB_APP_SECRET;
}

// Permissions requested at connect time (architecture §12). pages_manage_posts +
// pages_read_engagement + pages_show_list cover publishing, scheduling, insights.
// instagram_* let us publish to the IG account linked to the Page (App Review).
const CORE_SCOPES = [
  "pages_show_list", "pages_manage_posts", "pages_read_engagement",
  "instagram_basic", "instagram_content_publish",
];
// Premium (Ads & Leads) adds Marketing API + Lead Ads retrieval. Separate App Review.
const PREMIUM_SCOPES = ["ads_management", "leads_retrieval", "business_management"];

export const FB_SCOPES = CORE_SCOPES.join(",");

export function fbScopes(premium: boolean) {
  return (premium ? [...CORE_SCOPES, ...PREMIUM_SCOPES] : CORE_SCOPES).join(",");
}

// Token the Lead Ads webhook echoes back during verification (set the same value
// in the Meta app's webhook config).
export function webhookVerifyToken() {
  return process.env.WEBHOOK_VERIFY_TOKEN ?? "socialpilot-verify";
}

// Must EXACTLY match a redirect URI whitelisted in the Meta app (Facebook Login
// settings). Defaults to the local dev port.
export function fbRedirectUri() {
  return process.env.FB_REDIRECT_URI ?? "http://localhost:3000/api/auth/facebook/callback";
}

export const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === "true";
