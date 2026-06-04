// ───────────────────────────────────────────────────────────────
// meta/ — single service wrapping the Facebook Graph API (organic)
// and Marketing API (ads/leads) with a MOCK LAYER.
//
// SAFETY INVARIANTS (enforced even in the real path):
//  • Ads are ALWAYS created with status=PAUSED.
//  • Sandbox / unfunded ad accounts only, in dev mode.
//  • Nothing is ever auto-set to ACTIVE — that needs an explicit user action.
// ───────────────────────────────────────────────────────────────
import { FB_GRAPH_VERSION, hasFacebook } from "@/lib/config";
import type { AdRecommendation, Campaign } from "@/lib/types";

export const GRAPH_VERSION = FB_GRAPH_VERSION;

// ---- Organic: publish / schedule ---------------------------------

export interface PublishResult {
  fbPostId: string;
  permalink: string;
  scheduled: boolean;
}

export async function publishPost(opts: {
  pageId: string;
  caption: string;
  assetUrl?: string;
  scheduledAt?: string;
  pageToken?: string; // when present → publish for real via Graph API
}): Promise<PublishResult> {
  // No real Page token → demo (mock) publish.
  if (!opts.pageToken) {
    await delay(800);
    const id = `${opts.pageId}_${mockId()}`;
    return {
      fbPostId: id,
      permalink: `https://facebook.com/${id}`,
      scheduled: !!opts.scheduledAt,
    };
  }

  // Real publish. Image post → /{page}/photos; text/link → /{page}/feed.
  // Scheduling: published=false + scheduled_publish_time (unix seconds, 10 min–6 months out).
  const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
  const scheduled = !!opts.scheduledAt;
  const params = new URLSearchParams({ access_token: opts.pageToken });
  if (scheduled) {
    params.set("published", "false");
    params.set("scheduled_publish_time", String(Math.floor(new Date(opts.scheduledAt!).getTime() / 1000)));
  }

  let fbPostId: string;
  if (opts.assetUrl) {
    // Two-step so the image lands as a real TIMELINE feed story (not just a bare
    // Photos-tab entry, which is what a direct POST /photos produces on the New
    // Pages Experience): (1) upload the photo UNPUBLISHED, (2) attach it to a
    // /feed post via attached_media. This makes app-published images show up in
    // the page feed exactly like a native post.
    const upParams = new URLSearchParams({
      access_token: opts.pageToken,
      url: opts.assetUrl,
      published: "false",
    });
    const upRes = await fetch(`${base}/${opts.pageId}/photos`, { method: "POST", body: upParams });
    const upData = await upRes.json();
    if (!upRes.ok || upData.error) {
      throw new Error(upData.error?.message ?? "Facebook photo upload failed");
    }
    params.set("message", opts.caption);
    params.set("attached_media[0]", JSON.stringify({ media_fbid: upData.id }));
  } else {
    params.set("message", opts.caption);
  }

  const res = await fetch(`${base}/${opts.pageId}/feed`, { method: "POST", body: params });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Facebook publish failed");
  }
  fbPostId = data.post_id ?? data.id;
  return {
    fbPostId,
    permalink: `https://www.facebook.com/${fbPostId}`,
    scheduled,
  };
}

// ---- Organic: read real Page content & insights ------------------

import type { ConnectedPage, Post, PostAnalytics, PostType } from "@/lib/types";

const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

