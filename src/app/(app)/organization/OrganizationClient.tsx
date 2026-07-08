"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2, Plus, Users, Link2, Copy, Check, Trash2, Crown, Store, Shield, Upload, X, Send, History, BarChart3, CheckCircle2, RefreshCw, Facebook, MessageCircle, Settings, Palette, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_INFO, type Role } from "@/components/layout/role";
import { OrgComposer } from "./OrgComposer";
import { parseCsv, rowsToCenters, CSV_TEMPLATE } from "@/lib/csv";

const TYPES = ["abacus", "coaching", "gym", "playschool", "salon", "restaurant"] as const;

type Center = {
  id: string; name: string; city: string; type: string; connected: boolean;
  pageName?: string | null; connectToken?: string; usesHoBrand?: boolean;
  logoUrl?: string | null; ownerName?: string | null; whatsapp?: string | null;
  phone?: string | null; email?: string | null; locality?: string | null; address?: string | null; fbUrl?: string | null;
};
type Member = { id: string; role: string; userName: string; username: string; centerName: string | null };
type Invite = { id: string; token: string; role: string; email: string | null; centerName: string | null; createdAt: string };
type OrgInfo = { id: string; name: string; logoUrl?: string | null; logoText?: string | null; primary?: string | null; secondary?: string | null; accent?: string | null; font?: string | null };
type Overview = {
  org: OrgInfo;
  isSuperadmin: boolean;
  centers: Center[];
  members: Member[];
  invites: Invite[];
};

const ROLE_ICON: Record<string, typeof Crown> = { superadmin: Shield, owner: Crown, manager: Store, staff: Store };

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "publish", label: "Publish", icon: Send },
  { key: "centers", label: "Centers", icon: Building2 },
  { key: "people", label: "People", icon: Users },
  { key: "activity", label: "Activity", icon: History },
  { key: "settings", label: "HO Settings", icon: Settings },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function OrganizationClient({ initial, initialTab }: { initial: Overview; initialTab?: string }) {
  const [data, setData] = useState<Overview>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>(
    TABS.some((t) => t.key === initialTab) ? (initialTab as TabKey) : "overview"
  );

  async function reload() {
    const res = await fetch("/api/organization", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }

  return (
    <div className="space-y-6">
      {/* Tab bar — one job per screen, so the console stops feeling cluttered. */}
      <div className="flex gap-1 overflow-x-auto border-b border-ink-100">
        {TABS.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          const count = t.key === "centers" ? data.centers.length : t.key === "people" ? data.members.length : null;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition",
                active ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-800"
              )}
            >
              <Icon className="h-4 w-4" /> {t.label}
              {count !== null && <span className="rounded-full bg-ink-100 px-1.5 text-[10px] font-semibold text-ink-500">{count}</span>}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <RollupCard />
          {data.centers.length > 0 && <ConnectionsCard centers={data.centers} />}
          {data.centers.length === 0 && (
            <div className="card p-6 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Building2 className="h-6 w-6" /></span>
              <h3 className="mt-3 font-semibold">No centers yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">Add your branches in the <b>Centers</b> tab, then use <b>Publish</b> to post to all of them at once.</p>
              <button onClick={() => setTab("centers")} className="btn-primary mt-4"><Plus className="h-4 w-4" /> Add centers</button>
            </div>
          )}
        </div>
      )}

      {tab === "publish" && <OrgComposer centers={data.centers} setMsg={(m) => setMsg(m)} />}

      {tab === "centers" && <CentersCard data={data} busy={busy} setBusy={setBusy} setMsg={setMsg} reload={reload} />}

      {tab === "people" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <PeopleCard data={data} setMsg={setMsg} reload={reload} />
        </div>
      )}

      {tab === "activity" && <ActivityLogCard />}

      {tab === "settings" && <HoSettingsCard org={data.org} setMsg={setMsg} reload={reload} />}

      {msg && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm text-white shadow-pop">
          {msg}
          <button onClick={() => setMsg(null)} className="ml-3 text-ink-300 hover:text-white"><X className="inline h-3.5 w-3.5" /></button>
        </div>
      )}
    </div>
  );
}

