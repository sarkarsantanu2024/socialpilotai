"use client";

import { useEffect, useState } from "react";
import {
  Building2, Plus, Users, Link2, Copy, Check, Trash2, Crown, Store, Shield, Upload, X, Send, History, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPES = ["abacus", "coaching", "gym", "playschool", "salon", "restaurant"] as const;

type Center = { id: string; name: string; city: string; type: string; connected: boolean };
type Member = { id: string; role: string; userName: string; username: string; centerName: string | null };
type Invite = { id: string; token: string; role: string; email: string | null; centerName: string | null; createdAt: string };
type Overview = {
  org: { id: string; name: string };
  isSuperadmin: boolean;
  centers: Center[];
  members: Member[];
  invites: Invite[];
};

const ROLE_ICON: Record<string, typeof Crown> = { superadmin: Shield, owner: Crown, manager: Store, staff: Store };

export function OrganizationClient({ initial }: { initial: Overview }) {
  const [data, setData] = useState<Overview>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    const res = await fetch("/api/organization", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }

  return (
    <div className="space-y-6">
      <RollupCard />
      <PushContentCard data={data} setMsg={setMsg} />
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Centers */}
        <div className="space-y-6 lg:col-span-3">
          <CentersCard data={data} busy={busy} setBusy={setBusy} setMsg={setMsg} reload={reload} />
        </div>
        {/* People */}
        <div className="space-y-6 lg:col-span-2">
          <PeopleCard data={data} setMsg={setMsg} reload={reload} />
          <ActivityLogCard />
        </div>
      </div>
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

function PushContentCard({ data, setMsg }: { data: Overview; setMsg: (m: string) => void }) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [type, setType] = useState("image");
  const [when, setWhen] = useState("");
  const [target, setTarget] = useState<"all" | "some">("all");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [pushes, setPushes] = useState<{ id: string; title: string; targetCount: number; approved: number; pending: number }[]>([]);

  async function loadPushes() {
    const r = await fetch("/api/content-push", { cache: "no-store" });
    if (r.ok) setPushes((await r.json()).pushes ?? []);
  }
  useEffect(() => { loadPushes(); }, []);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function push() {
    if (!caption.trim()) { setMsg("Write some content first."); return; }
    const hashtags = tags.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`));
    setBusy(true);
    const r = await fetch("/api/content-push", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, caption, hashtags, type,
        suggestedAt: when || undefined,
        centerIds: target === "some" ? picked : undefined,
      }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setMsg(`Pushed to ${d.pushed} center${d.pushed > 1 ? "s" : ""}.`); setTitle(""); setCaption(""); setTags(""); setWhen(""); loadPushes(); }
    else setMsg(d.error ?? "Push failed.");
  }

  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Send className="h-5 w-5 text-brand-600" /> Push content to centers</h2>
      <p className="mt-1 text-sm text-ink-500">Compose once and send to your centers as a draft they approve. Use <code className="rounded bg-ink-100 px-1">{"{center}"}</code> and <code className="rounded bg-ink-100 px-1">{"{city}"}</code> — each center gets its own name/city.</p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (internal)" className="input text-sm" />
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={5} placeholder={"🎉 Admissions open at {center}, {city}! Book a free demo class this week."} className="input min-h-[120px] resize-y text-sm" />
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#Hashtags" className="input text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={type} onChange={(e) => setType(e.target.value)} className="input text-sm capitalize">
              {["image", "reel", "video", "text"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="input text-sm" title="Suggested publish time" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2 text-sm">
            <button onClick={() => setTarget("all")} className={cn("flex-1 rounded-lg border px-3 py-2 font-medium", target === "all" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600")}>All {data.centers.length} centers</button>
            <button onClick={() => setTarget("some")} className={cn("flex-1 rounded-lg border px-3 py-2 font-medium", target === "some" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600")}>Choose centers</button>
          </div>
          {target === "some" && (
            <div className="max-h-36 overflow-y-auto rounded-lg border border-ink-100 p-2">
              {data.centers.map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-ink-50">
                  <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} /> {c.name}
                </label>
              ))}
            </div>
          )}
          <button disabled={busy} onClick={push} className="btn-primary w-full text-sm disabled:opacity-60"><Send className="h-4 w-4" /> {busy ? "Pushing…" : `Push to ${target === "all" ? data.centers.length : picked.length} center${(target === "all" ? data.centers.length : picked.length) === 1 ? "" : "s"}`}</button>

          {pushes.length > 0 && (
            <div className="mt-1 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Recent pushes</p>
              {pushes.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-lg border border-ink-100 px-2.5 py-1.5 text-xs">
                  <span className="min-w-0 flex-1 truncate">{p.title}</span>
                  <span className="chip bg-emerald-50 text-emerald-700">{p.approved} approved</span>
                  <span className="chip bg-amber-50 text-amber-700">{p.pending} pending</span>
                </div>
              ))}
            </div>
          )}
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
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<string>("abacus");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState("");

  async function addOne() {
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/centers/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, city, type }),
    });
    setBusy(false);
    if (res.ok) { setName(""); setCity(""); setMsg("Center added."); await reload(); }
    else setMsg((await res.json()).error ?? "Failed to add center.");
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
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Building2 className="h-5 w-5 text-brand-600" /> Centers <span className="chip bg-ink-100 text-ink-600">{data.centers.length}</span></h2>
        <button onClick={() => setBulkOpen((o) => !o)} className="btn-ghost text-xs"><Upload className="h-3.5 w-3.5" /> Bulk add</button>
      </div>

      {/* Add one */}
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Center name" className="input text-sm" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="input text-sm" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="input text-sm capitalize">
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button disabled={busy} onClick={addOne} className="btn-primary text-sm disabled:opacity-60"><Plus className="h-4 w-4" /> Add</button>
      </div>

      {bulkOpen && (
        <div className="mt-3 rounded-xl border border-ink-100 bg-ink-50/50 p-3">
          <p className="mb-1.5 text-xs text-ink-500">One center per line — <code>Name, City</code>. Type applies to all: <b className="capitalize">{type}</b>.</p>
          <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={5} placeholder={"Mind Mantra — Dumdum, Kolkata\nMind Mantra — Sodepur, Kolkata"} className="input min-h-[110px] resize-y font-mono text-xs" />
          <div className="mt-2 flex justify-end">
            <button disabled={busy} onClick={addBulk} className="btn-primary text-sm disabled:opacity-60">Add all</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="mt-4 divide-y divide-ink-100">
        {data.centers.map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-100 text-sm font-bold text-ink-600">{c.name.charAt(0).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-800">{c.name}</p>
              <p className="truncate text-xs text-ink-400">{c.city || "—"} · <span className="capitalize">{c.type}</span></p>
            </div>
            <span className={cn("chip text-[11px]", c.connected ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500")}>
              {c.connected ? "FB connected" : "No FB page"}
            </span>
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
