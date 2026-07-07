"use client";

import { useMemo, useState } from "react";
import { UserPlus, Phone, Mail, MessageCircle, FlaskConical, Plus, Download, Trash2 } from "lucide-react";
import { StatCard } from "@/components/ui/Stat";
import { cn, fmtDateTime } from "@/lib/utils";
import type { Lead } from "@/lib/types";

const STATUSES = ["new", "contacted", "enrolled", "lost"] as const;
const STATUS_STYLE: Record<string, string> = {
  new: "bg-brand-50 text-brand-700",
  contacted: "bg-amber-50 text-amber-700",
  enrolled: "bg-emerald-50 text-emerald-700",
  lost: "bg-ink-100 text-ink-500",
};

function waLink(phone: string, name: string) {
  const d = (phone || "").replace(/\D/g, "");
  const num = d.length === 10 ? `91${d}` : d;
  return `https://wa.me/${num}?text=${encodeURIComponent(`Hi ${name}, thanks for reaching out! How can we help?`)}`;
}

export function LeadsClient({ initial }: { initial: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initial);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", interest: "" });
  const [notesFor, setNotesFor] = useState<string | null>(null);

  const counts = useMemo(() => ({
    total: leads.length,
    new: leads.filter((l) => (l.status ?? "new") === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    enrolled: leads.filter((l) => l.status === "enrolled").length,
  }), [leads]);

  async function addLead(isTest: boolean) {
    setBusy(true);
    const body = isTest
      ? { name: SAMPLE[leads.length % SAMPLE.length].name, phone: SAMPLE[leads.length % SAMPLE.length].phone, interest: SAMPLE[leads.length % SAMPLE.length].interest, isTest: true }
      : { ...form, isTest: false };
    const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (data.ok && data.lead) {
      setLeads((prev) => [data.lead as Lead, ...prev]);
      setForm({ name: "", phone: "", interest: "" });
      setAdding(false);
    }
  }

  async function patch(id: string, patch: { status?: string; notes?: string }) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    await fetch("/api/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) }).catch(() => {});
  }

  async function remove(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    await fetch(`/api/leads?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
  }

  // DPDP data portability — export all leads as CSV (client-side, no server round-trip).
  function exportCsv() {
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Name", "Phone", "Email", "Interest", "Status", "Notes", "Captured"]];
    for (const l of leads) rows.push([l.name, l.phone, l.email, l.interest, l.status ?? "new", l.notes ?? "", l.createdAt]);
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "leads.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Stats — all real, derived from your own pipeline */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total leads" value={String(counts.total)} icon={<UserPlus className="h-5 w-5" />} />
        <StatCard label="New (to follow up)" value={String(counts.new)} icon={<Phone className="h-5 w-5" />} />
        <StatCard label="Contacted" value={String(counts.contacted)} icon={<MessageCircle className="h-5 w-5" />} />
        <StatCard label="Enrolled" value={String(counts.enrolled)} icon={<Mail className="h-5 w-5" />} />
      </div>

      {/* Toolbar */}
      <div className="card flex flex-wrap items-center justify-between gap-2 p-4">
        <p className="text-sm text-ink-600">Add enquiries you get by call/DM, or capture them automatically from Facebook Lead Ads.</p>
        <div className="flex gap-2">
          <button onClick={() => setAdding((a) => !a)} className="btn-primary text-sm"><Plus className="h-4 w-4" /> Add lead</button>
          <button onClick={() => addLead(true)} disabled={busy} className="btn-ghost text-sm"><FlaskConical className="h-4 w-4" /> Simulate</button>
          {leads.length > 0 && <button onClick={exportCsv} className="btn-ghost text-sm"><Download className="h-4 w-4" /> Export CSV</button>}
        </div>
      </div>

      {adding && (
        <div className="card grid gap-2 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="input text-sm" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="input text-sm" />
          <input value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} placeholder="Interest (e.g. Class 10)" className="input text-sm" />
          <button disabled={busy || !form.name.trim()} onClick={() => addLead(false)} className="btn-primary text-sm disabled:opacity-60">Save</button>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="card grid min-h-[160px] place-items-center p-8 text-center text-sm text-ink-500">
          <div>
            <p className="font-medium text-ink-700">No leads yet</p>
            <p className="mt-1 max-w-md">Add an enquiry manually, or connect Facebook Lead Ads to capture them automatically.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {leads.map((l) => (
            <div key={l.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">{l.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{l.name}</p>
                    {l.isTest && <span className="chip bg-violet-50 text-violet-700">test</span>}
                  </div>
                  <p className="truncate text-sm text-ink-500">{l.interest}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-500">
                    {l.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {l.phone}</span>}
                    {l.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {l.email}</span>}
                  </div>
                </div>
                <select value={l.status ?? "new"} onChange={(e) => patch(l.id, { status: e.target.value })} className={cn("shrink-0 rounded-lg border-0 px-2 py-1 text-xs font-semibold capitalize outline-none", STATUS_STYLE[l.status ?? "new"] ?? STATUS_STYLE.new)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {notesFor === l.id ? (
                <textarea
                  autoFocus defaultValue={l.notes ?? ""}
                  onBlur={(e) => { patch(l.id, { notes: e.target.value }); setNotesFor(null); }}
                  placeholder="Add a note…" className="input mt-2 min-h-[60px] resize-none text-sm"
                />
              ) : (
                <button onClick={() => setNotesFor(l.id)} className="mt-2 w-full rounded-lg border border-dashed border-ink-200 px-2 py-1.5 text-left text-xs text-ink-500 hover:border-brand-300">
                  {l.notes ? l.notes : "+ Add a note"}
                </button>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-ink-400">{fmtDateTime(l.createdAt)}</span>
                <div className="flex gap-2">
                  {l.phone && <a href={waLink(l.phone, l.name)} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] px-2.5 py-1.5 text-xs text-white hover:opacity-90"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>}
                  {l.phone && <a href={`tel:${l.phone}`} className="btn-ghost px-2.5 py-1.5 text-xs"><Phone className="h-3.5 w-3.5" /> Call</a>}
                  <button onClick={() => remove(l.id)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50" title="Delete lead (erase data)"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SAMPLE = [
  { name: "Vikram Rao", interest: "Class 11 — Physics", phone: "+91 98765 43210" },
  { name: "Meera Nair", interest: "Class 8 — all subjects", phone: "+91 91234 56780" },
  { name: "Sahil Verma", interest: "Class 10 — crash course", phone: "+91 99887 76655" },
];