function RollupCard() {
  const [data, setData] = useState<{ centers: { id: string; name: string; city: string; published: number; pending: number; leads: number; connected: boolean }[]; totals: { centers: number; published: number; pending: number; leads: number; connected: number } | null } | null>(null);
  useEffect(() => {
    fetch("/api/rollup", { cache: "no-store" }).then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data || !data.centers.length) return null;
  const t = data.totals;
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold"><BarChart3 className="h-5 w-5 text-brand-600" /> Centers at a glance</h2>
        {t && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="chip bg-ink-100 text-ink-600">{t.centers} centers</span>
            <span className="chip bg-emerald-50 text-emerald-700">{t.connected} FB connected</span>
            <span className="chip bg-brand-50 text-brand-700">{t.published} posts published</span>
            <span className="chip bg-amber-50 text-amber-700">{t.pending} pending approval</span>
            <span className="chip bg-violet-50 text-violet-700">{t.leads} leads</span>
          </div>
        )}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="py-2 pr-3 font-semibold">Center</th>
              <th className="px-3 py-2 font-semibold">Facebook</th>
              <th className="px-3 py-2 font-semibold">Published</th>
              <th className="px-3 py-2 font-semibold">Pending</th>
              <th className="px-3 py-2 font-semibold">Leads</th>
            </tr>
          </thead>
          <tbody>
            {data.centers.map((c) => (
              <tr key={c.id} className="border-t border-ink-100">
                <td className="py-2.5 pr-3"><span className="font-medium">{c.name}</span>{c.city && <span className="ml-1 text-xs text-ink-400">· {c.city}</span>}</td>
                <td className="px-3 py-2.5">{c.connected ? <span className="chip bg-emerald-50 text-emerald-700">Connected</span> : <span className="chip bg-ink-100 text-ink-500">Not connected</span>}</td>
                <td className="px-3 py-2.5 text-ink-600">{c.published}</td>
                <td className="px-3 py-2.5">{c.pending > 0 ? <span className="font-semibold text-amber-600">{c.pending}</span> : <span className="text-ink-400">0</span>}</td>
                <td className="px-3 py-2.5 text-ink-600">{c.leads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityLogCard() {
  const [entries, setEntries] = useState<{ id: string; actorName: string; action: string; detail: string | null; createdAt: string }[]>([]);
  useEffect(() => {
    fetch("/api/audit", { cache: "no-store" }).then((r) => r.json()).then((d) => setEntries(d.entries ?? [])).catch(() => {});
  }, []);
  function rel(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }
  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold"><History className="h-5 w-5 text-brand-600" /> Activity log</h2>
      <div className="mt-3 max-h-72 space-y-2.5 overflow-y-auto">
        {entries.length === 0 && <p className="py-6 text-center text-sm text-ink-400">No activity yet.</p>}
        {entries.map((e) => (
          <div key={e.id} className="flex gap-2.5 text-sm">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
            <div className="min-w-0">
              <p className="text-ink-700">{e.detail ?? e.action}</p>
              <p className="text-[11px] text-ink-400">{e.actorName} · {rel(e.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_COLORS = { primary: "#244fdb", secondary: "#0ea5e9", accent: "#f59e0b" };

function HoSettingsCard({ org, setMsg, reload }: { org: OrgInfo; setMsg: (m: string) => void; reload: () => Promise<void> }) {
  const [name, setName] = useState(org.name);
  const [logoText, setLogoText] = useState(org.logoText ?? "");
  const [logo, setLogo] = useState<string | null>(org.logoUrl ?? null);
  const [primary, setPrimary] = useState(org.primary ?? DEFAULT_COLORS.primary);
  const [secondary, setSecondary] = useState(org.secondary ?? DEFAULT_COLORS.secondary);
  const [accent, setAccent] = useState(org.accent ?? DEFAULT_COLORS.accent);
  const [font, setFont] = useState(org.font ?? "Poppins");
  const [applyAll, setApplyAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  async function save() {
    if (!name.trim()) { setMsg("Organization name can't be empty."); return; }
    setBusy(true);
    const res = await fetch("/api/organization/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, logoText, logoUrl: logo, primary, secondary, accent, font, applyToAll: applyAll }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setMsg(applyAll ? `Saved & applied HO brand to ${d.applied ?? 0} center${d.applied === 1 ? "" : "s"}.` : "Head-office settings saved."); setApplyAll(false); await reload(); }
    else setMsg(d.error ?? "Couldn't save settings.");
  }

  return (
    <div className="space-y-6">
      {/* HO identity */}
      <div className="card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Building2 className="h-5 w-5 text-brand-600" /> Head-office identity</h2>
        <p className="mt-1 text-sm text-ink-500">This is your organization name — shown across the console and on every branch&apos;s roll-up.</p>
        <div className="mt-4 max-w-md">
          <label className="label">Organization name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Mind Mantra Abacus" />
        </div>
      </div>

      {/* Default brand kit */}
      <div className="card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Palette className="h-5 w-5 text-brand-600" /> Default brand kit</h2>
        <p className="mt-1 text-sm text-ink-500">New centers you add inherit this logo, colours &amp; font — so all 300 branches stay on-brand. Existing centers keep their own.</p>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="label">Logo</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={onLogo} className="hidden" />
              {logo ? (
                <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt="" className="h-12 w-12 rounded-lg object-cover ring-1 ring-ink-100" />
                  <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs">Replace</button>
                  <button onClick={() => setLogo(null)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-2 rounded-xl border border-dashed border-ink-200 bg-ink-50 p-3 text-left hover:border-brand-300 hover:bg-brand-50">
                  <Upload className="h-4 w-4 text-ink-400" /> <span className="text-sm">Upload HO logo</span>
                </button>
              )}
            </div>
            <div>
              <label className="label">Logo text (fallback)</label>
              <input value={logoText} onChange={(e) => setLogoText(e.target.value)} className="input text-sm" placeholder="Shown when no logo image" />
            </div>
            <div>
              <label className="label">Font</label>
              <input value={font} onChange={(e) => setFont(e.target.value)} className="input text-sm" placeholder="Poppins" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ColorField label="Primary" value={primary} onChange={setPrimary} />
            <ColorField label="Secondary" value={secondary} onChange={setSecondary} />
            <ColorField label="Accent" value={accent} onChange={setAccent} />
            <div className="col-span-3">
              <p className="label">Preview</p>
              <div className="flex h-20 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                <span className="rounded-md px-3 py-1 text-ink-900" style={{ background: accent }}>{logoText || name || "Your brand"}</span>
              </div>
            </div>
          </div>
        </div>

        <label className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm text-ink-700">
          <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} className="mt-0.5" />
          <span><b>Apply this brand to all {" "}centers now</b> — overwrites every existing branch&apos;s logo, colours &amp; font so the whole network matches. Leave unchecked to only set the default for <i>new</i> centers.</span>
        </label>

        <div className="mt-4 flex justify-end">
          <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> {applyAll ? "Save & apply to all" : "Save settings"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-ink-200 bg-white p-0.5" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="input text-xs" />
      </div>
    </div>
  );
}

function ConnectionsCard({ centers }: { centers: Center[] }) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function connect(id: string) {
    setConnecting(id);
    // HO connects a Page they themselves admin: point the session at this center,
    // then launch Facebook OAuth (callback connects to the active center).
    await fetch("/api/center/select", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ centerId: id }),
    }).catch(() => {});
    window.location.href = "/api/auth/facebook";
  }

  function connectLink(c: Center): string {
    // In production this is your real domain (from NEXT_PUBLIC_APP_URL, else the
    // current origin) — never localhost once deployed.
    const base = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");
    return `${base}/connect/${c.connectToken}`;
  }
  function waMessage(c: Center): string {
    return `Hi! Please connect ${c.name}'s Facebook Page to SocialPilot. Tap this link and sign in with the Facebook account that manages the page — takes 2 taps:\n\n${connectLink(c)}`;
  }
  async function copy(c: Center) {
    try { await navigator.clipboard.writeText(connectLink(c)); setCopied(c.id); setTimeout(() => setCopied(null), 1500); } catch { /* ignore */ }
  }
  function whatsapp(c: Center) {
    // Use the center's own WhatsApp number (from its details) to message the owner
    // directly; wa.me needs digits only. No number → open WhatsApp to pick a contact.
    const num = (c.whatsapp ?? "").replace(/\D/g, "");
    const base = num ? `https://wa.me/${num}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(waMessage(c))}`, "_blank");
  }

  const connectedCount = centers.filter((c) => c.connected).length;

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Facebook className="h-5 w-5 text-brand-600" /> Facebook connections</h2>
        <span className="chip bg-ink-100 text-ink-600">{connectedCount}/{centers.length} connected</span>
      </div>
      <p className="mt-1 text-sm text-ink-500">
        <b>Connect</b> a Page you admin yourself, or send the branch owner a <b>WhatsApp link</b> so they connect their own Page in 2 taps — no Business-Manager setup needed.
      </p>

      <div className="mt-4 divide-y divide-ink-100">
        {centers.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-100 text-sm font-bold text-ink-600">{c.name.charAt(0).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-800">{c.name}</p>
              <p className="truncate text-xs">
                {c.connected
                  ? <span className="text-emerald-600">● {c.pageName ?? "Facebook Page"}</span>
                  : <span className="text-ink-400">Not connected{c.whatsapp ? ` · ${c.ownerName ? `${c.ownerName} ` : ""}${c.whatsapp}` : ""}</span>}
              </p>
            </div>

            {/* Share the self-connect link (branch owner connects their own Page). */}
            {c.connectToken && (
              <>
                <button onClick={() => whatsapp(c)} className="btn-ghost shrink-0 px-2.5 py-1.5 text-xs text-emerald-700" title="Send connect link on WhatsApp">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </button>
                <button onClick={() => copy(c)} className="btn-ghost shrink-0 px-2 py-1.5 text-xs" title="Copy connect link">
                  {copied === c.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </>
            )}

            {/* HO connects a Page they admin directly. */}
            <button
              onClick={() => connect(c.id)}
              disabled={connecting === c.id}
              className={cn("shrink-0 text-xs disabled:opacity-60", c.connected ? "btn-ghost" : "btn-primary")}
            >
              {connecting === c.id
                ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Opening…</>
                : c.connected ? <><Link2 className="h-3.5 w-3.5" /> Reconnect</> : <><Link2 className="h-3.5 w-3.5" /> Connect</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddCenterModal({ onClose, onCreated, setMsg, edit }: { onClose: () => void; onCreated: () => Promise<void>; setMsg: (m: string) => void; edit?: Center }) {
  const isEdit = !!edit;
  const [form, setForm] = useState({
    name: edit?.name ?? "", ownerName: edit?.ownerName ?? "", type: edit?.type ?? "abacus", city: edit?.city ?? "",
    locality: edit?.locality ?? "", address: edit?.address ?? "", phone: edit?.phone ?? "", whatsapp: edit?.whatsapp ?? "",
    email: edit?.email ?? "", fbUrl: edit?.fbUrl ?? "",
  });
  const [logo, setLogo] = useState<string | null>(edit?.logoUrl ?? null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setLogo(r.result as string); r.readAsDataURL(f); e.target.value = "";
  }

  async function submit() {
    if (!form.name.trim()) { setMsg("Center name is required."); return; }
    setBusy(true);
    const res = await fetch(isEdit ? `/api/centers/${edit!.id}` : "/api/centers/create", {
      method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, logoUrl: logo }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setMsg(`${isEdit ? "Updated" : "Added"} “${form.name.trim()}”.`); await onCreated(); onClose(); }
    else setMsg(d.error ?? `Couldn't ${isEdit ? "update" : "add"} center.`);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold"><Building2 className="h-5 w-5 text-brand-600" /> {isEdit ? "Edit center" : "Add a center"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-1 text-sm text-ink-500">Fill in the branch details. Only <b>Center name</b> is required — the rest can be added later.</p>

        {/* Logo */}
        <input ref={fileRef} type="file" accept="image/*" onChange={onLogo} className="hidden" />
        <div className="mt-4 flex items-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-14 w-14 rounded-xl object-cover ring-1 ring-ink-100" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-xl bg-ink-100 text-ink-400"><Building2 className="h-6 w-6" /></span>
          )}
          <div>
            <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs"><Upload className="h-3.5 w-3.5" /> {logo ? "Replace logo" : "Center logo"}</button>
            {logo && <button onClick={() => setLogo(null)} className="ml-1 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"><X className="h-3.5 w-3.5" /></button>}
            <p className="mt-1 text-[11px] text-ink-400">Optional — inherits the HO logo if left blank.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div><label className="label">Center name *</label><input value={form.name} onChange={set("name")} className="input text-sm" placeholder="e.g. MMA Barasat" /></div>
          <div><label className="label">Owner name</label><input value={form.ownerName} onChange={set("ownerName")} className="input text-sm" placeholder="e.g. Debdulal Mishra" /></div>
          <div><label className="label">Type</label>
            <select value={form.type} onChange={set("type")} className="input text-sm capitalize">{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          </div>
          <div><label className="label">City</label><input value={form.city} onChange={set("city")} className="input text-sm" placeholder="e.g. Kolkata" /></div>
          <div><label className="label">Locality / area</label><input value={form.locality} onChange={set("locality")} className="input text-sm" placeholder="e.g. Barasat" /></div>
          <div><label className="label">Phone</label><input value={form.phone} onChange={set("phone")} className="input text-sm" placeholder="e.g. 74074 21404" /></div>
          <div><label className="label">WhatsApp number</label><input value={form.whatsapp} onChange={set("whatsapp")} className="input text-sm" placeholder="e.g. 917407421404" /></div>
          <div><label className="label">Email</label><input value={form.email} onChange={set("email")} className="input text-sm" placeholder="branch@example.com" /></div>
          <div className="sm:col-span-2"><label className="label">Facebook Page link</label><input value={form.fbUrl} onChange={set("fbUrl")} className="input text-sm" placeholder="https://facebook.com/…" /></div>
          <div className="sm:col-span-2"><label className="label">Address</label><textarea value={form.address} onChange={set("address")} rows={2} className="input min-h-[60px] resize-y text-sm" placeholder="Full street address" /></div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? <><RefreshCw className="h-4 w-4 animate-spin" /> {isEdit ? "Saving…" : "Adding…"}</> : <>{isEdit ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {isEdit ? "Save changes" : "Add center"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function CentersCard({
  data, busy, setBusy, setMsg, reload,
}: {
  data: Overview; busy: boolean; setBusy: (b: boolean) => void; setMsg: (m: string) => void; reload: () => Promise<void>;
}) {
  const [type, setType] = useState<string>("abacus");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null); // two-step delete
  const [addOpen, setAddOpen] = useState(false);
  const [editCenter, setEditCenter] = useState<Center | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function importCsv(file: File) {
    const centers = rowsToCenters(parseCsv(await file.text()));
    if (!centers.length) { setMsg("No valid rows found — check the CSV has a Center Name column."); return; }
    setBusy(true);
    const res = await fetch("/api/centers/create", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ centers }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setBulkOpen(false); setMsg(`Imported ${d.created} center${d.created === 1 ? "" : "s"} from CSV.`); await reload(); }
    else setMsg(d.error ?? "Import failed.");
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "centers-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function remove(id: string) {
    setBusy(true);
    const res = await fetch(`/api/centers/${id}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setConfirmId(null);
    if (res.ok) { setMsg(`Removed “${d.name ?? "center"}”.`); await reload(); }
    else setMsg(d.error ?? "Couldn't remove center.");
  }

  async function addBulk() {
    // One center per line: "Name, City" (city optional).
    const centers = bulk.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const [n, c] = l.split(",").map((s) => s.trim());
      return { name: n, city: c ?? "", type };
    }).filter((c) => c.name);
    if (!centers.length) return;
    setBusy(true);
    const res = await fetch("/api/centers/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ centers }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setBulk(""); setBulkOpen(false); setMsg(`Added ${d.created} centers.`); await reload(); }
    else setMsg(d.error ?? "Bulk add failed.");
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Building2 className="h-5 w-5 text-brand-600" /> Centers <span className="chip bg-ink-100 text-ink-600">{data.centers.length}</span></h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setBulkOpen((o) => !o)} className="btn-ghost text-xs"><Upload className="h-3.5 w-3.5" /> Bulk / CSV import</button>
          <button onClick={() => setAddOpen(true)} className="btn-primary text-xs"><Plus className="h-4 w-4" /> Add center</button>
        </div>
      </div>

      {(addOpen || editCenter) && (
        <AddCenterModal edit={editCenter ?? undefined} onClose={() => { setAddOpen(false); setEditCenter(null); }} onCreated={reload} setMsg={setMsg} />
      )}

      {bulkOpen && (
        <div className="mt-3 space-y-3">
          {/* CSV import — owner, center, address, city, WhatsApp, FB link, type */}
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-ink-700">Import from CSV</p>
              <button onClick={downloadTemplate} className="text-[11px] font-medium text-brand-600 hover:underline">Download template</button>
            </div>
            <p className="mt-1 text-[11px] text-ink-500">Columns: <b>Center Name</b>, Owner Name, City, Address, WhatsApp, Facebook Link, Type. Only Center Name is required.</p>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ""; }} />
            <button disabled={busy} onClick={() => fileRef.current?.click()} className="btn-primary mt-2 text-sm disabled:opacity-60">
              <Upload className="h-4 w-4" /> {busy ? "Importing…" : "Choose CSV file"}
            </button>
          </div>

          {/* Or paste a quick list */}
          <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3">
          <p className="mb-1.5 text-xs text-ink-500">One center per line — <code>Name, City</code>. Type applies to all: <b className="capitalize">{type}</b>.</p>
          <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={5} placeholder={"Mind Mantra — Dumdum, Kolkata\nMind Mantra — Sodepur, Kolkata"} className="input min-h-[110px] resize-y font-mono text-xs" />
          <div className="mt-2 flex justify-end">
            <button disabled={busy} onClick={addBulk} className="btn-primary text-sm disabled:opacity-60">Add all</button>
          </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="mt-4 divide-y divide-ink-100">
        {data.centers.map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-2.5">
            {c.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-ink-100" />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-100 text-sm font-bold text-ink-600">{c.name.charAt(0).toUpperCase()}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-800">{c.name}</p>
              <p className="truncate text-xs text-ink-400">{c.locality ? `${c.locality}, ` : ""}{c.city || "—"} · <span className="capitalize">{c.type}</span></p>
            </div>
            {confirmId === c.id ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[11px] text-rose-600">Delete &amp; all its data?</span>
                <button disabled={busy} onClick={() => remove(c.id)} className="rounded-lg bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-700 disabled:opacity-60">Remove</button>
                <button onClick={() => setConfirmId(null)} className="rounded-lg px-2 py-1 text-[11px] text-ink-500 hover:bg-ink-100">Cancel</button>
              </div>
            ) : (
              <>
                <span className={cn("hidden chip text-[11px] sm:inline-flex", c.usesHoBrand ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700")} title={c.usesHoBrand ? "Matches the head-office brand kit" : "This center has its own logo/colours"}>
                  {c.usesHoBrand ? <><Check className="h-3 w-3" /> HO brand</> : <><Palette className="h-3 w-3" /> Custom</>}
                </span>
                <span className={cn("chip text-[11px]", c.connected ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500")}>
                  {c.connected ? "FB connected" : "No FB page"}
                </span>
                <button onClick={() => setEditCenter(c)} className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-brand-50 hover:text-brand-600" title="Edit center" aria-label={`Edit ${c.name}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setConfirmId(c.id)} className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600" title="Remove center" aria-label={`Remove ${c.name}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
        {!data.centers.length && <p className="py-6 text-center text-sm text-ink-400">No centers yet. Add your first one above.</p>}
      </div>
    </div>
  );
}

function PeopleCard({
  data, setMsg, reload,
}: {
  data: Overview; setMsg: (m: string) => void; reload: () => Promise<void>;
}) {
  const [role, setRole] = useState<string>("manager");
  const [centerId, setCenterId] = useState<string>(data.centers[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function invite() {
    const body: Record<string, unknown> = { role, email: email || undefined };
    if (role !== "owner") body.centerId = centerId;
    const res = await fetch("/api/invites", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) { setLink(d.link); setEmail(""); setMsg("Invite link created."); await reload(); }
    else setMsg(d.error ?? "Couldn't create invite.");
  }

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  }

  async function revoke(id: string) {
    await fetch(`/api/invites/${id}`, { method: "DELETE" });
    setMsg("Invite revoked."); await reload();
  }

  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Users className="h-5 w-5 text-brand-600" /> People</h2>

      {/* Invite form */}
      <div className="mt-4 space-y-2 rounded-xl border border-ink-100 bg-ink-50/50 p-3">
        <p className="text-xs text-ink-500">Invite a teammate — pick the role that matches what they should be able to do.</p>
        <div className="grid grid-cols-2 gap-2">
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input text-sm">
            {data.isSuperadmin && <option value="owner">Owner / HO</option>}
            <option value="manager">Center manager</option>
            <option value="staff">Staff (draft only)</option>
          </select>
          <select value={centerId} onChange={(e) => setCenterId(e.target.value)} disabled={role === "owner"} className="input text-sm disabled:opacity-50">
            {data.centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* What this role can do — updates as the selection changes. */}
        {ROLE_INFO[role as Role] && (
          <div className="rounded-lg border border-ink-100 bg-white p-2.5">
            <p className="text-xs font-semibold text-ink-700">{ROLE_INFO[role as Role].label}</p>
            <p className="mt-0.5 text-[11px] text-ink-500">{ROLE_INFO[role as Role].scope}</p>
            <ul className="mt-1.5 space-y-1">
              {ROLE_INFO[role as Role].can.map((c) => (
                <li key={c} className="flex items-start gap-1.5 text-[11px] text-ink-600">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" /> {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="input text-sm" />
        <button onClick={invite} className="btn-primary w-full text-sm"><Link2 className="h-4 w-4" /> Create invite link</button>

        {link && (
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-brand-200 bg-white p-2">
            <input readOnly value={link} className="min-w-0 flex-1 bg-transparent text-xs text-ink-600 outline-none" />
            <button onClick={() => copy(link)} className="btn-ghost shrink-0 px-2 py-1 text-xs">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Pending invites */}
      {data.invites.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Pending invites</p>
          <div className="divide-y divide-ink-100">
            {data.invites.map((i) => (
              <div key={i.id} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink-700">{i.email ?? "Anyone with the link"}</span>
                  <span className="block truncate text-[11px] text-ink-400 capitalize">{i.role}{i.centerName ? ` · ${i.centerName}` : ""}</span>
                </span>
                <button onClick={() => copy(new URL(`/invite/${i.token}`, window.location.origin).toString())} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100" title="Copy link"><Copy className="h-3.5 w-3.5" /></button>
                <button onClick={() => revoke(i.id)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50" title="Revoke"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Members</p>
        <div className="divide-y divide-ink-100">
          {data.members.map((m) => {
            const Icon = ROLE_ICON[m.role] ?? Store;
            return (
              <div key={m.id} className="flex items-center gap-2.5 py-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">{m.userName.charAt(0).toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-800">{m.userName}</span>
                  <span className="block truncate text-[11px] text-ink-400">@{m.username}{m.centerName ? ` · ${m.centerName}` : ""}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-ink-600"><Icon className="h-3 w-3" /> {m.role}</span>
              </div>
            );
          })}
          {!data.members.length && <p className="py-6 text-center text-sm text-ink-400">No members yet.</p>}
        </div>
      </div>
    </div>
  );
}
