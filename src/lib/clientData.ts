// Server-side: the data for the active client. If their Facebook Page is
// connected (real OAuth), posts/analytics/page come LIVE from the Graph API;
// otherwise we fall back to the per-tenant demo dataset. Leads/campaigns/
// recommendations stay demo until the Ads & Leads (premium) APIs are connected.
import { getConnection, activePage } from "@/lib/fb/session";
import { fetchPageData } from "@/lib/meta";
import { activeTenantData } from "@/lib/tenant";
import { buildForType, guessBusinessType, type TenantData } from "@/lib/demo/tenantData";

export interface ClientData extends TenantData {
  live: boolean; // true when posts/analytics are real Facebook data
}

// Themed sample dataset (leads/campaigns/recommendations) matching the connected
// Page's business type, named after the Page. Falls back to the demo tenant when
// no Page is connected. Synchronous — no Graph call (use for ads/leads pages).
export function getClientSamples(): TenantData {
  const page = activePage(getConnection());
  if (!page) return activeTenantData();
  const type = guessBusinessType(`${page.name} ${page.category ?? ""}`);
  return type ? buildForType(type, page.name) : activeTenantData();
}

export async function getClientData(): Promise<ClientData> {
  const page = activePage(getConnection());
  const sample = getClientSamples();
  if (!page) return { live: false, ...sample };

  try {
    const real = await fetchPageData(page.id, page.token);
    return {
      live: true,
      page: { ...sample.page, ...real.page },
      posts: real.posts, // real posts (may be empty — that's honest "live")
      analytics: real.analytics,
      // Ads/leads have no real data without paid campaigns — themed samples.
      leads: sample.leads,
      campaigns: sample.campaigns,
      recommendations: sample.recommendations,
    };
  } catch (e) {
    // Token expired / API error → safe themed-sample fallback. Logged for diagnosis.
    console.warn("[clientData] live fetch failed, using samples:", (e as Error).message);
    return { live: false, ...sample };
  }
}
