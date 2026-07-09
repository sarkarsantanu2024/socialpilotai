"use client";

import { useMemo, useRef, useState } from "react";
import {
  Sparkles, Image as ImageIcon, Images, Film, Video, Upload, X, RefreshCw, Wand2, Hash,
  Send, CalendarClock, Check, AlertTriangle, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrand } from "@/lib/brand/store";
import { AiStatus } from "@/components/ui/AiStatus";
import type { BusinessType, PostType, PostVariation } from "@/lib/types";

type Center = { id: string; name: string; city: string; type: string; connected: boolean };
type Mode = "publish" | "schedule";
type FormatKey = "single" | "carousel" | "reel" | "video";

type CenterResult = { centerId: string; name: string; status: string; reason?: string; permalink?: string; pageName?: string };

const FORMATS: { key: FormatKey; label: string; icon: typeof ImageIcon; note: string; kind: "image" | "video"; slides: number; postType: PostType }[] = [
  { key: "single", label: "Single Image", icon: ImageIcon, note: "Square feed post", kind: "image", slides: 1, postType: "image" },
  { key: "carousel", label: "Image Slides", icon: Images, note: "Swipeable carousel", kind: "image", slides: 3, postType: "image" },
  { key: "reel", label: "Reel", icon: Film, note: "Caption only (add clip per branch)", kind: "video", slides: 0, postType: "reel" },
  { key: "video", label: "Video", icon: Video, note: "Caption only (add clip per branch)", kind: "video", slides: 0, postType: "video" },
];

const STOCK_KEYWORDS: Record<BusinessType, string> = {
  coaching: "indian students studying classroom",
  abacus: "indian children mental math classroom",
  gym: "indian gym fitness workout training",
  playschool: "indian preschool happy kids learning",
  salon: "indian beauty salon hair styling",
  restaurant: "indian restaurant food dining table",
};

