// Server-side: the data for the active client. If their Facebook Page is
// connected (real OAuth), posts/analytics/page come LIVE from the Graph API;
// otherwise we fall back to the per-tenant demo dataset. Leads/campaigns/
// recommendations stay demo until the Ads & Leads (premium) APIs are connected.
import { getConnection, activePage } from "@/lib/fb/session";
import { fetchPageData } from "@/lib/meta";
import { activeTenantData } from "@/lib/tenant";
import type { TenantData } from "@/lib/demo/tenantData";

export interface ClientData extends TenantData {
  live: boolean; // true when posts/analytics are real Facebook data
}

export async function getClientData(): Promise<ClientData> {
  const demo = activeTenantData();
  const page = activePage(getConnection());
  if (!page) return { live: false, ...demo };

  try {
    const real = await fetchPageData(page.id, page.token);
    return {
      live: true,
      page: { ...demo.page, ...real.page },
      posts: real.posts, // real posts (may be empty — that's honest "live")
      analytics: real.analytics,
      leads: demo.leads,
      campaigns: demo.campaigns,
      recommendations: demo.recommendations,
    };
  } catch (e) {
    // Token expired / API error → safe demo fallback. Logged for diagnosis.
    console.warn("[clientData] live fetch failed, using demo:", (e as Error).message);
    return { live: false, ...demo };
  }
}
