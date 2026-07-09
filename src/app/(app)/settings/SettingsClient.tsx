"use client";

import { useEffect, useRef, useState } from "react";
import { Facebook, Check, Building2, Palette, Link2, CreditCard, ShieldCheck, Upload, X, Loader2, Plug, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useBrand } from "@/lib/brand/store";
import type { BusinessType } from "@/lib/types";
import { cn } from "@/lib/utils";

const BUSINESS_TYPES: BusinessType[] = ["coaching", "gym", "playschool", "abacus", "salon", "restaurant"];

export interface PlanInfo {
  plan: string;
  status: string;
  trialDaysLeft: number;
  username: string;
  email: string | null;
}

export interface CenterDetails {
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  locality: string;
  address: string;
}

export function SettingsClient({ plan, details, autoPost }: { plan: PlanInfo; details: CenterDetails; autoPost: boolean }) {
  const { brand, setProfile, setKit } = useBrand();
  const { profile, kit } = brand;
  const [saved, setSaved] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  // Contact details live on the business profile but not the brand store, so
  // they're saved directly. Editable by the center's own owner/manager too.
  const [d, setD] = useState<CenterDetails>(details);
  const [savingD, setSavingD] = useState(false);
  const [dSaved, setDSaved] = useState(false);
  const setField = (k: keyof CenterDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setD((p) => ({ ...p, [k]: e.target.value })); setDSaved(false); };

  async function saveDetails() {
    setSavingD(true);
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: d }),
    });
    setSavingD(false);
    setDSaved(res.ok);
  }

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setKit({ logo: reader.result as string });
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: forms */}
      <div className="space-y-6 lg:col-span-2">
        {/* Business profile */}
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-500" />
            <h2 className="font-semibold">Business profile</h2>
            <span className="text-xs text-ink-400">— the single context object for every AI call</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name">
              <input className="input" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} />
            </Field>
            <Field label="Business type">
              <select
                className="input capitalize"
                value={profile.type}
                onChange={(e) => setProfile({ type: e.target.value as BusinessType })}
              >
                {BUSINESS_TYPES.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="City">
              <input className="input" value={profile.city} onChange={(e) => setProfile({ city: e.target.value })} />
            </Field>
            <Field label="Language">
              <input className="input" value={profile.language} onChange={(e) => setProfile({ language: e.target.value })} />
            </Field>
            <Field label="Brand tone" className="sm:col-span-2">
              <input className="input" value={profile.tone} onChange={(e) => setProfile({ tone: e.target.value })} />
            </Field>
            <Field label="Target audience" className="sm:col-span-2">
              <input className="input" value={profile.audience} onChange={(e) => setProfile({ audience: e.target.value })} />
            </Field>
          </div>
        </section>

        {/* Center contact details */}
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-brand-500" />
            <h2 className="font-semibold">Center details</h2>
            <span className="text-xs text-ink-400">— owner, contact &amp; address for this center</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Owner name">
              <input className="input" value={d.ownerName} onChange={setField("ownerName")} placeholder="e.g. Debdulal Mishra" />
            </Field>
            <Field label="Locality / area">
              <input className="input" value={d.locality} onChange={setField("locality")} placeholder="e.g. Barasat" />
            </Field>
            <Field label="Phone">
              <input className="input" value={d.phone} onChange={setField("phone")} placeholder="e.g. 74074 21404" />
            </Field>
            <Field label="WhatsApp number">
              <input className="input" value={d.whatsapp} onChange={setField("whatsapp")} placeholder="e.g. 917407421404" />
            </Field>
            <Field label="Email" className="sm:col-span-2">
              <input className="input" value={d.email} onChange={setField("email")} placeholder="branch@example.com" />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <textarea className="input min-h-[64px] resize-y" value={d.address} onChange={setField("address")} placeholder="Full street address" />
            </Field>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={saveDetails} disabled={savingD} className="btn-primary disabled:opacity-60">
              {savingD ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> Save details</>}
            </button>
            {dSaved && <span className="text-sm font-medium text-emerald-600">Saved.</span>}
          </div>
        </section>

        {/* Brand kit */}
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5 text-brand-500" />
            <h2 className="font-semibold">Brand kit</h2>
            <span className="text-xs text-ink-400">— auto-stamped on every generated post</span>
          </div>

          {/* Logo upload */}
          <Field label="Logo">
            <input ref={logoRef} type="file" accept="image/*" onChange={onLogo} className="hidden" />
            {kit.logo ? (
              <div className="flex items-center gap-3 rounded-xl border border-ink-200 p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={kit.logo} alt="Logo" className="h-12 w-12 rounded-lg object-contain ring-1 ring-ink-100" />
                <div className="flex-1 text-xs text-ink-500">Shown on every post instead of the logo text.</div>
                <button onClick={() => logoRef.current?.click()} className="btn-ghost text-xs">Replace</button>
                <button
                  onClick={() => setKit({ logo: undefined })}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  aria-label="Remove logo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => logoRef.current?.click()}
                className="flex w-full items-center gap-2 rounded-xl border border-dashed border-ink-200 bg-ink-50 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-ink-400 ring-1 ring-ink-200">
                  <Upload className="h-4 w-4" />
                </span>
                <span className="text-sm">
                  <span className="block font-medium">Upload your logo</span>
                  <span className="block text-[11px] text-ink-400">PNG/JPG. Used on posts in place of the logo text.</span>
                </span>
              </button>
            )}
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Logo text (fallback)">
              <input className="input" value={kit.logoText} onChange={(e) => setKit({ logoText: e.target.value })} />
            </Field>
            <Field label="Font">
              <input className="input" value={kit.font} onChange={(e) => setKit({ font: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <ColorField label="Primary" value={kit.primary} onChange={(v) => setKit({ primary: v })} />
            <ColorField label="Secondary" value={kit.secondary} onChange={(v) => setKit({ secondary: v })} />
            <ColorField label="Accent" value={kit.accent} onChange={(v) => setKit({ accent: v })} />
          </div>

          {/* live preview */}
          <div className="mt-4">
            <p className="label">Live template preview</p>
            <div
              className="flex aspect-[16/6] max-w-md flex-col justify-between rounded-xl p-4 text-white"
              style={{ background: `linear-gradient(135deg, ${kit.primary}, ${kit.secondary})` }}
            >
              {kit.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={kit.logo} alt="" className="h-8 w-fit max-w-[120px] rounded-md bg-white/20 object-contain p-1" />
              ) : (
                <span className="w-fit rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold">{kit.logoText}</span>
              )}
              <span className="w-fit rounded-md px-2.5 py-1 text-xs font-bold text-ink-900" style={{ background: kit.accent }}>
                Book your free demo
              </span>
            </div>
          </div>
        </section>

        <button onClick={() => setSaved(true)} className="btn-primary">
          {saved ? <><Check className="h-4 w-4" /> Saved</> : "Save changes"}
        </button>
        <p className="text-xs text-ink-400">Changes apply instantly across the app and are saved on this device.</p>
      </div>

      {/* Right: connections */}
      <div className="space-y-6">
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-brand-500" />
            <h2 className="font-semibold">Connections</h2>
          </div>

          {/* FB page — real OAuth connect */}
          <FacebookCard />

          {/* Ad account */}
          <div className="mt-3 rounded-xl border border-ink-100 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700"><ShieldCheck className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">Ad account</p>
                <p className="text-xs text-ink-400">Connect via “Ads &amp; Leads” above to run campaigns</p>
              </div>
              <Badge tone="amber">Sandbox</Badge>
            </div>
            <p className="mt-2 text-[11px] text-ink-400">
              No funding source — cannot spend. Connect a funded account only when going live.
            </p>
          </div>
        </section>

        <AutoPostCard initial={autoPost} />

        <PlanCard plan={plan} />
      </div>
    </div>
  );
}

// Opt-in weekly auto-content for THIS center. Off by default; when on, the plan
// cron schedules the week's posts ahead for review.
function AutoPostCard({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !on;
    setOn(next);
    setSaving(true);
    try {
      const res = await fetch("/api/center/autopost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoPost: next }),
      });
      const d = await res.json().catch(() => ({}));
      if (!d.ok) setOn(!next); // revert on failure
    } catch {
      setOn(!next);
    }
    setSaving(false);
  }

  return (
    <section className="card p-5">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand-500" />
        <h2 className="font-semibold">Auto-posting</h2>
      </div>
      <p className="text-xs text-ink-400">
        2 AI posts a week (Wed &amp; Sat, 8&nbsp;PM) plus festival greetings, scheduled a few days ahead so you can
        review, edit or delete them in <b>Posts → Scheduled</b> before they go live.
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{on ? "On for this center" : "Off"}</span>
        <button
          onClick={toggle}
          disabled={saving}
          aria-pressed={on}
          className={cn("relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60", on ? "bg-brand-600" : "bg-ink-300")}
        >
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
        </button>
      </div>
    </section>
  );
}