export function OrgComposer({ centers, setMsg }: { centers: Center[]; setMsg: (m: string) => void }) {
  const { brand } = useBrand();
  const { profile, kit } = brand;

  const [format, setFormat] = useState<FormatKey>("single");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PostVariation | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [upload, setUpload] = useState<{ name: string; preview: string | null } | null>(null);
  const [aiImg, setAiImg] = useState<{ busy: boolean; msg: string | null; upgrade: boolean }>({ busy: false, msg: null, upgrade: false });
  const fileRef = useRef<HTMLInputElement>(null);

  // Targeting + mode
  const [target, setTarget] = useState<"all" | "some">("all");
  const [picked, setPicked] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>("publish");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<CenterResult[] | null>(null);

  const fmt = FORMATS.find((f) => f.key === format)!;
  const isVideo = fmt.kind === "video";

  const targetCenters = useMemo(
    () => (target === "all" ? centers : centers.filter((c) => picked.includes(c.id))),
    [target, picked, centers]
  );
  // Direct publish needs a connected Page; drafts don't.
  const unconnected = targetCenters.filter((c) => !c.connected);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setUpload({ name: file.name, preview: reader.result as string });
      reader.readAsDataURL(file);
    } else {
      setUpload({ name: file.name, preview: null });
    }
    e.target.value = "";
  }

  async function generate() {
    setLoading(true);
    setResults(null);
    const imageQuery = STOCK_KEYWORDS[profile.type] ?? profile.type;
    const [genRes, imgRes] = await Promise.all([
      fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type: fmt.postType, profile }),
      }),
      isVideo ? Promise.resolve(null) : fetch(`/api/image?type=${encodeURIComponent(profile.type)}&q=${encodeURIComponent(imageQuery)}&n=${fmt.slides}`),
    ]);
    const data = await genRes.json().catch(() => ({}));
    const v: PostVariation | null = data.variations?.[0] ?? null;
    setResult(v);
    if (v) {
      setCaption(v.caption);
      setHashtags(v.hashtags.join(" "));
    }
    if (imgRes) {
      const img = await imgRes.json().catch(() => ({ images: [] }));
      setImages(img.images ?? []);
    } else {
      setImages([]);
    }
    setLoading(false);
  }

  async function generateAiImage() {
    setAiImg({ busy: true, msg: null, upgrade: false });
    try {
      const res = await fetch("/api/image/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.image) {
        setImages((prev) => [data.image, ...prev.filter((u) => u !== data.image)]);
        setUpload(null);
        setAiImg({ busy: false, msg: "AI image ready", upgrade: false });
      } else {
        setAiImg({ busy: false, msg: data.error ?? "Couldn't generate an AI image.", upgrade: !!data.upgrade });
      }
    } catch {
      setAiImg({ busy: false, msg: "Something went wrong.", upgrade: false });
    }
  }

  const primaryImage: string | undefined = fmt.kind === "image" ? (upload?.preview ?? images[0]) : undefined;
  // Send the actual visible image to publish (http stock, or AI/upload data-URL — FB accepts bytes).
  const assetForSend = fmt.kind === "image" ? (upload?.preview ?? images[0]) : undefined;

  const canSend = caption.trim().length > 0 && targetCenters.length > 0 && !busy;

  async function submit() {
    if (!caption.trim()) { setMsg("Write or generate some content first."); return; }
    if (!targetCenters.length) { setMsg("Pick at least one center."); return; }
    if (mode === "schedule" && !when) { setMsg("Pick a date & time to schedule."); return; }

    const tagList = hashtags.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`));
    const centerIds = target === "some" ? picked : undefined;
    setBusy(true);
    setResults(null);
    try {
      // Direct publish / schedule to each branch's Page.
      const res = await fetch("/api/content-push/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result?.title ?? caption.slice(0, 48),
          caption, hashtags: tagList, type: fmt.postType,
          assetUrl: assetForSend, centerIds,
          scheduledAt: mode === "schedule" && when ? new Date(when).toISOString() : undefined,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setResults(d.results ?? []);
        const verb = mode === "schedule" ? "Scheduled" : "Published";
        setMsg(`${verb} to ${d.published + d.scheduled} center${d.published + d.scheduled === 1 ? "" : "s"}${d.skipped ? ` · ${d.skipped} skipped (no Page)` : ""}${d.failed ? ` · ${d.failed} failed` : ""}.`);
      } else {
        setMsg(d.error ?? "Publish failed.");
      }
    } catch {
      setMsg("Network error — please try again.");
    }
    setBusy(false);
  }

  const ideas = IDEAS[profile.type] ?? IDEAS.coaching;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Scope note — this composer broadcasts to many branches at once. */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-2.5 text-sm text-ink-600 lg:col-span-5">
        <Send className="h-4 w-4 text-brand-600" />
        <span><b className="text-ink-800">Broadcast:</b> compose once and send to many branches at once.</span>
        <a href="/studio" className="font-medium text-brand-600 hover:underline">To post to just one branch, switch to it and use AI Content Studio.</a>
      </div>

      {/* Left: compose */}
      <div className="space-y-4 lg:col-span-3">
        <div className="card p-5">
          <label className="label">Format</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FORMATS.map((f) => {
              const active = format === f.key;
              const Icon = f.icon;
              return (
                <button key={f.key} onClick={() => { setFormat(f.key); setUpload(null); }}
                  className={cn("rounded-xl border p-3 text-left transition", active ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-ink-200 hover:bg-ink-50")}>
                  <Icon className={cn("h-5 w-5", active ? "text-brand-600" : "text-ink-400")} />
                  <p className="mt-1.5 text-sm font-semibold">{f.label}</p>
                  <p className="text-[11px] leading-tight text-ink-400">{f.note}</p>
                </button>
              );
            })}
          </div>

          <input ref={fileRef} type="file" accept={isVideo ? "video/*" : "image/*"} onChange={onFile} className="hidden" />

          <div className="mt-4">
            <label className="label">What&apos;s this post about?</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="e.g. Free abacus demo class this Saturday for ages 5–12…" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ideas.map((idea) => (
                <button key={idea} onClick={() => setPrompt(idea)} className="chip bg-ink-100 text-ink-600 hover:bg-ink-200">{idea}</button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={loading} className="btn-primary mt-4 w-full">
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</> : <><Wand2 className="h-4 w-4" /> Generate with AI</>}
          </button>
          <div className="mt-3"><AiStatus compact /></div>
        </div>

        {/* Editable output */}
        {result && (
          <div className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Your content</p>
              <div className="flex items-center gap-2">
                {fmt.kind === "image" && (
                  <button onClick={generateAiImage} disabled={aiImg.busy} className="btn-ghost text-xs disabled:opacity-60">
                    {aiImg.busy ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Creating…</> : <><Sparkles className="h-3.5 w-3.5" /> AI image (Pro)</>}
                  </button>
                )}
                {!isVideo && (
                  <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs"><Upload className="h-3.5 w-3.5" /> Upload</button>
                )}
                <button onClick={generate} className="btn-ghost text-xs"><RefreshCw className="h-3.5 w-3.5" /> Regenerate</button>
              </div>
            </div>
            {aiImg.msg && (
              <p className={cn("text-xs", aiImg.upgrade ? "text-amber-700" : aiImg.msg.includes("ready") ? "text-emerald-600" : "text-rose-600")}>
                {aiImg.msg}{aiImg.upgrade && <> — <a href="/billing" className="font-semibold underline">Upgrade to Pro</a></>}
              </p>
            )}

            <div>
              <label className="label">Caption <span className="font-normal text-ink-400">— use {"{center}"} and {"{city}"} to personalise per branch</span></label>
              <textarea className="input min-h-[120px] resize-y text-sm" value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>
            <div>
              <label className="label">Hashtags</label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input className="input pl-9 text-sm" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: preview + target + send */}
      <div className="space-y-4 lg:col-span-2">
        {/* Preview */}
        <div className="card p-4">
          <p className="mb-2 text-xs font-semibold text-ink-500">PREVIEW</p>
          <div className="mx-auto w-full max-w-[300px]">
            <div className="relative flex aspect-square flex-col justify-between overflow-hidden rounded-2xl p-4 text-white"
              style={{ background: `linear-gradient(135deg, ${kit.primary}, ${kit.secondary})` }}>
              {primaryImage && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={primaryImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
                </>
              )}
              <div className="relative">
                {kit.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={kit.logo} alt="" className="h-8 w-fit max-w-[45%] rounded-md bg-white/20 object-contain p-1 backdrop-blur-sm" />
                ) : (
                  <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold backdrop-blur-sm">{kit.logoText}</span>
                )}
              </div>
              <div className="relative">
                {result?.title && <p className="text-lg font-extrabold leading-tight drop-shadow-sm">{result.title}</p>}
                {result?.cta && <span className="mt-2 inline-block rounded-md px-2.5 py-1 text-xs font-bold text-ink-900" style={{ background: kit.accent }}>{result.cta}</span>}
              </div>
            </div>
          </div>
          {upload && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-500">
              <span className="truncate">Using your image: {upload.name}</span>
              <button onClick={() => setUpload(null)} className="text-ink-400 hover:text-ink-700"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>

        {/* Target */}
        <div className="card p-4">
          <p className="mb-2 text-xs font-semibold text-ink-500">SEND TO</p>
          <div className="flex gap-2 text-sm">
            <button onClick={() => setTarget("all")} className={cn("flex-1 rounded-lg border px-3 py-2 font-medium", target === "all" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600")}>All {centers.length} centers</button>
            <button onClick={() => setTarget("some")} className={cn("flex-1 rounded-lg border px-3 py-2 font-medium", target === "some" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600")}>Choose</button>
          </div>
          {target === "some" && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-ink-100 p-1.5">
              {centers.map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-ink-50">
                  <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className={cn("chip text-[10px]", c.connected ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500")}>{c.connected ? "FB" : "no FB"}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Mode + send */}
        <div className="card space-y-3 p-4">
          <p className="text-xs font-semibold text-ink-500">HOW TO SEND</p>
          <div className="space-y-1.5">
            <ModeRow icon={Send} title="Publish now" desc="Goes live on each branch's Facebook Page immediately." active={mode === "publish"} onClick={() => setMode("publish")} />
            <ModeRow icon={CalendarClock} title="Schedule" desc="Publishes to the branch Pages at a time you set." active={mode === "schedule"} onClick={() => setMode("schedule")} />
          </div>

          {mode === "schedule" && (
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="input text-sm" />
          )}

          {unconnected.length > 0 && (
            <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {unconnected.length} of {targetCenters.length} selected {unconnected.length === 1 ? "center has" : "centers have"} no Facebook Page — they&apos;ll be skipped. Connect their Page first.
            </p>
          )}

          <button onClick={submit} disabled={!canSend} className="btn-primary w-full disabled:opacity-60">
            {busy ? <><RefreshCw className="h-4 w-4 animate-spin" /> Working…</> : (
              <>
                {mode === "publish" && <><Send className="h-4 w-4" /> Publish to {targetCenters.length} center{targetCenters.length === 1 ? "" : "s"}</>}
                {mode === "schedule" && <><CalendarClock className="h-4 w-4" /> Schedule for {targetCenters.length} center{targetCenters.length === 1 ? "" : "s"}</>}
              </>
            )}
          </button>

          {/* Per-center outcome */}
          {results && (
            <div className="space-y-1 border-t border-ink-100 pt-2">
              {results.map((r) => (
                <div key={r.centerId} className="flex items-center gap-2 text-[11px]">
                  {r.status === "published" || r.status === "scheduled" ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                  <span className="flex-1 truncate">{r.name}</span>
                  <span className={cn(r.status === "published" || r.status === "scheduled" ? "text-emerald-600" : "text-amber-600")}>
                    {r.status === "published" ? "Live" : r.status === "scheduled" ? "Scheduled" : r.status === "skipped" ? "No Page" : "Failed"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {centers.length === 0 && (
          <div className="card flex items-center gap-2 p-4 text-sm text-ink-500">
            <Building2 className="h-4 w-4 text-ink-400" /> Add centers first in the Centers tab.
          </div>
        )}
      </div>
    </div>
  );
}

function ModeRow({ icon: Icon, title, desc, active, onClick }: { icon: typeof Send; title: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition", active ? "border-brand-400 bg-brand-50 ring-1 ring-brand-100" : "border-ink-200 hover:bg-ink-50")}>
      <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg", active ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-500")}><Icon className="h-4 w-4" /></span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-[11px] leading-tight text-ink-500">{desc}</span>
      </span>
    </button>
  );
}

const IDEAS: Record<BusinessType, string[]> = {
  coaching: ["Free demo class this Saturday", "Board crash course — few seats left", "Topper spotlight", "Why parents trust us"],
  abacus: ["Speed maths workshop this Saturday", "Free abacus demo for ages 5–12", "Level-up certificate day", "Student did 50 sums in 2 minutes"],
  gym: ["New-year transformation challenge", "Free trial week", "Member success story", "Personal training offer"],
  playschool: ["Admissions open for 2026 batch", "Free play-and-learn trial day", "A peek into our classrooms", "Why parents choose us"],
  salon: ["Bridal makeover packages", "Weekend hair-spa offer", "Before & after glow-up", "New-season hairstyle trends"],
  restaurant: ["This weekend's special menu", "Buy 1 get 1 on starters", "Chef's signature dish", "Family combo offer"],
};
