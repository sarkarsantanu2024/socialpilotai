"use client";

import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "ok" | "rate_limited" | "error" | "not_configured" | null;

const MAP: Record<string, { label: string; cls: string; icon: typeof CheckCircle2; note: string }> = {
  ok: { label: "Active", cls: "bg-emerald-50 text-emerald-700", icon: CheckCircle2, note: "AI is writing fresh content in your brand voice." },
  rate_limited: { label: "Rate-limited", cls: "bg-amber-50 text-amber-700", icon: AlertTriangle, note: "Free-tier quota is used up — new posts fall back to a smart template until it resets (per-minute limits reset quickly; the daily limit resets at midnight US-Pacific)." },
  error: { label: "Unavailable", cls: "bg-rose-50 text-rose-700", icon: XCircle, note: "The AI key returned an error. Check the key in your environment settings." },
  not_configured: { label: "Not configured", cls: "bg-ink-100 text-ink-600", icon: XCircle, note: "No Gemini key set (or the app is in demo mode). Set GEMINI_API_KEY and NEXT_PUBLIC_DEMO_MODE=false." },
};

/** Full details card (Settings). Compact banner variant when `compact`. */
export function AiStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>(null);
  const [model, setModel] = useState("gemini-2.0-flash");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/ai/status", { cache: "no-store" });
      const d = await r.json();
      setStatus(d.status ?? "error");
      if (d.model) setModel(d.model);
    } catch { setStatus("error"); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const m = status ? MAP[status] : null;

  // Compact: only render when there's something worth flagging (not fully OK).
  if (compact) {
    if (loading || !m || status === "ok") return null;
    return (
      <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs", m.cls)}>
        <m.icon className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1">AI is {m.label.toLowerCase()} — new posts use a smart template. {status === "rate_limited" && "Enable Gemini billing for higher limits."}</span>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-brand-600" /> AI engine</h2>
        <button onClick={load} className="btn-ghost text-xs" disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-ink-500">Status:</span>
        {loading || !m ? (
          <span className="chip bg-ink-100 text-ink-500">Checking…</span>
        ) : (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", m.cls)}>
            <m.icon className="h-3.5 w-3.5" /> {m.label}
          </span>
        )}
      </div>
      {m && <p className="mt-2 text-sm text-ink-600">{m.note}</p>}

      <dl className="mt-4 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between border-b border-ink-100 pb-1.5"><dt className="text-ink-500">Text model</dt><dd className="font-medium">{model}</dd></div>
        <div className="flex justify-between border-b border-ink-100 pb-1.5"><dt className="text-ink-500">Image model</dt><dd className="font-medium">Imagen 3 (Pro)</dd></div>
        <div className="flex justify-between border-b border-ink-100 pb-1.5"><dt className="text-ink-500">Tier</dt><dd className="font-medium">Free (default)</dd></div>
        <div className="flex justify-between border-b border-ink-100 pb-1.5"><dt className="text-ink-500">Text cost</dt><dd className="font-medium">₹0 on free tier</dd></div>
      </dl>

      <div className="mt-4 space-y-1.5 text-xs text-ink-500">
        <p><b>Free-tier limits (approx):</b> ~15 requests/min, ~1,500 requests/day, 1M tokens/min. Exact numbers &amp; pricing: <a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noreferrer" className="text-brand-600 underline">Google rate-limits</a>.</p>
        <p><b>AI images (Imagen):</b> a paid feature — needs billing enabled on your Google AI project. Charged per image (text stays essentially free).</p>
        <p><b>Privacy:</b> on the free tier, prompts may be used by Google to improve their models — avoid putting sensitive data in prompts.</p>
      </div>
    </div>
  );
}