type FbStatus = {
  configured: boolean;
  connected: boolean;
  userName: string | null;
  activePageId: string | null;
  pages: { id: string; name: string }[];
  adsConnected: boolean;
  adAccountId: string | null;
};

function FacebookCard() {
  const [status, setStatus] = useState<FbStatus | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/fb/status", { cache: "no-store" });
      setStatus(await res.json());
    } catch {
      setStatus({ configured: false, connected: false, userName: null, activePageId: null, pages: [], adsConnected: false, adAccountId: null });
    }
  }

  useEffect(() => {
    load();
    // Surface the ?fb=... result from the OAuth redirect.
    const fb = new URLSearchParams(window.location.search).get("fb");
    const msg: Record<string, string> = {
      connected: "✅ Facebook connected! You can now publish live.",
      not_configured: "⚠️ No Meta app configured yet — see FACEBOOK_SETUP.md.",
      denied: "Connection cancelled.",
      no_pages: "No Facebook Pages found on that account.",
      token_failed: "Couldn't complete the Facebook handshake. Try again.",
    };
    if (fb && msg[fb]) {
      setBanner(msg[fb]);
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  async function selectPage(id: string) {
    await fetch("/api/fb/select-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: id }),
    });
    load();
  }

  async function disconnect() {
    await fetch("/api/fb/disconnect", { method: "POST" });
    load();
  }

  return (
    <div className="rounded-xl border border-ink-100 p-4">
      {banner && (
        <p className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">{banner}</p>
      )}

      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1877F2] text-white"><Facebook className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {status?.connected
              ? status.pages.find((p) => p.id === status.activePageId)?.name ?? "Connected Page"
              : "Facebook Page"}
          </p>
          <p className="text-xs text-ink-400">
            {!status ? "Checking…" : status.connected ? `Connected as ${status.userName ?? "you"}` : "Not connected"}
          </p>
        </div>
        {status?.connected && <Badge tone="green">Connected</Badge>}
      </div>

      {/* Page picker when several Pages are managed */}
      {status?.connected && status.pages.length > 1 && (
        <select
          className="input mt-3 text-sm"
          value={status.activePageId ?? ""}
          onChange={(e) => selectPage(e.target.value)}
        >
          {status.pages.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      <div className="mt-3">
        {!status ? (
          <span className="flex items-center gap-2 text-xs text-ink-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</span>
        ) : status.connected ? (
          <div className="space-y-2">
            {status.adsConnected ? (
              <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                <Check className="h-3.5 w-3.5" /> Ads & Leads connected ({status.adAccountId})
              </p>
            ) : (
              <a href="/api/auth/facebook?premium=1" className="btn-soft flex w-full items-center justify-center text-sm">
                <Plug className="h-4 w-4" /> Connect Ads & Leads (premium)
              </a>
            )}
            <button onClick={disconnect} className="btn-ghost w-full text-sm">Disconnect</button>
          </div>
        ) : status.configured ? (
          <a href="/api/auth/facebook" className="btn-primary flex w-full items-center justify-center text-sm">
            <Plug className="h-4 w-4" /> Connect Facebook Page
          </a>
        ) : (
          <div className="rounded-lg bg-amber-50 p-3 text-[11px] text-amber-800">
            <b>Demo mode.</b> To publish live, add your Meta app keys
            (<span className="font-mono">FB_APP_ID</span> / <span className="font-mono">FB_APP_SECRET</span>) in
            <span className="font-mono"> .env.local</span> and restart — see <b>FACEBOOK_SETUP.md</b>.
          </div>
        )}
      </div>

      <p className="mt-2 text-[11px] text-ink-400">
        Development mode — acts only on Pages you have a role on. No App Review needed for testing.
      </p>
    </div>
  );
}

const PLANS = [
  { key: "starter", name: "Starter", price: 499, blurb: "1 Page · AI posts · scheduling · analytics" },
  { key: "pro", name: "Pro", price: 999, blurb: "Everything + ad recommendations, leads & priority AI" },
];

function PlanCard({ plan }: { plan: PlanInfo }) {
  const current = plan.plan === "trial" ? "Free trial" : plan.plan === "pro" ? "Pro" : "Starter";
  const onTrial = plan.plan === "trial";

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-brand-500" />
        <h2 className="font-semibold">Plan &amp; billing</h2>
      </div>

      {/* Current status */}
      <div className="rounded-xl bg-brand-gradient p-4 text-white shadow-brand">
        <p className="text-sm text-brand-100">Current plan</p>
        <p className="text-2xl font-bold">{current}</p>
        {onTrial ? (
          <p className="mt-1 text-xs text-brand-100">
            {plan.trialDaysLeft > 0
              ? `${plan.trialDaysLeft} day${plan.trialDaysLeft === 1 ? "" : "s"} left in your free trial`
              : "Your trial has ended — choose a plan to keep publishing."}
          </p>
        ) : (
          <p className="mt-1 text-xs text-brand-100 capitalize">Status: {plan.status}</p>
        )}
      </div>

      {/* Tiers */}
      <div className="mt-3 space-y-2">
        {PLANS.map((p) => {
          const active = plan.plan === p.key;
          return (
            <div
              key={p.key}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3",
                active ? "border-brand-300 bg-brand-50" : "border-ink-100"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {p.name} <span className="text-ink-400">· ₹{p.price}/mo</span>
                </p>
                <p className="truncate text-[11px] text-ink-500">{p.blurb}</p>
              </div>
              {active ? (
                <Badge tone="green">Current</Badge>
              ) : (
                <a
                  href={`mailto:sarkarsantanu69@gmail.com?subject=Upgrade to ${p.name} (₹${p.price}/mo)`}
                  className="btn-soft text-xs"
                >
                  Upgrade
                </a>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-ink-400">
        Payments are handled manually for now — tap <b>Upgrade</b> to request a plan; automated
        card/UPI billing can be switched on later.
      </p>
    </section>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-ink-200" />
        <span className="font-mono text-xs text-ink-500">{value}</span>
      </div>
    </div>
  );
}
