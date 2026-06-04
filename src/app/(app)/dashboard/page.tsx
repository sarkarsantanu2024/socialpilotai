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

const trend = [
  { label: "Wk 1", reach: 6200, engagement: 480 },
  { label: "Wk 2", reach: 8900, engagement: 720 },
  { label: "Wk 3", reach: 11200, engagement: 1180 },
  { label: "Wk 4", reach: 15600, engagement: 1640 },
  { label: "Wk 5", reach: 14280, engagement: 1980 },
  { label: "Now", reach: 17400, engagement: 2310 },
];

const bestTimes = [
  { label: "6am", value: 12 },
  { label: "9am", value: 34 },
  { label: "12pm", value: 28 },
  { label: "3pm", value: 22 },
  { label: "6pm", value: 58 },
  { label: "9pm", value: 41 },
];

export default async function Dashboard() {
  const { posts, analytics, leads, campaigns, live, page } = await getClientData();
  const totalReach = analytics.reduce((s, a) => s + a.reach, 0);
  const avgEng =
    analytics.reduce((s, a) => s + a.engagementRate, 0) / (analytics.length || 1);

  const topAnalytics = [...analytics].sort((a, b) => b.engagementRate - a.engagementRate)[0];
  const topPost = posts.find((p) => p.id === topAnalytics?.postId) ?? posts[0];
  const report = await generateReport({
    topPost: topPost?.title ?? "your recent posts",
    reach: totalReach,
    engagementRate: Number(avgEng.toFixed(1)),
    growth: 18,
  });

  return (
    <div className="space-y-6">
      <Greeting liveName={live ? page.name : null} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Page reach (30d)" value={compact(totalReach)} delta={{ value: "18% vs last month", up: true }} icon={<Eye className="h-5 w-5" />} />
        <StatCard label="Avg engagement" value={`${avgEng.toFixed(1)}%`} delta={{ value: "2.1 pts", up: true }} icon={<Heart className="h-5 w-5" />} />
        <StatCard label="Leads captured" value={String(leads.length)} delta={{ value: "Sandbox", up: true }} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active campaigns" value={String(campaigns.filter((c) => c.status !== "COMPLETED").length)} delta={{ value: "Paused — safe", up: true }} icon={<Megaphone className="h-5 w-5" />} />
      </div>

      {/* Trend + best times */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Growth trend</h2>
            <Link href="/analytics" className="text-sm font-medium text-brand-600 hover:underline">
              View analytics
            </Link>
          </div>
          <TrendChart data={trend} />
        </div>
        <div className="card p-5">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-500" />
            <h2 className="font-semibold">Best times to post</h2>
          </div>
          <BarMini data={bestTimes} highlight={4} />
          <p className="mt-2 text-sm text-ink-500">
            Your audience is most active at <b>6 PM</b>. Schedule reels then.
          </p>
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
          <p className="text-sm leading-relaxed text-ink-700">{report}</p>
        </div>

        <div className="card flex flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white">
          <div>
            <Badge className="bg-white/15 text-white">Recommended next step</Badge>
            <h3 className="mt-3 text-lg font-bold">Promote your top reel</h3>
            <p className="mt-1 text-sm text-brand-50">
              "{topPost?.title ?? "Your top post"}" is outperforming everything. AI suggests a
              7-day lead campaign at ₹250/day.
            </p>
          </div>
          <Link href="/ads" className="btn mt-4 bg-white text-brand-700 hover:bg-brand-50">
            Review recommendation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
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
