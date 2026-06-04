"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Sparkles, Facebook } from "lucide-react";
import { DEMO_CREDENTIALS, checkDemoLogin, setSession } from "@/lib/auth";

const FB_MESSAGES: Record<string, string> = {
  not_configured: "Real Facebook login isn't set up yet — add your Meta app keys (FB_APP_ID / FB_APP_SECRET) in .env.local. See FACEBOOK_SETUP.md.",
  denied: "Facebook login was cancelled.",
  no_pages: "That Facebook account doesn't manage any Pages.",
  token_failed: "Couldn't complete the Facebook handshake. Please try again.",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const fbMsg = FB_MESSAGES[params.get("fb") ?? ""];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function fillDemo() {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!checkDemoLogin(email, password)) {
      setError("Invalid credentials. Use the demo login below.");
      return;
    }
    setLoading(true);
    setSession();
    router.push(next);
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-500">Log in to your SocialPilot AI workspace.</p>

      {fbMsg && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">{fbMsg}</p>
      )}

      {/* Real Facebook login — runs OAuth, connects the Page, logs in. */}
      <a
        href="/api/auth/facebook"
        className="btn mt-5 w-full bg-[#1877F2] text-white hover:bg-[#0f6ae0]"
      >
        <Facebook className="h-4 w-4" /> Continue with Facebook
      </a>
      <div className="my-4 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-100" /> or <span className="h-px flex-1 bg-ink-100" />
      </div>

      {/* Demo credentials callout */}
      <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50 p-3.5 text-sm">
        <p className="flex items-center gap-1.5 font-semibold text-brand-700">
          <Sparkles className="h-4 w-4" /> Demo login
        </p>
        <p className="mt-1 text-brand-800/80">
          Email: <span className="font-medium">{DEMO_CREDENTIALS.email}</span>
          <br />
          Password: <span className="font-medium">{DEMO_CREDENTIALS.password}</span>
        </p>
        <button type="button" onClick={fillDemo} className="btn-soft mt-2.5 w-full text-xs">
          Fill demo credentials
        </button>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="you@business.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="input pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 hover:text-ink-700"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Logging in…</> : "Log in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign up
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
