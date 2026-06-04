// Server-side: the data for the active client.
//  • Connected (live): posts/analytics are REAL Facebook data. Leads & campaigns
//    are empty until real Lead Ads / paid campaigns exist (NO dummy data). The ad
//    recommendation is derived from the client's real top-engaging post.
//  • Not connected: the per-tenant demo dataset (demo mode only).
import { getConnection, activePage, type FbPage } from "@/lib/fb/session";
import { fetchPageData } from "@/lib/meta";
import { activeTenantData } from "@/lib/tenant";
import { guessBusinessType, type TenantData } from "@/lib/demo/tenantData";
import type { AdRecommendation, Post, PostAnalytics } from "@/lib/types";

export interface ClientData extends TenantData {
  live: boolean; // true when posts/analytics are real Facebook data
}

const INTERESTS: Record<string, string[]> = {
  abacus: ["Parenting", "Education", "Kids activities", "Mental maths"],
  coaching: ["Parenting", "Education", "Tutoring", "Exam preparation"],
  gym: ["Fitness and wellness", "Weight training", "Healthy lifestyle"],
  playschool: ["Parenting", "Toddlers", "Early childhood education"],
  salon: ["Beauty", "Self care", "Fashion"],
  restaurant: ["Food and drink", "Dining out", "Foodies"],
};

// Build a single ad recommendation from the REAL top-engaging post.
function buildRecommendations(posts: Post[], analytics: PostAnalytics[], page: FbPage): AdRecommendation[] {
  if (!posts.length) return [];
  const topA = [...analytics].sort(
    (a, b) => b.reactions + b.comments + b.shares - (a.reactions + a.comments + a.shares)
  )[0];
  const top = posts.find((p) => p.id === topA?.postId) ?? posts[0];
  const type = guessBusinessType(`${page.name} ${page.category ?? ""}`) ?? "coaching";
  const city = page.city || "your city";
  return [
    {
      id: `rec_${top.id}`,
      postId: top.id,
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
  const page = activePage(getConnection());
  if (!page) return { live: false, ...activeTenantData() };

  try {
    const real = await fetchPageData(page.id, page.token);
    return {
      live: true,
      page: { ...activeTenantData().page, ...real.page },
      posts: real.posts,
      analytics: real.analytics,
      leads: [], // real leads arrive via the Lead Ads webhook (merged on the Leads page)
      campaigns: [], // no real campaigns until a paid ad is run
      recommendations: buildRecommendations(real.posts, real.analytics, page),
    };
  } catch (e) {
    console.warn("[clientData] live fetch failed:", (e as Error).message);
    return { live: false, ...activeTenantData() };
  }
}
