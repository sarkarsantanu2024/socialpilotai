// Real data access. Reads the logged-in tenant's rows from Postgres and maps
// them to the shared domain types, so every page keeps its existing shape.
// A brand-new tenant simply has empty arrays — NO dummy data anywhere.
import "server-only";
import { prisma } from "@/lib/db";
import type { TenantData } from "@/lib/demo/tenantData";
import type { TenantWithBrand } from "@/lib/currentTenant";
import type {
  BrandKit,
  BusinessProfile,
  BusinessType,
  Campaign,
  ConnectedPage,
  Lead,
  Post,
  PostAnalytics,
} from "@/lib/types";

const DEFAULT_KIT: BrandKit = {
  logoText: "Your Brand",
  primary: "#244fdb",
  secondary: "#0ea5e9",
  accent: "#f59e0b",
  font: "Poppins",
};

const DEFAULT_PROFILE: BusinessProfile = {
  id: "biz",
  name: "Your Business",
  type: "coaching",
  city: "",
  language: "English",
  tone: "Warm, friendly, professional",
  audience: "Local customers",
};

const TYPE_CATEGORY: Record<string, string> = {
  coaching: "Education", gym: "Gym/Physical Fitness Centre", playschool: "Preschool",
  abacus: "Education", salon: "Beauty Salon", restaurant: "Restaurant",
};

// ── Tenant → brand (profile + kit) for the client BrandProvider ──
export function toBrand(tenant: TenantWithBrand): {
  tenantId: string;
  profile: BusinessProfile;
  kit: BrandKit;
} {
  const bp = tenant.businessProfile;
  const bk = tenant.brandKit;
  return {
    tenantId: tenant.id,
    profile: bp
      ? {
          id: bp.id,
          name: bp.name,
          type: bp.type as BusinessType,
          city: bp.city,
          language: bp.language,
          tone: bp.tone,
          audience: bp.audience,
        }
      : { ...DEFAULT_PROFILE, name: tenant.name ?? DEFAULT_PROFILE.name },
    kit: bk
      ? {
          logoText: bk.logoText,
          logo: bk.logoUrl ?? undefined,
          primary: bk.primary,
          secondary: bk.secondary,
          accent: bk.accent,
          font: bk.font,
        }
      : DEFAULT_KIT,
  };
}

// ── Map DB rows → domain types ──────────────────────────────────
function mapPost(p: {
  id: string; type: string; status: string; title: string; caption: string;
  hashtags: string[]; music: string | null; assetUrl: string | null;
  scheduledAt: Date | null; publishedAt: Date | null; fbPostId: string | null; source: string;
}): Post {
  return {
    id: p.id,
    type: p.type as Post["type"],
    status: p.status as Post["status"],
    title: p.title,
    caption: p.caption,
    hashtags: p.hashtags,
    music: p.music ?? undefined,
    assetUrl: p.assetUrl ?? "",
    scheduledAt: p.scheduledAt?.toISOString(),
    publishedAt: p.publishedAt?.toISOString(),
    fbPostId: p.fbPostId ?? undefined,
    // A published post carries a real Facebook post id (publishing now requires a
    // live connection) — build its permalink so the UI links to the real post.
    permalink: p.status === "published" && p.fbPostId ? `https://www.facebook.com/${p.fbPostId}` : undefined,
    source: p.source as Post["source"],
  };
}

// ── The per-tenant data bundle (same shape the pages already consume) ──
export async function getTenantBundle(tenant: TenantWithBrand): Promise<TenantData> {
  const [posts, campaigns, leads] = await Promise.all([
    prisma.post.findMany({
      where: { tenantId: tenant.id },
      include: { analytics: true },
      orderBy: [{ publishedAt: "desc" }, { scheduledAt: "asc" }],
    }),
    prisma.campaign.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: "desc" } }),
    prisma.lead.findMany({
      where: { tenantId: tenant.id },
      include: { campaign: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const brand = toBrand(tenant);
  const type = brand.profile.type;

  const domainPosts: Post[] = posts.map(mapPost);
  const analytics: PostAnalytics[] = posts
    .filter((p) => p.analytics)
    .map((p) => ({
      postId: p.id,
      reach: p.analytics!.reach,
      impressions: p.analytics!.impressions,
      reactions: p.analytics!.reactions,
      comments: p.analytics!.comments,
      shares: p.analytics!.shares,
      videoViews: p.analytics!.videoViews,
      clicks: p.analytics!.clicks,
      engagementRate: p.analytics!.engagementRate,
    }));

  const domainCampaigns: Campaign[] = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    fbCampaignId: c.fbCampaignId,
    adsetId: c.adsetId,
    adId: c.adId,
    objective: c.objective as Campaign["objective"],
    status: c.status as Campaign["status"],
    isSandbox: c.isSandbox,
    dailyBudget: c.dailyBudget,
    days: c.days,
    spend: c.spend,
    reach: c.reach,
    results: c.results,
    costPerResult: c.costPerResult,
    createdAt: c.createdAt.toISOString(),
  }));

  const domainLeads: Lead[] = leads.map((l) => ({
    id: l.id,
    campaignId: l.campaignId ?? "",
    campaignName: l.campaign?.name ?? "Lead form",
    name: l.name,
    phone: l.phone ?? "",
    email: l.email ?? "",
    interest: l.interest ?? "General enquiry",
    createdAt: l.createdAt.toISOString(),
    isTest: l.isTest,
  }));

  const page: ConnectedPage = {
    id: `tenant_${tenant.id}`,
    pageId: "",
    name: brand.profile.name,
    category: TYPE_CATEGORY[type] ?? "Business",
    followers: 0,
    connected: false,
    avatar: brand.kit.logo ?? "",
  };

  return {
    page,
    posts: domainPosts,
    analytics,
    leads: domainLeads,
    campaigns: domainCampaigns,
    recommendations: [], // derived in clientData from real post performance
  };
}
