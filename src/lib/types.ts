// Shared domain types — mirror the Prisma schema (see prisma/schema.prisma).
// Every entity is scoped by tenantId in the real data model.

export type BusinessType =
  | "coaching"
  | "gym"
  | "playschool"
  | "abacus"
  | "salon"
  | "restaurant";

export type PostType = "image" | "video" | "reel" | "text";

export type PostStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "failed";

export type AdObjective = "engagement" | "leads" | "traffic" | "awareness";

export type RecommendationStatus = "pending" | "approved" | "rejected";

export type CampaignStatus = "PAUSED" | "ACTIVE" | "COMPLETED";

export interface BusinessProfile {
  id: string;
  name: string;
  type: BusinessType;
  city: string;
  language: string;
  tone: string;
  audience: string;
}

export interface BrandKit {
  logoText: string;
  logo?: string; // uploaded logo image (data URL); falls back to logoText when absent
  primary: string;
  secondary: string;
  accent: string;
  font: string;
}

export interface ConnectedPage {
  id: string;
  pageId: string;
  name: string;
  category: string;
  followers: number;
  connected: boolean;
  avatar: string;
}

export interface AdAccount {
  id: string;
  actId: string;
  name: string;
  currency: string;
  fundingOk: boolean;
  isSandbox: boolean;
}

export interface PostVariation {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  music: string;
  cta: string;
}

export interface Post {
  id: string;
  type: PostType;
  status: PostStatus;
  title: string;
  caption: string;
  hashtags: string[];
  music?: string;
  assetUrl: string;
  scheduledAt?: string; // ISO
  publishedAt?: string; // ISO
  fbPostId?: string;
  permalink?: string; // real Facebook URL, set only on a live publish
  source: "studio" | "festival" | "segment";
}

export interface PostAnalytics {
  postId: string;
  reach: number;
  impressions: number;
  reactions: number;
  comments: number;
  shares: number;
  videoViews: number;
  clicks: number;
  engagementRate: number; // %
}

export interface AdRecommendation {
  id: string;
  postId: string;
  postFbId?: string; // the real Facebook post id, for the Boost deep-link
  postTitle: string;
  postThumb: string;
  score: number; // 0-100 performance score
  objective: AdObjective;
  rationale: string;
  audience: {
    locations: string[];
    ageMin: number;
    ageMax: number;
    interests: string[];
  };
  dailyBudget: number; // INR
  days: number;
  expected: {
    reach: string;
    results: string;
    costPerResult: string;
  };
  status: RecommendationStatus;
}

export interface Campaign {
  id: string;
  name: string;
  fbCampaignId: string;
  adsetId: string;
  adId: string;
  objective: AdObjective;
  status: CampaignStatus;
  isSandbox: boolean;
  dailyBudget: number;
  days: number;
  spend: number;
  reach: number;
  results: number;
  costPerResult: number;
  createdAt: string;
}

export interface Lead {
  id: string;
  campaignId: string;
  campaignName: string;
  name: string;
  phone: string;
  email: string;
  interest: string;
  createdAt: string;
  isTest: boolean;
  status?: string; // new | contacted | enrolled | lost
  notes?: string;
}

export interface CalendarEntry {
  date: string; // YYYY-MM-DD
  postId?: string;
  type: PostType;
  status: PostStatus;
  title: string;
}

export interface Festival {
  date: string; // YYYY-MM-DD
  name: string;
  emoji: string;
  blurb: string;
  // Ready-to-edit post content (Module 3 — Content Intelligence).
  postType?: PostType | "carousel";
  caption?: string;
  hashtags?: string[];
  imageQuery?: string; // stock-photo search term for the visual
}

export interface SegmentTemplate {
  id: string;
  type: BusinessType;
  label: string;
  emoji: string;
  prompt: string;
  sampleCaption: string;
  hashtags: string[];
}
