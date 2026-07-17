"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles, Image as ImageIcon, Images, Film, Video, Upload, X, RefreshCw, Wand2, Hash,
  Send, CalendarClock, Check, AlertTriangle, Building2, ChevronDown, Pencil,
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
  { key: "reel", label: "Reel", icon: Film, note: "Vertical video clip", kind: "video", slides: 0, postType: "reel" },
  { key: "video", label: "Video", icon: Video, note: "Landscape video clip", kind: "video", slides: 0, postType: "video" },
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
  const [images, setImages] = useState<string[]>([]); // AI / stock generated
  // Own creative the HO uploads, broadcast to every branch. Images: one or more
  // data-URLs (a carousel takes one per slide). Video/reel: a single clip.
  const [imgs, setImgs] = useState<string[]>([]);
  const [clip, setClip] = useState<{ name: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [aiImg, setAiImg] = useState<{ busy: boolean; msg: string | null; upgrade: boolean }>({ busy: false, msg: null, upgrade: false });
  const fileRef = useRef<HTMLInputElement>(null);

  // Targeting + mode
  const [target, setTarget] = useState<"all" | "some">("all");
  const [picked, setPicked] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>("publish");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<CenterResult[] | null>(null);
  // Guard against accidental duplicate broadcasts: once a post is sent, the button
  // stays disabled until the content or targeting changes (see the reset effect).
  const [sent, setSent] = useState(false);

  // Per-center overrides — a center listed here publishes its own caption/hashtags
  // instead of the shared broadcast default. Absent centers use the default.
  const [customize, setCustomize] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { caption: string; hashtags: string }>>({});

  function startOverride(id: string) {
    setOverrides((o) => (o[id] ? o : { ...o, [id]: { caption, hashtags } }));
    setExpanded((e) => (e === id ? null : id));
  }
  function patchOverride(id: string, patch: Partial<{ caption: string; hashtags: string }>) {
    setOverrides((o) => ({ ...o, [id]: { ...o[id], ...patch } }));
  }
  function clearOverride(id: string) {
    setOverrides((o) => {
      const next = { ...o };
      delete next[id];
      return next;
    });
    setExpanded((e) => (e === id ? null : e));
  }

  // Re-arm the Publish button whenever the content or targeting changes, so an
  // edited post can go out again but the exact same one can't be sent twice.
  useEffect(() => {
    setSent(false);
  }, [caption, hashtags, imgs, images, clip, format, target, picked, overrides, mode, when]);

  const fmt = FORMATS.find((f) => f.key === format)!;
  const isVideo = fmt.kind === "video";
  const accept = isVideo ? "video/*" : "image/*";
  const maxImgs = fmt.slides; // 1 for single, N for a carousel

  const targetCenters = useMemo(
    () => (target === "all" ? centers : centers.filter((c) => picked.includes(c.id))),
    [target, picked, centers]
  );
  // Direct publish needs a connected Page; drafts don't.
  const unconnected = targetCenters.filter((c) => !c.connected);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  // Add dropped/picked files. Video: take one clip. Images: read as data-URLs and
  // append up to the format's slide count (so a carousel gets one image per slide).
  function addFiles(files: FileList | File[] | null) {
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    if (isVideo) {
      const f = list.find((x) => x.type.startsWith("video/")) ?? list[0];
      setClip({ name: f.name });
      return;
    }
    const chosen = list.filter((f) => f.type.startsWith("image/"));
    if (!chosen.length) return;
    Promise.all(
      chosen.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(f);
          })
      )
    ).then((urls) => setImgs((prev) => [...prev, ...urls].slice(0, maxImgs)));
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files);
    e.target.value = ""; // allow re-selecting the same file
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!dragOver) setDragOver(true);
  }
  function onDragLeave() {
    setDragOver(false);
  }
  function removeImg(i: number) {
    setImgs((prev) => prev.filter((_, idx) => idx !== i));
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
        setImgs([]); // AI image wins over any uploaded creative
        setAiImg({ busy: false, msg: "AI image ready", upgrade: false });
      } else {
        setAiImg({ busy: false, msg: data.error ?? "Couldn't generate an AI image.", upgrade: !!data.upgrade });
      }
    } catch {
      setAiImg({ busy: false, msg: "Something went wrong.", upgrade: false });
    }
  }

  // Image source for a given slide: the HO's own uploaded image wins, else stock.
  function slideImage(i: number): string | undefined {
    return imgs[i] ?? images[i] ?? images[0];
  }
  // Every slide's image, in order — what actually gets published to each branch.
  function slideImages(): string[] {
    if (fmt.kind !== "image") return [];
    return Array.from({ length: fmt.slides }, (_, i) => slideImage(i)).filter((u): u is string => !!u);
  }

  const primaryImage: string | undefined = fmt.kind === "image" ? slideImage(0) : undefined;
  const canSend = caption.trim().length > 0 && targetCenters.length > 0 && !busy && !sent;

  async function submit() {
    if (!caption.trim()) { setMsg("Write or generate some content first."); return; }
    if (!targetCenters.length) { setMsg("Pick at least one center."); return; }
    if (mode === "schedule" && !when) { setMsg("Pick a date & time to schedule."); return; }

    const parseTags = (s: string) =>
      s.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`));
    const tagList = parseTags(hashtags);
    const centerIds = target === "some" ? picked : undefined;
    const allImages = slideImages();

    // Build per-center overrides for the branches actually being sent to.
    const overridesPayload: Record<string, { caption: string; hashtags: string[] }> = {};
    for (const c of targetCenters) {
      const ov = overrides[c.id];
      if (ov) overridesPayload[c.id] = { caption: ov.caption, hashtags: parseTags(ov.hashtags) };
    }
    const hasOverrides = Object.keys(overridesPayload).length > 0;

    setBusy(true);
    setResults(null);
    try {
      // Direct publish / schedule to each branch's Page. A carousel sends every
      // slide image → a real multi-photo post on each branch's Page.
      const res = await fetch("/api/content-push/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result?.title ?? caption.slice(0, 48),
          caption, hashtags: tagList, type: fmt.postType,
          assetUrl: allImages[0], assetUrls: allImages, centerIds,
          overrides: hasOverrides ? overridesPayload : undefined,
          scheduledAt: mode === "schedule" && when ? new Date(when).toISOString() : undefined,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setResults(d.results ?? []);
        setSent(true); // lock the button until the content/targeting changes
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
                <button key={f.key} onClick={() => { setFormat(f.key); setImgs([]); setClip(null); }}
                  className={cn("rounded-xl border p-3 text-left transition", active ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-ink-200 hover:bg-ink-50")}>
                  <Icon className={cn("h-5 w-5", active ? "text-brand-600" : "text-ink-400")} />
                  <p className="mt-1.5 text-sm font-semibold">{f.label}</p>
                  <p className="text-[11px] leading-tight text-ink-400">{f.note}</p>
                </button>
              );
            })}
          </div>

          {/* One hidden picker, reused for clips and own creatives. Allows
              selecting several files at once for a multi-slide carousel. */}
          <input ref={fileRef} type="file" accept={accept} multiple={!isVideo && maxImgs > 1} onChange={onFileInput} className="hidden" />

          {/* Uploaded images (one thumbnail per slide for a carousel) */}
          {!isVideo && imgs.length > 0 && (
            <div className="mt-4">
              <div className="grid grid-cols-3 gap-2">
                {imgs.map((src, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-ink-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    {maxImgs > 1 && (
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-semibold text-white">{i + 1}</span>
                    )}
                    <button onClick={() => removeImg(i)} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded bg-black/60 text-white opacity-0 transition group-hover:opacity-100" aria-label="Remove image">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-400">
                {maxImgs > 1 ? `${imgs.length}/${maxImgs} images — one per slide, in this order. Sent to every branch.` : "Your image — broadcast to every branch instead of an AI design."}
              </p>
            </div>
          )}

          {/* Uploaded clip (video/reel) */}
          {isVideo && clip && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-2.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-400"><Film className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{clip.name}</p>
                <p className="text-[11px] text-ink-400">Your clip</p>
              </div>
              <button onClick={() => setClip(null)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Remove clip">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Drag-&-drop upload — clip for video, image(s) for image formats */}
          {isVideo && !clip && (
            <div onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
              className={cn("mt-4 rounded-xl border-2 border-dashed p-5 text-center transition", dragOver ? "border-brand-400 bg-brand-50" : "border-ink-200 bg-ink-50")}>
              <Upload className="mx-auto h-6 w-6 text-ink-400" />
              <p className="mt-2 text-sm font-medium">Drag &amp; drop your {fmt.label.toLowerCase()} clip, or</p>
              <button onClick={() => fileRef.current?.click()} className="btn-ghost mt-2 text-xs">Choose file</button>
              <p className="mt-2 text-[11px] leading-tight text-ink-400">The platform doesn&apos;t generate video — you provide the clip, we write the caption &amp; hashtags broadcast to every branch.</p>
            </div>
          )}

          {!isVideo && imgs.length < maxImgs && (
            <div onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
              className={cn("mt-4 rounded-xl border-2 border-dashed p-4 text-center transition", dragOver ? "border-brand-400 bg-brand-50" : "border-ink-200 bg-ink-50 hover:border-brand-300 hover:bg-brand-50")}>
              <Upload className="mx-auto h-6 w-6 text-ink-400" />
              <p className="mt-2 text-sm font-medium">{maxImgs > 1 ? "Drag & drop your images, or" : "Drag & drop your image, or"}</p>
              <button onClick={() => fileRef.current?.click()} className="btn-ghost mt-2 text-xs">{imgs.length > 0 ? "Add more" : "Choose file"}</button>
              <p className="mt-2 text-[11px] leading-tight text-ink-400">
                {maxImgs > 1 ? `Use your own creatives — up to ${maxImgs}, one per slide. We still write the caption & hashtags.` : "Prefer your own creative? Upload it — we still write the caption & hashtags."}
              </p>
            </div>
          )}

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
                {result?.title && !primaryImage && <p className="text-lg font-extrabold leading-tight drop-shadow-sm">{result.title}</p>}
                {result?.cta && !primaryImage && <span className="mt-2 inline-block rounded-md px-2.5 py-1 text-xs font-bold text-ink-900" style={{ background: kit.accent }}>{result.cta}</span>}
              </div>
            </div>
          </div>
          {fmt.kind === "image" && imgs.length > 0 && (
            <p className="mt-2 text-center text-[11px] text-ink-400">
              {maxImgs > 1 ? `Using your ${imgs.length} image${imgs.length === 1 ? "" : "s"} · slide 1 shown` : "Using your image"}
            </p>
          )}
          {isVideo && clip && (
            <p className="mt-2 truncate text-center text-[11px] text-ink-400">🎬 {clip.name}</p>
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

        {/* Customize per center (optional) */}
        {targetCenters.length > 0 && (
          <div className="card p-4">
            <button onClick={() => setCustomize((v) => !v)} className="flex w-full items-center justify-between text-left">
              <span>
                <span className="block text-xs font-semibold text-ink-500">CUSTOMIZE PER CENTER <span className="font-normal text-ink-400">(optional)</span></span>
                <span className="text-[11px] text-ink-400">
                  {Object.keys(overrides).length > 0 ? `${Object.keys(overrides).length} branch(es) customized` : "Give a branch its own caption & hashtags"}
                </span>
              </span>
              <ChevronDown className={cn("h-4 w-4 text-ink-400 transition", customize && "rotate-180")} />
            </button>

            {customize && (
              <div className="mt-3 space-y-1.5">
                {targetCenters.map((c) => {
                  const ov = overrides[c.id];
                  const open = expanded === c.id;
                  return (
                    <div key={c.id} className="rounded-lg border border-ink-100">
                      <div className="flex items-center gap-2 px-2.5 py-2">
                        <span className="flex-1 truncate text-sm">{c.name}</span>
                        {ov && <span className="chip bg-brand-50 text-[10px] text-brand-700">Customized</span>}
                        <button onClick={() => startOverride(c.id)} className="btn-ghost px-2 py-1 text-[11px]">
                          <Pencil className="h-3 w-3" /> {ov ? "Edit" : "Customize"}
                        </button>
                      </div>
                      {open && ov && (
                        <div className="space-y-2 border-t border-ink-100 p-2.5">
                          <div>
                            <label className="label text-[11px]">Caption for {c.name} <span className="font-normal text-ink-400">— {"{center}"}/{"{city}"} still work</span></label>
                            <textarea className="input min-h-[90px] resize-y text-sm" value={ov.caption} onChange={(e) => patchOverride(c.id, { caption: e.target.value })} />
                          </div>
                          <div>
                            <label className="label text-[11px]">Hashtags for {c.name}</label>
                            <div className="relative">
                              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                              <input className="input pl-9 text-sm" value={ov.hashtags} onChange={(e) => patchOverride(c.id, { hashtags: e.target.value })} />
                            </div>
                          </div>
                          <button onClick={() => clearOverride(c.id)} className="text-[11px] font-medium text-rose-600 hover:underline">Reset to shared content</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <p className="pt-1 text-[11px] text-ink-400">Branches you don&apos;t customize use the shared caption &amp; hashtags above.</p>
              </div>
            )}
          </div>
        )}

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
            {busy ? <><RefreshCw className="h-4 w-4 animate-spin" /> Working…</> : sent ? (
              <><Check className="h-4 w-4" /> {mode === "schedule" ? "Scheduled" : "Published"} — edit to send again</>
            ) : (
              <>
                {mode === "publish" && <><Send className="h-4 w-4" /> Publish to {targetCenters.length} center{targetCenters.length === 1 ? "" : "s"}</>}
                {mode === "schedule" && <><CalendarClock className="h-4 w-4" /> Schedule for {targetCenters.length} center{targetCenters.length === 1 ? "" : "s"}</>}
              </>
            )}
          </button>
          {sent && (
            <p className="text-center text-[11px] text-ink-400">Already sent. Change the content or centers to publish again.</p>
          )}

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
