import Link from "next/link";
import { Eye, Heart, Users, Megaphone, Sparkles, ArrowRight, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Greeting } from "./Greeting";
import { StatCard } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { TrendChart } from "@/components/charts/TrendChart";
import { BarMini } from "@/components/charts/BarMini";
import { getClientData } from "@/lib/clientData";
import { generateReport } from "@/lib/ai";
import { compact, fmtDate } from "@/lib/utils";
import { weeklyTrend, bestTimes as calcBestTimes, growthPct } from "@/lib/insights";
import { BoostButton } from "@/components/ui/BoostButton";
import { upcomingFestivals, daysUntil } from "@/lib/festivals";
import { UpcomingFestival } from "./UpcomingFestival";

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="grid h-[220px] place-items-center rounded-xl border border-dashed border-ink-200 px-6 text-center text-sm text-ink-400">
      {text}
    </div>
  );
}

export default async function Dashboard() {
  const { posts, analytics, leads, live, page } = await getClientData();
  const totalReach = analytics.reduce((s, a) => s + a.reach, 0);
  const avgEng =
    analytics.reduce((s, a) => s + a.engagementRate, 0) / (analytics.length || 1);

  // Real insight series derived from this center's own posts — empty until there
  // is enough data (no dummy numbers).
  const trend = weeklyTrend(posts, analytics);
  const { data: bestTimes, highlight: bestTimeIdx } = calcBestTimes(posts, analytics);
  const hasData = analytics.length > 0;
  const growth = growthPct(trend);

  // Proactively surface the next festival within ~6 weeks (festival auto-content).
  const nextFestival = upcomingFestivals(new Date(), 45, 1)[0] ?? null;

  const topAnalytics = [...analytics].sort((a, b) => b.engagementRate - a.engagementRate)[0];
  const topPost = posts.find((p) => p.id === topAnalytics?.postId) ?? posts[0];
  const report = hasData
    ? await generateReport({
        topPost: topPost?.title ?? "your recent posts",
        reach: totalReach,
        engagementRate: Number(avgEng.toFixed(1)),
        growth,
      })
    : null;

  return (
    <div className="space-y-6">
      <Greeting liveName={live ? page.name : null} />

      {/* Stats — real values only; deltas shown only when we can compute them. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Reach needs read_insights (not granted) → 0 for live pages; show "—" so
            it doesn't read as a real zero. Demo pages still show their reach. */}
        <StatCard label="Page reach" value={live && totalReach === 0 ? "—" : compact(totalReach)} delta={hasData && growth ? { value: `${Math.abs(growth)}%`, up: growth >= 0 } : undefined} icon={<Eye className="h-5 w-5" />} />
        <StatCard label="Avg engagement" value={`${avgEng.toFixed(1)}%`} icon={<Heart className="h-5 w-5" />} />
        <StatCard label="Leads captured" value={String(leads.length)} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Posts published" value={String(posts.filter((p) => p.status === "published").length)} icon={<Megaphone className="h-5 w-5" />} />
      </div>

      {/* Festival auto-content nudge */}
      {nextFestival && (
        <UpcomingFestival festival={nextFestival} daysAway={daysUntil(nextFestival.date)} />
      )}

      {/* Trend + best times */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Growth trend</h2>
            <Link href="/analytics" className="text-sm font-medium text-brand-600 hover:underline">
              View analytics
            </Link>
          </div>
          {trend.length ? (
            <TrendChart data={trend} />
          ) : (
            <EmptyChart text="Publish posts and connect your Facebook Page to see your reach & engagement trend here." />
          )}
        </div>
        <div className="card p-5">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-500" />
            <h2 className="font-semibold">Best times to post</h2>
          </div>
          {bestTimes.length ? (
            <>
              <BarMini data={bestTimes} highlight={bestTimeIdx} />
              <p className="mt-2 text-sm text-ink-500">
                Your posts perform best around <b>{bestTimes[bestTimeIdx]?.label}</b>.
              </p>
            </>
          ) : (
            <EmptyChart text="Once you publish a few posts, your best posting times will appear here." />
          )}
        </div>
      </div>

      {/* AI report + next action */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="font-semibold">AI performance report</h2>
            <Badge tone="violet">Gemini</Badge>
          </div>
          <p className="text-sm leading-relaxed text-ink-700">
            {report ?? "Your AI performance report appears here once you've published posts and have engagement data to summarise."}
          </p>
        </div>

        {topPost && hasData ? (
          <div className="card flex flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white">
            <div>
              <Badge className="bg-white/15 text-white">Recommended next step</Badge>
              <h3 className="mt-3 text-lg font-bold">Promote your top post</h3>
              <p className="mt-1 text-sm text-brand-50">
                &ldquo;{topPost.title}&rdquo; is your best performer. AI suggests a 7-day lead
                campaign at ₹250/day.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <BoostButton fbPostId={topPost.fbPostId} title={topPost.title} budget={250} days={7} />
              <Link href="/ads" className="btn bg-white/15 text-white hover:bg-white/25">
                Review <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="card flex flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white">
            <div>
              <Badge className="bg-white/15 text-white">Get started</Badge>
              <h3 className="mt-3 text-lg font-bold">Create your first post</h3>
              <p className="mt-1 text-sm text-brand-50">
                Generate a post in your brand voice, publish it to your Page, and your insights &amp;
                recommendations will start appearing here.
              </p>
            </div>
            <Link href="/studio" className="btn mt-4 bg-white text-brand-700 hover:bg-brand-50">
              Open AI Content Studio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Recent posts */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent posts</h2>
          <Link href="/posts" className="text-sm font-medium text-brand-600 hover:underline">
            See all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((p) => {
            const a = analytics.find((x) => x.postId === p.id);
            return (
              <div key={p.id} className="rounded-xl border border-ink-100 p-3">
                <div className="flex items-center justify-between">
                  <Badge tone="blue">{p.type}</Badge>
                  {p.publishedAt && (
                    <span className="text-xs text-ink-400">{fmtDate(p.publishedAt)}</span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium">{p.title}</p>
                {a && (
                  <div className="mt-3 flex gap-4 text-xs text-ink-500">
                    <span>👁 {compact(a.reach)}</span>
                    <span>❤️ {compact(a.reactions)}</span>
                    <span>🔁 {compact(a.shares)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
