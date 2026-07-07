"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { BusinessType } from "@/lib/types";

const BUSINESS_TYPES: BusinessType[] = ["coaching", "gym", "playschool", "abacus", "salon", "restaurant"];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [type, setType] = useState<BusinessType>("coaching");
  const [city, setCity] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setError("Please accept the Privacy Policy to continue."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, business, type, city, username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create account.");
        setLoading(false);
        return;
      }
      // Account created — send them to login to sign in (no auto-login).
      router.push("/login?registered=1");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-ink-500">
        Start running your page on autopilot in minutes.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" className="input" placeholder="Priya Sharma" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="business">Business name</label>
          <input id="business" className="input" placeholder="Bright Minds Coaching Centre" value={business} onChange={(e) => setBusiness(e.target.value)} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="type">Business type</label>
            <select id="type" className="input capitalize" value={type} onChange={(e) => setType(e.target.value as BusinessType)}>
              {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="city">City</label>
            <input id="city" className="input" placeholder="Pune" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" type="text" autoComplete="username" className="input" placeholder="brightminds_pune" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
          <p className="mt-1 text-[11px] text-ink-400">Letters, numbers, dots &amp; underscores. This is what you&apos;ll log in with.</p>
        </div>
        <div>
          <label className="label" htmlFor="email">Email <span className="font-normal text-ink-400">(optional — for receipts &amp; reminders)</span></label>
          <input id="email" type="email" autoComplete="email" className="input" placeholder="you@business.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              className="input pr-10"
              placeholder="At least 8 characters"
              minLength={8}
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

        <label className="flex items-start gap-2 text-xs text-ink-500">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
          <span>I agree to the <a href="/privacy" target="_blank" className="font-medium text-brand-600 hover:underline">Privacy Policy</a>, and I understand my data (and any leads I collect) is handled per the India DPDP Act.</span>
        </label>

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Log in
        </Link>
      </p>
    </>
  );
}
