import Link from "next/link";
import {
  Plane,
  Sparkles,
  CalendarDays,
  BarChart3,
  Megaphone,
  Users,
  ArrowRight,
  Check,
} from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI Content Studio", desc: "Generate captions, titles, hashtags & music ideas in your brand voice." },
  { icon: CalendarDays, title: "Schedule & Publish", desc: "Plan a month of Facebook posts and auto-publish on time." },
  { icon: BarChart3, title: "Analytics", desc: "Reach, engagement & best-time insights with a plain-language report." },
  { icon: Megaphone, title: "Ad Decisioning", desc: "AI tells you which post to promote — you approve, it runs (paused)." },
  { icon: Users, title: "Leads", desc: "Collect enquiries and manage every lead in one place — with one-tap WhatsApp follow-up." },
];

const plans = [
  { name: "Starter", price: 499, features: ["1 Facebook Page", "AI posts & scheduling", "Analytics & best-time insights"] },
  { name: "Pro", price: 999, popular: true, features: ["Everything in Starter", "Ad recommendations & campaigns", "Lead capture & ROI", "Priority AI generation"] },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-50">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-brand">
            <Plane className="h-5 w-5 -rotate-45" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            SocialPilot<span className="text-brand-600"> AI</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost text-sm">Log in</Link>
          <Link href="/signup" className="btn-primary text-sm">Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-10 text-center sm:pt-16">
        <span className="chip bg-white text-brand-700 shadow-card">
          <Sparkles className="h-3.5 w-3.5" /> Facebook marketing on autopilot
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
          Your shop&apos;s Facebook page,{" "}
          <span className="gradient-text">run by AI</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-ink-600 sm:text-lg">
          Generate posts, schedule them, track performance, and let AI recommend which one to
          promote. Built for coaching centres, gyms, playschools &amp; local businesses — from
          just ₹499/month.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="btn-primary w-full px-6 py-3 text-base sm:w-auto">
            Start free trial <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="btn-ghost w-full px-6 py-3 text-base sm:w-auto">
            Log in
          </Link>
        </div>
        <p className="mt-3 text-sm text-ink-500">14-day free trial · no card required</p>

        {/* Mock app preview */}
        <div className="mx-auto mt-14 max-w-4xl rounded-3xl border border-ink-100 bg-white/70 p-2 shadow-pop backdrop-blur">
          <div className="rounded-2xl bg-brand-radial bg-ink-50 p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { k: "Page reach (30d)", v: "47.2k", d: "+18%" },
                { k: "Engagement rate", v: "9.4%", d: "+2.1pts" },
                { k: "Leads captured", v: "24", d: "this month" },
              ].map((s) => (
                <div key={s.k} className="card p-4 text-left">
                  <p className="text-xs text-ink-500">{s.k}</p>
                  <p className="mt-1 text-2xl font-bold">{s.v}</p>
                  <p className="mt-0.5 text-xs font-medium text-emerald-600">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Everything in one loop
        </h2>
        <p className="mt-2 text-center text-ink-500">
          Generate → Schedule → Publish → Analyse → Recommend → Approve → Run → Capture leads
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card card-hover p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{f.desc}</p>
            </div>
          ))}
          <div className="card flex flex-col justify-between bg-brand-gradient p-5 text-white shadow-lift">
            <div>
              <h3 className="text-lg font-bold">Safe by design</h3>
              <ul className="mt-3 space-y-2 text-sm text-brand-50">
                {["Ads always created paused", "You approve every spend", "Works on any device"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/signup" className="btn mt-5 bg-white text-brand-700 hover:bg-brand-50">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-4xl px-5 py-12">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Simple pricing</h2>
        <p className="mt-2 text-center text-ink-500">Start free for 14 days. Cancel anytime.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`card p-6 ${p.popular ? "ring-2 ring-brand-500" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{p.name}</h3>
                {p.popular && <span className="chip bg-brand-50 text-brand-700">Most popular</span>}
              </div>
              <p className="mt-2 text-3xl font-extrabold">
                ₹{p.price}<span className="text-sm font-medium text-ink-500">/month</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink-600">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-6 w-full ${p.popular ? "btn-primary" : "btn-ghost"}`}
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-ink-100 py-6 text-center text-sm text-ink-400">
        © {new Date().getFullYear()} SocialPilot AI · Facebook marketing automation for small businesses
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-ink-600 hover:underline">Privacy Policy</Link>
      </footer>
    </div>
  );
}
