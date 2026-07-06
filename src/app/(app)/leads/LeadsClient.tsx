"use client";

import { useState } from "react";
import { UserPlus, Phone, Mail, Download, FlaskConical, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { fmtDateTime } from "@/lib/utils";
import type { Lead } from "@/lib/types";

const SAMPLE = [
  { name: "Vikram Rao", interest: "Class 11 — Physics", phone: "+91 98765 43210", email: "vikram.r@example.com" },
  { name: "Meera Nair", interest: "Class 8 — all subjects", phone: "+91 91234 56780", email: "meera.n@example.com" },
  { name: "Sahil Verma", interest: "Class 10 — crash course", phone: "+91 99887 76655", email: "sahil.v@example.com" },
];

export function LeadsClient({ initial }: { initial: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function addTestLead() {
    setBusy(true);
    const s = SAMPLE[leads.length % SAMPLE.length];
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: s.name, phone: s.phone, email: s.email, interest: s.interest }),
      });
      const data = await res.json();
      if (data.ok && data.lead) setLeads((prev) => [data.lead as Lead, ...prev]);
    } catch {
      /* ignore — user can retry */
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-ink-600">
          <FlaskConical className="h-4 w-4 text-violet-500" />
          Generate ₹0 leads with Meta's <b>Lead Ads Testing Tool</b> — the{" "}
          <code className="rounded bg-ink-100 px-1">leadgen</code> webhook fires and the lead lands here.
        </div>
        <div className="flex gap-2">
          <button onClick={addTestLead} disabled={busy} className="btn-primary text-sm">
            {busy ? <><RefreshCw className="h-4 w-4 animate-spin" /> Receiving…</> : <><UserPlus className="h-4 w-4" /> Simulate test lead</>}
          </button>
          <button className="btn-ghost text-sm"><Download className="h-4 w-4" /> Export CSV</button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="card grid min-h-[160px] place-items-center p-8 text-center text-sm text-ink-500">
          <div>
            <p className="font-medium text-ink-700">No leads yet</p>
            <p className="mt-1 max-w-md">Leads from your Facebook Lead Ads land here in real time. Use &quot;Simulate test lead&quot; to preview the flow.</p>
          </div>
        </div>
      ) : (
        <>
      {/* Mobile: cards */}
      <div className="grid gap-3 sm:hidden">
        {leads.map((l) => (
          <div key={l.id} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{l.name}</p>
              {l.isTest && <Badge tone="violet">test</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-ink-500">{l.interest}</p>
            <div className="mt-2 space-y-1 text-sm text-ink-600">
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-ink-400" /> {l.phone}</p>
              <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-ink-400" /> {l.email}</p>
            </div>
            <p className="mt-2 text-xs text-ink-400">{fmtDateTime(l.createdAt)}</p>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="card hidden overflow-hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Interest</th>
                <th className="p-3 font-semibold">Phone</th>
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">Captured</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-ink-100 hover:bg-ink-50/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {l.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <span className="font-medium">{l.name}</span>
                      {l.isTest && <Badge tone="violet">test</Badge>}
                    </div>
                  </td>
                  <td className="p-3 text-ink-600">{l.interest}</td>
                  <td className="p-3 text-ink-600">{l.phone}</td>
                  <td className="p-3 text-ink-600">{l.email}</td>
                  <td className="p-3 text-ink-500">{fmtDateTime(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
