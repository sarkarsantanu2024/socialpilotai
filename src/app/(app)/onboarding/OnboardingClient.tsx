"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Facebook, Sparkles, Store } from "lucide-react";
import { cn } from "@/lib/utils";

type Profile = { name: string; type: string; city: string; audience: string; language: string };
const TYPES = ["abacus", "coaching", "gym", "playschool", "salon", "restaurant"];
const LANGS = ["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi", "Hinglish"];

export function OnboardingClient({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [p, setP] = useState<Profile>(initial);
  const [saving, setSaving] = useState(false);
  const [fbConnected, setFbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/fb/status", { cache: "no-store" }).then((r) => r.json()).then((d) => setFbConnected(!!d?.connected)).catch(() => setFbConnected(false));
  }, [step]);

  async function saveProfile() {
    setSaving(true);
    await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: p }) }).catch(() => {});
    setSaving(false);
    setStep(2);
  }
  async function finish() {
    await fetch("/api/onboarding/complete", { method: "POST" }).catch(() => {});
    router.push("/dashboard");
    router.refresh();
  }

  const steps = ["Business", "Facebook", "First post"];

  return (
    <div className="mx-auto max-w-xl py-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Let&apos;s set up your workspace</h1>
        <p className="mt-1 text-sm text-ink-500">Three quick steps and you&apos;re ready to post.</p>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={cn("grid h-8 w-8 place-items-center rounded-full text-sm font-semibold", step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-400")}>
              {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("hidden text-sm font-medium sm:inline", step === i + 1 ? "text-ink-800" : "text-ink-400")}>{s}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-ink-200" />}
          </div>
        ))}
      </div>

      <div className="card p-6">
        {step === 1 && (
          <div className="space-y-3">
            <div className="mb-1 flex items-center gap-2"><Store className="h-5 w-5 text-brand-600" /><h2 className="font-bold">Your business</h2></div>
            <label className="block text-xs font-medium text-ink-600">Business name
              <input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} className="input mt-1" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-ink-600">Type
                <select value={p.type} onChange={(e) => setP({ ...p, type: e.target.value })} className="input mt-1 capitalize">{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              </label>
              <label className="block text-xs font-medium text-ink-600">City
                <input value={p.city} onChange={(e) => setP({ ...p, city: e.target.value })} className="input mt-1" />
              </label>
            </div>
            <label className="block text-xs font-medium text-ink-600">Who are your customers?
              <input value={p.audience} onChange={(e) => setP({ ...p, audience: e.target.value })} placeholder="e.g. Parents of 5–14 year olds" className="input mt-1" />
            </label>
            <label className="block text-xs font-medium text-ink-600">Content language
              <select value={p.language} onChange={(e) => setP({ ...p, language: e.target.value })} className="input mt-1">{LANGS.map((l) => <option key={l} value={l}>{l}</option>)}</select>
            </label>
            <button disabled={saving} onClick={saveProfile} className="btn-primary mt-2 w-full disabled:opacity-60">{saving ? "Saving…" : "Continue"} <ArrowRight className="h-4 w-4" /></button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#1877F2] text-white"><Facebook className="h-6 w-6" /></span>
            <h2 className="font-bold">Connect your Facebook Page</h2>
            <p className="text-sm text-ink-500">This lets SocialPilot publish and read insights for your Page. You log into your own Facebook — we never see your password.</p>
            {fbConnected ? (
              <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-600"><Check className="h-4 w-4" /> Facebook connected</p>
            ) : (
              <a href="/api/auth/facebook" className="btn-primary w-full">Connect Facebook</a>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1">Back</button>
              <button onClick={() => setStep(3)} className="btn-primary flex-1">{fbConnected ? "Continue" : "Skip for now"} <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Sparkles className="h-6 w-6" /></span>
            <h2 className="font-bold">You&apos;re all set!</h2>
            <p className="text-sm text-ink-500">Generate your first AI post in your brand voice, or head to the dashboard.</p>
            <a href="/studio" className="btn-primary w-full">Create my first post <ArrowRight className="h-4 w-4" /></a>
            <button onClick={finish} className="btn-ghost w-full">Go to dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}
