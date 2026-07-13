// ───────────────────────────────────────────────────────────────
// Branded-poster rendering via Placid (https://placid.app) — turns a
// headline + background photo + logo into an on-brand social poster with
// CORRECTLY RENDERED text (including Bengali/Hindi, which no AI image model
// does reliably). This is what makes auto-posts look like your designed
// posters instead of a bare stock photo.
//
// Fully OPTIONAL and gated behind env vars. When unset (or on any error) the
// caller falls back to the plain background image, so nothing breaks.
//
// SETUP (one-time, in your Placid account):
//   1. Create a 1080×1080 template. Add these LAYERS (names must match):
//        • "headline"   — text  (the post's punchy title)
//        • "subline"    — text  (business name · city)      [optional]
//        • "cta"        — text  (e.g. "Book Now")           [optional]
//        • "background" — image (the photo behind the design)
//        • "logo"       — image (the center's logo)         [optional]
//   2. Copy the template's UUID.
//   3. Set env: PLACID_API_TOKEN=...  PLACID_TEMPLATE_UUID=...
// Bannerbear/Placid have near-identical REST shapes if you prefer Bannerbear.
// ───────────────────────────────────────────────────────────────
import "server-only";

export interface PosterInput {
  headline: string;
  subline?: string;
  cta?: string;
  backgroundUrl?: string; // must be a public http(s) URL
  logoUrl?: string; // public http(s) URL (data: URLs are skipped)
}

const API = "https://api.placid.app/api/rest/images";

export function posterConfigured(): boolean {
  return !!process.env.PLACID_API_TOKEN && !!process.env.PLACID_TEMPLATE_UUID;
}

const isHttp = (u?: string) => !!u && /^https?:\/\//.test(u);

/**
 * Render a branded poster and return its public image URL, or null if Placid
 * isn't configured or anything fails (caller then uses the plain background).
 */
export async function renderBrandedPoster(input: PosterInput): Promise<string | null> {
  const token = process.env.PLACID_API_TOKEN;
  const template = process.env.PLACID_TEMPLATE_UUID;
  if (!token || !template) return null;

  // Only layers we actually have; images must be public URLs.
  const layers: Record<string, unknown> = { headline: { text: input.headline } };
  if (input.subline) layers.subline = { text: input.subline };
  if (input.cta) layers.cta = { text: input.cta };
  if (isHttp(input.backgroundUrl)) layers.background = { image: input.backgroundUrl };
  if (isHttp(input.logoUrl)) layers.logo = { image: input.logoUrl };

  const auth = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  try {
    // create_now renders synchronously and returns image_url directly when it can.
    const res = await fetch(API, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ template_uuid: template, create_now: true, layers }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.errors) return null;
    if (data.status === "finished" && data.image_url) return data.image_url;

    // Otherwise poll briefly for completion (~8s max) — kept short so a batch
    // of posters in the cron can't blow the function timeout.
    const id = data.id;
    if (!id) return data.image_url ?? null;
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await fetch(`${API}/${id}`, { headers: auth, cache: "no-store" });
      const pd = await poll.json().catch(() => ({}));
      if (pd.status === "finished" && pd.image_url) return pd.image_url;
      if (pd.status === "error") return null;
    }
    return null;
  } catch {
    return null;
  }
}
