"use client";

import { useEffect, useRef, useState } from "react";
import { Facebook, Check, Building2, Palette, Link2, CreditCard, ShieldCheck, Upload, X, Loader2, Plug, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { MessageModal } from "@/components/ui/MessageModal";
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

export interface AutoPostConfigUI {
  days: number[];
  time: string;
  frequency: "weekly" | "fortnightly" | "monthly";
  startDate: string;
  endDate: string;
  slideshow: boolean;
  festivals: boolean;
}

export function SettingsClient({ plan, details, autoPost, autoPostConfig }: { plan: PlanInfo; details: CenterDetails; autoPost: boolean; autoPostConfig: AutoPostConfigUI }) {
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

        <AutoPostCard initial={autoPost} initialConfig={autoPostConfig} />

        <PlanCard plan={plan} />
      </div>
    </div>
  );
}

// Opt-in weekly auto-content for THIS center. Off by default; when on, the plan
// cron schedules the week's posts ahead for review.
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AutoPostCard({ initial, initialConfig }: { initial: boolean; initialConfig: AutoPostConfigUI }) {
  const [on, setOn] = useState(initial);
  const [cfg, setCfg] = useState<AutoPostConfigUI>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; body: string; tone: "success" | "error" } | null>(null);

  function patch(p: Partial<AutoPostConfigUI>) {
    setCfg((c) => ({ ...c, ...p }));
    setDirty(true);
  }
  function toggleDay(d: number) {
    patch({ days: cfg.days.includes(d) ? cfg.days.filter((x) => x !== d) : [...cfg.days, d].sort() });
  }

  async function save(nextOn: boolean) {
    if (nextOn && !cfg.days.length) {
      setDialog({ title: "Pick at least one day", body: "Choose which day(s) of the week the auto-posts should go out.", tone: "error" });
      return;
    }
    if (cfg.startDate && cfg.endDate && cfg.endDate < cfg.startDate) {
      setDialog({ title: "Check the date range", body: "The end date is before the start date.", tone: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/center/autopost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoPost: nextOn, config: cfg }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok) {
        setOn(nextOn);
        setDirty(false);
        if (nextOn) setDialog({ title: "Auto-posting is on", body: "Posts will be generated a few days ahead on your schedule — review or edit them any time in Posts → Scheduled.", tone: "success" });
      } else {
        setDialog({ title: "Couldn't save", body: d.error ?? "Please try again.", tone: "error" });
      }
    } catch {
      setDialog({ title: "Couldn't save", body: "Network error — please try again.", tone: "error" });
    }
    setSaving(false);
  }

  return (
    <section className="card p-5">
      {dialog && (
        <MessageModal title={dialog.title} tone={dialog.tone} onClose={() => setDialog(null)}>
          {dialog.body}
        </MessageModal>
      )}

      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand-500" />
        <h2 className="font-semibold">Auto-posting</h2>
      </div>
      <p className="text-xs text-ink-400">
        AI posts on the schedule you set — a mix of single images and slideshows, each with different content — plus
        optional festival greetings. Everything is scheduled a few days ahead so you can review, edit or delete it in{" "}
        <b>Posts → Scheduled</b> before it goes live.
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{on ? "On for this center" : "Off"}</span>
        <button
          onClick={() => save(!on)}
          disabled={saving}
          aria-pressed={on}
          className={cn("relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60", on ? "bg-brand-600" : "bg-ink-300")}
        >
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
        </button>
      </div>

      {/* Schedule details */}
      <div className={cn("mt-4 space-y-3 border-t border-ink-100 pt-4", !on && !dirty && "opacity-70")}>
        <div>
          <label className="label">Days of the week</label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS.map((label, d) => (
              <button
                key={d}
                onClick={() => toggleDay(d)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                  cfg.days.includes(d) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-500 hover:bg-ink-50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-ink-400">{cfg.days.length} post{cfg.days.length === 1 ? "" : "s"} a week. Recommended: Mon, Wed &amp; Sat.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Post time (IST)</label>
            <input type="time" value={cfg.time} onChange={(e) => patch({ time: e.target.value })} className="input text-sm" />
          </div>
          <div>
            <label className="label">Repeat</label>
            <select
              value={cfg.frequency}
              onChange={(e) => patch({ frequency: e.target.value as AutoPostConfigUI["frequency"] })}
              className="input text-sm"
            >
              <option value="weekly">Every week</option>
              <option value="fortnightly">Every 2 weeks</option>
              <option value="monthly">Monthly (first week)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start date <span className="font-normal text-ink-400">(optional)</span></label>
            <input type="date" value={cfg.startDate} onChange={(e) => patch({ startDate: e.target.value })} className="input text-sm" />
          </div>
          <div>
            <label className="label">End date <span className="font-normal text-ink-400">(optional)</span></label>
            <input type="date" value={cfg.endDate} onChange={(e) => patch({ endDate: e.target.value })} className="input text-sm" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input type="checkbox" checked={cfg.slideshow} onChange={(e) => patch({ slideshow: e.target.checked })} />
          Publish the weekly offer post as a photo slideshow (multi-image)
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input type="checkbox" checked={cfg.festivals} onChange={(e) => patch({ festivals: e.target.checked })} />
          Add festival greeting posts
        </label>

        {dirty && (
          <button onClick={() => save(on)} disabled={saving} className="btn-primary w-full text-sm">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save schedule"}
          </button>
        )}
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
  // Connect-flow outcomes show as a DIALOG (never a transient banner/toast).
  const [dialog, setDialog] = useState<{ title: string; body: string; tone: "success" | "warning" | "error" | "info" } | null>(null);
  const [pendingConnect, setPendingConnect] = useState<{ centerName: string; pages: { id: string; name: string }[] } | null>(null);
  const [pendingBusy, setPendingBusy] = useState(false);

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
    if (!fb) return;
    window.history.replaceState({}, "", "/settings");
    if (fb === "wrong_page") {
      // Mismatched connect — nothing was linked; let the user decide in a dialog.
      fetch("/api/fb/pending", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d.pages?.length) setPendingConnect({ centerName: d.centerName, pages: d.pages });
          else setDialog({ title: "Connection not completed", body: "The Facebook connection was not completed.", tone: "error" });
        })
        .catch(() => {});
      return;
    }
    const msg: Record<string, { title: string; body: string; tone: "success" | "warning" | "error" | "info" }> = {
      connected: { title: "Facebook connected", body: "You can now publish live to your Page.", tone: "success" },
      not_configured: { title: "No Meta app configured", body: "No Meta app configured yet — see FACEBOOK_SETUP.md.", tone: "warning" },
      denied: { title: "Connection cancelled", body: "The Facebook connection was cancelled.", tone: "info" },
      no_pages: { title: "No Pages found", body: "No Facebook Pages found on that account. Sign in with the account that manages your Page.", tone: "warning" },
      token_failed: { title: "Connection failed", body: "Couldn't complete the Facebook handshake. Please try again.", tone: "error" },
    };
    if (msg[fb]) setDialog(msg[fb]);
  }, []);

  async function confirmPending(pageId: string) {
    setPendingBusy(true);
    const res = await fetch("/api/fb/pending", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId }),
    }).catch(() => null);
    setPendingBusy(false);
    setPendingConnect(null);
    const ok = res && (await res.json().catch(() => ({ ok: false }))).ok;
    setDialog(ok
      ? { title: "Page connected", body: "The Page is now connected to this center.", tone: "success" }
      : { title: "Connection failed", body: "Couldn't connect the Page — please try again.", tone: "error" });
    load();
  }
  async function cancelPending() {
    setPendingBusy(true);
    await fetch("/api/fb/pending", { method: "DELETE" }).catch(() => {});
    setPendingBusy(false);
    setPendingConnect(null);
    setDialog({ title: "Nothing was connected", body: "Sign in with the Facebook account that manages this center's Page, or ask Head Office to send the WhatsApp connect link.", tone: "info" });
    load();
  }

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
      {dialog && (
        <MessageModal title={dialog.title} tone={dialog.tone} onClose={() => setDialog(null)}>
          {dialog.body}
        </MessageModal>
      )}

      {pendingConnect && (
        <MessageModal
          title="That doesn't look like this center's Page"
          tone="warning"
          onClose={() => { if (!pendingBusy) void cancelPending(); }}
          actions={
            <button onClick={cancelPending} disabled={pendingBusy} className="btn-ghost text-sm">
              {pendingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel — keep it unconnected"}
            </button>
          }
        >
          <p>
            The Facebook account you signed in with doesn&apos;t manage a Page that looks like{" "}
            <b>{pendingConnect.centerName}</b>&apos;s. <b>Nothing has been connected.</b>
          </p>
          <p className="mt-2">If one of these Pages really is the right one, connect it explicitly:</p>
          <div className="mt-2 space-y-1.5">
            {pendingConnect.pages.map((p) => (
              <button key={p.id} onClick={() => confirmPending(p.id)} disabled={pendingBusy} className="btn-ghost w-full justify-between text-left text-sm">
                <span className="truncate">{p.name}</span>
                <span className="shrink-0 text-xs font-semibold text-brand-600">Connect anyway →</span>
              </button>
            ))}
          </div>
        </MessageModal>
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
