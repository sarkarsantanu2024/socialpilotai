// Server-side: the data for the logged-in tenant.
//  • Base: the tenant's OWN rows from Postgres (drafts, scheduled posts, leads,
//    campaigns). A brand-new account is empty — no dummy data.
//  • If a Facebook Page is connected: real published posts + engagement are
//    overlaid live from the Graph API, and an ad recommendation is derived from
//    the real top-performing post.
import { getActivePage } from "@/lib/fb/connection";
import { fetchPageData } from "@/lib/meta";
import { getCurrentTenant } from "@/lib/currentTenant";
import { getTenantBundle } from "@/lib/store";
import { guessBusinessType, type TenantData } from "@/lib/demo/tenantData";
import type { AdRecommendation, BusinessType, Post, PostAnalytics } from "@/lib/types";

export interface ClientData extends TenantData {
  live: boolean; // true when posts/analytics are real Facebook data
}

const EMPTY: ClientData = {
  live: false,
  page: { id: "", pageId: "", name: "Your Business", category: "Business", followers: 0, connected: false, avatar: "" },
  posts: [], analytics: [], leads: [], campaigns: [], recommendations: [],
};

const INTERESTS: Record<string, string[]> = {
  abacus: ["Parenting", "Education", "Kids activities", "Mental maths"],
  coaching: ["Parenting", "Education", "Tutoring", "Exam preparation"],
  gym: ["Fitness and wellness", "Weight training", "Healthy lifestyle"],
  playschool: ["Parenting", "Toddlers", "Early childhood education"],
  salon: ["Beauty", "Self care", "Fashion"],
  restaurant: ["Food and drink", "Dining out", "Foodies"],
};

// Build a single ad recommendation from the top-engaging post (real or local).
function buildRecommendations(
  posts: Post[],
  analytics: PostAnalytics[],
  ctx: { name: string; category?: string; city?: string; type?: BusinessType }
): AdRecommendation[] {
  const published = posts.filter((p) => p.status === "published");
  if (!published.length || !analytics.length) return [];
  const topA = [...analytics].sort(
    (a, b) => b.reactions + b.comments + b.shares - (a.reactions + a.comments + a.shares)
  )[0];
  const top = published.find((p) => p.id === topA?.postId) ?? published[0];
  const type = ctx.type ?? guessBusinessType(`${ctx.name} ${ctx.category ?? ""}`) ?? "coaching";
  const city = ctx.city || "your city";
  return [
    {
      id: `rec_${top.id}`,
      postId: top.id,
      postFbId: top.fbPostId ?? undefined,
      postTitle: top.title,
      postThumb: top.assetUrl,
      score: 90,
      objective: "leads",
      rationale: `"${top.title}" is your top-engaging post. Promoting it for leads should turn that interest into enquiries at a low cost in ${city}.`,
      audience: { locations: [city], ageMin: 22, ageMax: 48, interests: INTERESTS[type] ?? INTERESTS.coaching },
      dailyBudget: 250,
      days: 7,
      expected: { reach: "18,000 – 26,000", results: "30 – 60 leads", costPerResult: "₹25 – ₹40 / lead" },
      status: "pending",
    },
  ];
}

export async function getClientData(): Promise<ClientData> {
  const tenant = await getCurrentTenant();
  if (!tenant) return EMPTY;

  const bundle = await getTenantBundle(tenant);
  const profileType = (tenant.businessProfile?.type as BusinessType) ?? "coaching";
  const city = tenant.businessProfile?.city ?? "";

  const fbPage = await getActivePage(tenant.id);
  if (fbPage) {
    try {
      const real = await fetchPageData(fbPage.id, fbPage.token);
      // Merge: our DB posts + the Page's live posts, without duplicates.
      //  • drafts/scheduled → always from DB (not on Facebook yet)
      //  • just-published posts → keep the DB copy until Facebook's API indexes it
      //    (there's a few-minute lag), then the live copy dedupes it out by fbPostId.
      const realFbIds = new Set(real.posts.map((p) => p.fbPostId).filter(Boolean));
      const dbExtra = bundle.posts.filter(
        (p) => p.status !== "published" || (p.fbPostId ? !realFbIds.has(p.fbPostId) : true)
      );
      const posts = [...dbExtra, ...real.posts];
      return {
        live: true,
        page: { ...bundle.page, ...real.page, connected: true },
        posts,
        analytics: real.analytics,
        leads: bundle.leads,
        campaigns: bundle.campaigns,
        recommendations: buildRecommendations(real.posts, real.analytics, {
          name: real.page.name ?? fbPage.name,
          category: fbPage.category,
          city: fbPage.city || city,
        }),
      };
    } catch (e) {
      console.warn("[clientData] live Facebook fetch failed, using DB only:", (e as Error).message);
    }
  }

  return {
    live: false,
    ...bundle,
    recommendations: buildRecommendations(bundle.posts, bundle.analytics, {
      name: bundle.page.name,
      category: bundle.page.category,
      city,
      type: profileType,
    }),
  };
}
