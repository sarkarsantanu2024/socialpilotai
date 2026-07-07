import { Eye, MousePointerClick, Share2, MessageCircle, Sparkles, PlayCircle, ThumbsUp, Heart } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { TrendChart } from "@/components/charts/TrendChart";
import { BarMini } from "@/components/charts/BarMini";
import { getClientData } from "@/lib/clientData";
import { generateReport } from "@/lib/ai";
import { compact } from "@/lib/utils";
import { weeklyTrend, bestDays as calcBestDays, growthPct } from "@/lib/insights";

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="grid h-[220px] place-items-center rounded-xl border border-dashed border-ink-200 px-6 text-center text-sm text-ink-400">
      {text}
    </div>
  );
}

export default async function AnalyticsPage() {
  const { posts, analytics, live } = await getClientData();
  const trend = weeklyTrend(posts, analytics);
  const { data: bestDays, highlight: bestDayIdx } = calcBestDays(posts, analytics);
  const hasData = analytics.length > 0;
  const totals = analytics.reduce(
    (acc, a) => ({
      reach: acc.reach + a.reach,
      impressions: acc.impressions + a.impressions,
      clicks: acc.clicks + a.clicks,
      shares: acc.shares + a.shares,
      comments: acc.comments + a.comments,
      reactions: acc.reactions + a.reactions,
      videoViews: acc.videoViews + a.videoViews,
    }),
    { reach: 0, impressions: 0, clicks: 0, shares: 0, comments: 0, reactions: 0, videoViews: 0 }
  );
  const totalEngagements = totals.reactions + totals.comments + totals.shares;

  const ranked = [...analytics].sort((a, b) => b.engagementRate - a.engagementRate);
  const top = ranked[0];
  const topPost = top ? posts.find((p) => p.id === top.postId) : posts[0];

  const report = hasData
    ? await generateReport({
        topPost: topPost?.title ?? "your recent posts",
        reach: totals.reach,
        engagementRate: top?.engagementRate ?? 0,
        growth: growthPct(trend),
      })
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        phase="Phase 4 · Analytics"
        title="Analytics"
        subtitle="Reach, engagement and best-time insights pulled from the Page & post Insights API, with an AI-written plain-language summary."
      />

      {/* Live pages: lead with the engagement we actually have (reach/clicks need
          the read_insights permission, which isn't granted). Demo: full funnel. */}
      {live ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Reactions" value={compact(totals.reactions)} icon={<ThumbsUp className="h-5 w-5" />} />
          <StatCard label="Comments" value={compact(totals.comments)} icon={<MessageCircle className="h-5 w-5" />} />
          <StatCard label="Shares" value={compact(totals.shares)} icon={<Share2 className="h-5 w-5" />} />
          <StatCard label="Total engagement" value={compact(totalEngagements)} icon={<Heart className="h-5 w-5" />} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Total reach" value={compact(totals.reach)} icon={<Eye className="h-5 w-5" />} />
          <StatCard label="Video views" value={compact(totals.videoViews)} icon={<PlayCircle className="h-5 w-5" />} />
          <StatCard label="Link clicks" value={compact(totals.clicks)} icon={<MousePointerClick className="h-5 w-5" />} />
          <StatCard label="Shares" value={compact(totals.shares)} icon={<Share2 className="h-5 w-5" />} />
        </div>
      )}

      <p className="px-1 text-xs text-ink-400">
        Engagement metrics (reactions, comments, shares) are always available. <b>Reach, impressions
        and link clicks</b> need Facebook&apos;s <code className="rounded bg-ink-100 px-1">read_insights</code>{" "}
        permission, granted after Meta App Review — until then those tiles may show 0.
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-2 font-semibold">Reach &amp; engagement</h2>
          {trend.length ? (
            <TrendChart data={trend} />
          ) : (
            <EmptyChart text="Your reach & engagement trend appears here once you've published posts." />
          )}
        </div>
        <div className="card p-5">
          <h2 className="mb-2 font-semibold">Best day to post</h2>
          {bestDays.length ? (
            <>
              <BarMini data={bestDays} highlight={bestDayIdx} />
              <p className="mt-2 text-sm text-ink-500"><b>{bestDays[bestDayIdx]?.label}</b> drives the most engagement.</p>
            </>
          ) : (
            <EmptyChart text="Publish on different days to discover your best day to post." />
          )}
        </div>
      </div>

      {/* AI report */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600">
            <Sparkles className="h-4 w-4" />
          </span>
          <h2 className="font-semibold">Plain-language report</h2>
          <Badge tone="violet">AI generated</Badge>
        </div>
        <p className="text-sm leading-relaxed text-ink-700">
          {report ?? "Your AI-written performance summary appears here once you have posts with engagement data."}
        </p>
      </div>

      {/* Per-post table */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-100 p-4">
          <h2 className="font-semibold">Top posts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="p-3 font-semibold">Post</th>
                <th className="p-3 font-semibold">{live ? <><ThumbsUp className="inline h-3.5 w-3.5" /> Reactions</> : "Reach"}</th>
                <th className="p-3 font-semibold"><MessageCircle className="inline h-3.5 w-3.5" /> Comments</th>
                <th className="p-3 font-semibold"><Share2 className="inline h-3.5 w-3.5" /> Shares</th>
                <th className="p-3 font-semibold">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((a) => {
                const p = posts.find((x) => x.id === a.postId)!;
                return (
                  <tr key={a.postId} className="border-t border-ink-100">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge tone="blue">{p.type}</Badge>
                        <span className="line-clamp-1 max-w-[220px] font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td className="p-3 text-ink-600">{compact(live ? a.reactions : a.reach)}</td>
                    <td className="p-3 text-ink-600">{a.comments}</td>
                    <td className="p-3 text-ink-600">{a.shares}</td>
                    <td className="p-3">
                      <span className="font-semibold text-emerald-600">{a.engagementRate}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