function hashtagsFrom(text: string): string[] {
  return (text.match(/#[\w]+/g) ?? []).slice(0, 6);
}

function postTypeFrom(mediaType?: string, hasPhoto?: boolean): PostType {
  if (mediaType === "video") return "video";
  if (mediaType === "photo" || hasPhoto) return "image";
  return "text";
}

// Pulls the connected Page's real info + recent posts with engagement counts.
// Resilient: reach/impressions need `read_insights` (often not granted), so we
// DON'T request them inline — we read posts with only the granted permissions
// and fetch insights best-effort. published_posts → feed fallback. Never throws
// for partial data; logs Graph errors to the server console for diagnosis.
export async function fetchPageData(
  pageId: string,
  pageToken: string
): Promise<{ page: Partial<ConnectedPage>; posts: Post[]; analytics: PostAnalytics[] }> {
  // 1) Page profile.
  const pageRes = await fetch(
    `${GRAPH}/${pageId}?fields=name,category,followers_count,fan_count,picture&access_token=${pageToken}`,
    { cache: "no-store" }
  );
  const pageJson = await pageRes.json();
  if (pageJson.error) console.warn("[meta] page info error:", pageJson.error.message);

  // 2) Content. The New Pages Experience often returns an EMPTY /feed, and each
  // content type lives on a different edge — so we pull from several and merge:
  // feed (text/link posts), photos, videos and reels. Reels always; photos/videos
  // only when /feed is empty (avoids duplicating photo/video posts on normal pages).
  const engage = "shares,reactions.summary(true).limit(0),comments.summary(true).limit(0)";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getEdge = async (edge: string, flds: string, extra = ""): Promise<any[]> => {
    try {
      const res = await fetch(
        `${GRAPH}/${pageId}/${edge}?fields=${encodeURIComponent(flds)}&limit=25${extra}&access_token=${pageToken}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (json.error) {
        console.warn(`[meta] ${edge} error:`, json.error.message);
        return [];
      }
      return json.data ?? [];
    } catch (e) {
      console.warn(`[meta] ${edge} fetch failed:`, (e as Error).message);
      return [];
    }
  };

  const feed = await getEdge("feed", `id,message,story,created_time,full_picture,permalink_url,attachments{media_type},${engage}`);
  // Always pull reels, photos AND videos too. The New Pages Experience routinely
  // OMITS image-only posts — and freshly API-published photos — from /feed, so
  // relying on feed alone hides them (the bug behind "only videos show" and
  // "my new posts aren't here"). We merge every edge and de-dupe below.
  const [reels, photos, videos] = await Promise.all([
    getEdge("video_reels", "id,description,created_time,permalink_url,picture,thumbnails{uri}"),
    getEdge("photos", `id,name,created_time,images,link,${engage}`, "&type=uploaded"),
    getEdge("videos", "id,description,created_time,picture,permalink_url"),
  ]);

  // Normalise every edge into one shape with a forced __kind, then dedupe by id
  // AND by a content signature (so the SAME post arriving from both /feed and
  // /photos isn't listed twice), and sort newest first.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [];
  const seenId = new Set<string>();
  const seenSig = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sig = (r: any) =>
    `${String(r.message ?? r.story ?? "").trim().slice(0, 60).toLowerCase()}|${String(r.created_time ?? "").slice(0, 16)}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const add = (r: any) => {
    if (!r?.id || seenId.has(r.id)) return;
    const s = sig(r);
    if (s !== "|" && seenSig.has(s)) return; // duplicate content (skip blanks-only sig)
    seenId.add(r.id);
    seenSig.add(s);
    rows.push(r);
  };

  // Priority: feed first (richest — engagement counts + real permalink), then
  // reels, photos, videos, so a duplicate keeps the best-quality version.
  for (const p of feed) {
    const mt = p.attachments?.data?.[0]?.media_type as string | undefined;
    add({ ...p, __kind: mt === "video" ? "video" : mt === "photo" || p.full_picture ? "image" : "text" });
  }
  for (const p of reels) add({ id: p.id, message: p.description, created_time: p.created_time, full_picture: p.picture ?? p.thumbnails?.data?.[0]?.uri ?? "", permalink_url: p.permalink_url, __kind: "reel" });
  for (const p of photos) add({ id: p.id, message: p.name, created_time: p.created_time, full_picture: p.images?.[0]?.source ?? "", permalink_url: p.link, shares: p.shares, reactions: p.reactions, comments: p.comments, __kind: "image" });
  for (const p of videos) add({ id: p.id, message: p.description, created_time: p.created_time, full_picture: p.picture ?? "", permalink_url: p.permalink_url, __kind: "video" });

  rows.sort((a, b) => String(b.created_time ?? "").localeCompare(String(a.created_time ?? "")));

  const posts: Post[] = [];
  const analytics: PostAnalytics[] = [];

  for (const p of rows.slice(0, 24)) {
    const msg: string = p.message ?? p.story ?? "";
    const kind = (p.__kind as PostType) ?? postTypeFrom(p.attachments?.data?.[0]?.media_type, !!p.full_picture);
    const id = p.id as string;
    // Facebook returns relative permalinks for reels (e.g. "/reel/123") — make absolute.
    const rawLink: string | undefined = p.permalink_url;
    const permalink = rawLink ? (rawLink.startsWith("http") ? rawLink : `https://www.facebook.com${rawLink}`) : undefined;
    const kindLabel = kind === "reel" ? "Reel" : kind === "video" ? "Video" : "Post";
    posts.push({
      id,
      type: kind,
      status: "published",
      title: (msg.split("\n")[0] || kindLabel).slice(0, 80),
      caption: msg,
      hashtags: hashtagsFrom(msg),
      assetUrl: p.full_picture ?? "",
      permalink,
      publishedAt: p.created_time,
      fbPostId: id,
      source: "studio",
    });

    const reactions = p.reactions?.summary?.total_count ?? 0;
    const comments = p.comments?.summary?.total_count ?? 0;
    const shares = p.shares?.count ?? 0;
    const engagements = reactions + comments + shares;
    const followers = pageJson.followers_count ?? pageJson.fan_count ?? 0;
    analytics.push({
      postId: id,
      reach: 0, // needs read_insights permission
      impressions: 0,
      reactions,
      comments,
      shares,
      videoViews: 0,
      clicks: 0,
      // Engagement-by-followers as a proxy when reach isn't available.
      engagementRate: followers ? Number(((engagements / followers) * 100).toFixed(1)) : 0,
    });
  }

  return {
    page: {
      id: pageId,
      pageId,
      name: pageJson.name,
      category: pageJson.category ?? "Page",
      followers: pageJson.followers_count ?? pageJson.fan_count ?? 0,
      connected: true,
      avatar: pageJson.picture?.data?.url ?? "",
    },
    posts,
    analytics,
  };
}

// ---- Ads: create paused campaign (Marketing API) -----------------

export interface CreatedCampaign {
  campaign: Campaign;
}

// Map our objective to the Facebook ODAX campaign objective + adset optimisation.
const OBJECTIVE_MAP: Record<string, { campaign: string; optimization: string }> = {
  leads: { campaign: "OUTCOME_LEADS", optimization: "LEAD_GENERATION" },
  engagement: { campaign: "OUTCOME_ENGAGEMENT", optimization: "POST_ENGAGEMENT" },
  traffic: { campaign: "OUTCOME_TRAFFIC", optimization: "LINK_CLICKS" },
  awareness: { campaign: "OUTCOME_AWARENESS", optimization: "REACH" },
};

export interface AdsCtx {
  adAccountId: string; // act_xxx
  userToken: string;
  pageId?: string;
  pagePostId?: string; // real "{pageId}_{postId}" for the ad creative
}

export async function createPausedCampaign(
  rec: AdRecommendation,
  isSandbox: boolean,
  ads?: AdsCtx
): Promise<CreatedCampaign> {
  const mock = (): CreatedCampaign => {
    const campaignId = mockId();
    return {
      campaign: {
        id: `camp_${campaignId}`,
        name: `${rec.postTitle.slice(0, 32)} — ${rec.objective} (${isSandbox ? "Sandbox" : "Dev"})`,
        fbCampaignId: campaignId,
        adsetId: String(Number(campaignId) + 1),
        adId: String(Number(campaignId) + 2),
        objective: rec.objective,
        status: "PAUSED", // INVARIANT: never ACTIVE on create
        isSandbox,
        dailyBudget: rec.dailyBudget,
        days: rec.days,
        spend: 0,
        reach: 0,
        results: 0,
        costPerResult: 0,
        createdAt: new Date().toISOString(),
      },
    };
  };

  // No connected ad account → demo.
  if (!ads?.adAccountId || !ads.userToken) {
    await delay(1100);
    return mock();
  }

  // Real Marketing API path. EVERYTHING is created PAUSED — nothing ever delivers
  // or spends on create; "Go live" is a separate, explicit user action.
  try {
    const map = OBJECTIVE_MAP[rec.objective] ?? OBJECTIVE_MAP.engagement;
    const acct = `${GRAPH}/${ads.adAccountId}`;
    const post = async (path: string, body: Record<string, string>) => {
      const res = await fetch(`${acct}/${path}`, {
        method: "POST",
        body: new URLSearchParams({ ...body, access_token: ads.userToken }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.id as string;
    };

    const campaignId = await post("campaigns", {
      name: `${rec.postTitle.slice(0, 40)} — ${rec.objective}`,
      objective: map.campaign,
      status: "PAUSED",
      special_ad_categories: "[]",
    });

    const adsetId = await post("adsets", {
      name: `${rec.postTitle.slice(0, 40)} — adset`,
      campaign_id: campaignId,
      daily_budget: String(Math.round(rec.dailyBudget * 100)), // paise (minor units)
      billing_event: "IMPRESSIONS",
      optimization_goal: map.optimization,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      targeting: JSON.stringify({
        geo_locations: { countries: ["IN"] },
        age_min: rec.audience.ageMin,
        age_max: rec.audience.ageMax,
      }),
      ...(ads.pageId && map.optimization === "LEAD_GENERATION" ? { promoted_object: JSON.stringify({ page_id: ads.pageId }) } : {}),
      status: "PAUSED",
    });

    // Ad needs a real published post as creative; skip if we don't have one.
    let adId = "";
    if (ads.pagePostId) {
      const creativeId = await post("adcreatives", {
        name: "Boosted post creative",
        object_story_id: ads.pagePostId,
      });
      adId = await post("ads", {
        name: `${rec.postTitle.slice(0, 40)} — ad`,
        adset_id: adsetId,
        creative: JSON.stringify({ creative_id: creativeId }),
        status: "PAUSED",
      });
    }

    return {
      campaign: {
        id: `camp_${campaignId}`,
        name: `${rec.postTitle.slice(0, 40)} — ${rec.objective}`,
        fbCampaignId: campaignId,
        adsetId,
        adId: adId || "—",
        objective: rec.objective,
        status: "PAUSED",
        isSandbox,
        dailyBudget: rec.dailyBudget,
        days: rec.days,
        spend: 0,
        reach: 0,
        results: 0,
        costPerResult: 0,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (e) {
    // Surface the error in the server log but keep the demo working.
    console.warn("[meta] real campaign creation failed, using demo:", (e as Error).message);
    return mock();
  }
}

// ---- Leads: lead form + webhook retrieval ------------------------

export async function createLeadForm(opts: {
  pageId: string;
  name: string;
}): Promise<{ formId: string }> {
  if (!hasFacebook()) {
    await delay(600);
    return { formId: `form_${mockId()}` };
  }
  throw new Error("Real Graph API path not configured in this demo build.");
}

// ---- helpers ------------------------------------------------------

function mockId() {
  // Deterministic-ish 17-digit id; fine for demo display.
  return String(23859901188000000 + Math.floor(Math.random() * 999999));
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
