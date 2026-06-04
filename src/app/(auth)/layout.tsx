import Link from "next/link";
import { Plane } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
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
          SocialPilot AI · Demo build
        </p>
      </div>

      {/* Right: brand panel */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-800 p-12 text-white lg:flex">
        <div />
        <div>
          <h2 className="text-3xl font-extrabold leading-tight">
            Facebook marketing on autopilot.
          </h2>
          <p className="mt-4 max-w-md text-brand-100">
            Generate posts, schedule them, track performance, and let AI
            recommend which one to promote — all in your brand voice.
          </p>
        </div>
        <p className="text-sm text-brand-200">
          Built for coaching centres, gyms, playschools & local businesses.
        </p>
      </div>
    </div>
  );
}
