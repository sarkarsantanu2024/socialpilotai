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
  { icon: Users, title: "Leads", desc: "Capture lead-form submissions and see cost-per-lead in real time." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-brand-50">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Plane className="h-5 w-5 -rotate-45" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            SocialPilot<span className="text-brand-600"> AI</span>
          </span>
        </div>
        <Link href="/login" className="btn-ghost text-sm">
          Log in
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-10 text-center sm:pt-16">
        <span className="chip bg-white text-brand-700 shadow-card">
          <Sparkles className="h-3.5 w-3.5" /> Facebook marketing on autopilot
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Your shop's Facebook page,{" "}
          <span className="text-brand-600">run by AI</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink-600 sm:text-lg">
          Generate posts, schedule them, track performance, and let AI recommend
          which one to promote. Built for coaching centres, gyms, playschools &
          local businesses — for just ₹499/month.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/login" className="btn-primary w-full px-6 py-3 text-base sm:w-auto">
            Try the live demo <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="text-sm text-ink-500">Demo login provided · ₹0 · fully clickable</span>
        </div>

        {/* Mock app preview */}
        <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-ink-100 bg-white p-2 shadow-pop">
          <div className="rounded-xl bg-ink-50 p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { k: "Page reach (30d)", v: "47.2k", d: "+18%" },
                { k: "Engagement rate", v: "9.4%", d: "+2.1pts" },
                { k: "Leads captured", v: "5", d: "Sandbox" },
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
        <h2 className="text-center text-2xl font-bold tracking-tight">
          Everything in one loop
        </h2>
        <p className="mt-2 text-center text-ink-500">
          Generate → Schedule → Publish → Analyse → Recommend → Approve → Run → Capture leads
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{f.desc}</p>
            </div>
          ))}
          <div className="card flex flex-col justify-between bg-brand-600 p-5 text-white">
            <div>
              <h3 className="text-lg font-bold">Ready in minutes</h3>
              <ul className="mt-3 space-y-2 text-sm text-brand-50">
                {["No money ever spent in demo", "Ads always created paused", "Works on any device"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/login" className="btn mt-5 bg-white text-brand-700 hover:bg-brand-50">
              Enter dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-100 py-6 text-center text-sm text-ink-400">
        SocialPilot AI · Demo build · Facebook-only automation for small businesses
      </footer>
    </div>
  );
}
