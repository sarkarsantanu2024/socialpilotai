import Link from "next/link";
import { Plane, Sparkles, CalendarClock, BarChart3, Check } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Sparkles, text: "AI writes posts in your brand voice" },
  { icon: CalendarClock, text: "Schedule a month & auto-publish" },
  { icon: BarChart3, text: "Track reach, leads & what to promote" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-brand">
            <Plane className="h-5 w-5 -rotate-45" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            SocialPilot<span className="text-brand-600"> AI</span>
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm animate-fade-up py-8">{children}</div>
        </div>
        <p className="text-center text-xs text-ink-400">
          © {new Date().getFullYear()} SocialPilot AI · Facebook marketing on autopilot
        </p>
      </div>

      {/* Right: brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-gradient p-12 text-white lg:flex">
        {/* soft glow accents */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand-300/20 blur-3xl" />

        <div className="relative">
          <span className="chip bg-white/15 text-white backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Built for local businesses
          </span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight">
            Your Facebook page,
            <br /> run by AI.
          </h2>
          <p className="mt-4 max-w-md text-brand-100">
            Generate posts, schedule them, track performance, and let AI recommend which one to
            promote — all in your brand voice.
          </p>
          <ul className="mt-7 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-center gap-3 text-sm text-brand-50">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15 backdrop-blur">
                  <h.icon className="h-4 w-4" />
                </span>
                {h.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-sm text-brand-100">
          <Check className="h-4 w-4" /> Coaching centres · gyms · playschools · salons &amp; more
        </div>
      </div>
    </div>
  );
}
