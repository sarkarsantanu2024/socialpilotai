"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AiStatus } from "@/components/ui/AiStatus";
import {
  Sparkles,
  Image as ImageIcon,
  Images,
  Video,
  Film,
  Upload,
  Check,
  Music,
  Hash,
  RefreshCw,
  Wand2,
  Play,
  Send,
  CalendarClock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrand } from "@/lib/brand/store";
import type { BusinessType, PostType, PostVariation } from "@/lib/types";

type FormatKey = "single" | "carousel" | "reel" | "video";

// Maps the business type to stock-photo search terms. Biased toward Indian
// context where possible. NOTE: stock libraries have almost no abacus-tool or
// guaranteed-Indian photos, so results stay generic — true relevance needs AI
// image generation (see src/lib/ai/index.ts).
const STOCK_KEYWORDS: Record<BusinessType, string> = {
  coaching: "indian students studying classroom",
  abacus: "indian children mental math classroom",
  gym: "indian gym fitness workout training",
  playschool: "indian preschool happy kids learning",
  salon: "indian beauty salon hair styling",
  restaurant: "indian restaurant food dining table",
};

// Facebook's real publishing formats & native sizes.
const FORMATS: {
  key: FormatKey;
  label: string;
  icon: typeof ImageIcon;
  note: string;
  dims: string;
  ratio: string; // CSS aspect-ratio
  kind: "image" | "video";
  slides: number;
  maxW: number; // preview max width (px) so tall formats don't dominate
  postType: PostType;
}[] = [
  { key: "single", label: "Single Image", icon: ImageIcon, note: "Square feed post", dims: "1080 × 1080", ratio: "1 / 1", kind: "image", slides: 1, maxW: 440, postType: "image" },
  { key: "carousel", label: "Image Slide", icon: Images, note: "Swipeable carousel", dims: "1080 × 1080 · 3 slides", ratio: "1 / 1", kind: "image", slides: 3, maxW: 440, postType: "image" },
  { key: "reel", label: "Reel", icon: Film, note: "Vertical video", dims: "1080 × 1920", ratio: "9 / 16", kind: "video", slides: 0, maxW: 300, postType: "reel" },
  { key: "video", label: "Video", icon: Video, note: "Landscape video", dims: "1280 × 720", ratio: "16 / 9", kind: "video", slides: 0, maxW: 560, postType: "video" },
];

// Quick-prompt chips tailored to each business type.
const IDEAS_BY_TYPE: Record<BusinessType, string[]> = {
  coaching: [
    "Free demo class this Saturday for class 6–12",
    "Class 10 board crash course, only 5 seats left",
    "Topper spotlight — student scored 96%",
    "Why parents trust us",
  ],
  abacus: [
    "Speed maths workshop this Saturday",
    "Level-up certificate day",
    "Free abacus demo class for ages 5–12",
    "Student did 50 sums in 2 minutes",
  ],
  gym: [
    "New-year transformation challenge",
    "Free trial week — limited slots",
    "Member success story — lost 10 kg",
    "Personal training offer this month",
  ],
  playschool: [
    "Admissions open for the 2026 batch",
    "Free play-and-learn trial day",
    "A peek into our classrooms",
    "Why parents choose us",
  ],
  salon: [
    "Bridal makeover packages",
    "Weekend hair-spa offer",
    "Before & after — client glow-up",
    "New-season hairstyle trends",
  ],
  restaurant: [
    "This weekend's special menu",
    "Buy 1 get 1 on starters",
    "Chef's signature dish reveal",
    "Family combo offer",
  ],
};

export function StudioClient() {
  const { brand } = useBrand();
  const { profile, kit } = brand;
  const [format, setFormat] = useState<FormatKey>("single");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PostVariation | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<{ live: boolean; permalink: string; pageName: string | null; scheduled: boolean; error?: string; instagram?: { ok: boolean; permalink?: string; error?: string } } | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  // Bumped each generate so swiped slides remount with fresh image load state.
  const [genKey, setGenKey] = useState(0);
  // Own creative the user uploads. Images: one or more data-URLs (a carousel can
  // take one per slide). Video/reel: a single clip (name only, no preview).
  const [imgs, setImgs] = useState<string[]>([]);
  const [clip, setClip] = useState<{ name: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Real AI (Imagen) image generation — Pro feature.
  const [aiImg, setAiImg] = useState<{ busy: boolean; msg: string | null; upgrade: boolean }>({ busy: false, msg: null, upgrade: false });
  // Instagram cross-posting (shown only when an IG account is linked to the Page).
  const [ig, setIg] = useState<{ connected: boolean; username: string | null }>({ connected: false, username: null });
  const [crossIg, setCrossIg] = useState(false);

  useEffect(() => {
    fetch("/api/fb/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((s) => setIg({ connected: !!s?.instagram?.connected, username: s?.instagram?.username ?? null }))
      .catch(() => {});
  }, []);

  async function generateAiImage() {
    setAiImg({ busy: true, msg: null, upgrade: false });
    try {
      const res = await fetch("/api/image/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.image) {
        // Use the AI image as the (first) slide; it publishes to FB via byte upload.
        setImages((prev) => [data.image, ...prev.filter((u) => u !== data.image)]);
        setImgs([]);
        setGenKey((k) => k + 1);
        setAiImg({ busy: false, msg: "AI image ready", upgrade: false });
      } else {
        setAiImg({ busy: false, msg: data.error ?? "Couldn't generate an AI image.", upgrade: !!data.upgrade });
      }
    } catch {
      setAiImg({ busy: false, msg: "Something went wrong.", upgrade: false });
    }
  }

  const fmt = FORMATS.find((f) => f.key === format)!;
  const isVideo = fmt.kind === "video";
  const accept = isVideo ? "video/*" : "image/*";
  const maxImgs = fmt.slides; // 1 for single image, N for a carousel
  const ideas = IDEAS_BY_TYPE[profile.type] ?? IDEAS_BY_TYPE.coaching;

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
    const picked = list.filter((f) => f.type.startsWith("image/"));
    if (!picked.length) return;
    Promise.all(
      picked.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(f);
          })
      )
    ).then((urls) => {
      setImgs((prev) => [...prev, ...urls].slice(0, maxImgs));
      setGenKey((k) => k + 1);
    });
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
    setGenKey((k) => k + 1);
  }

  async function generate() {
    setLoading(true);
    setSaved(false);
    setPublished(null);
    // Images: prefer the curated India-relevant pool by business type; the query
    // is a fallback for custom types (prompt text adds visual noise).
    const imageQuery = STOCK_KEYWORDS[profile.type] ?? profile.type;
    // Text + images in parallel; images only for image formats.
    const [genRes, imgRes] = await Promise.all([
      fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type: fmt.postType, profile }),
      }),
      isVideo
        ? Promise.resolve(null)
        : fetch(`/api/image?type=${encodeURIComponent(profile.type)}&q=${encodeURIComponent(imageQuery)}&n=${fmt.slides}`),
    ]);
    const data = await genRes.json();
    setResult(data.variations?.[0] ?? null);
    if (imgRes) {
      const img = await imgRes.json().catch(() => ({ images: [] }));
      setImages(img.images ?? []);
    } else {
      setImages([]);
    }
    setGenKey((k) => k + 1);
    setLoading(false);
  }

  // Image source for a given slide: the user's own uploaded image for that slide
  // wins, else the fetched stock image (falling back to the first stock image).
  function slideImage(i: number): string | undefined {
    return imgs[i] ?? images[i] ?? images[0];
  }

  // Every slide's image, in order — what actually gets published (a carousel
  // becomes a real multi-photo Facebook post).
  function slideImages(): string[] {
    if (fmt.kind !== "image") return [];
    return Array.from({ length: fmt.slides }, (_, i) => slideImage(i)).filter(
      (u): u is string => !!u
    );
  }

  // Save the current variation as a draft in the tenant's Posts.
  async function saveDraft() {
    if (!result) return;
    const httpImage = fmt.kind === "image" ? images.find((u) => u.startsWith("http")) : undefined;
    const caption = `${result.caption}\n\n${result.hashtags.join(" ")}`;
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          assetUrl: httpImage,
          title: result.title,
          type: fmt.postType,
          hashtags: result.hashtags,
          music: result.music && result.music !== "—" ? result.music : undefined,
        }),
      });
      if (res.ok) setSaved(true);
    } catch {
      /* keep the UI usable; user can retry */
    }
  }

  // Publish (or schedule) to the connected Facebook Page (real if connected, else demo).
  async function publish(when?: string) {
    if (!result) return;
    setPublishing(true);
    setPublished(null);
    // The images to publish (stock http URLs, or AI/uploaded data-URLs). Facebook
    // accepts both (data-URLs upload as bytes); Instagram needs a public URL.
    // A carousel sends all slide images → a real multi-photo post.
    const allImages = slideImages();
    const primaryImage = allImages[0];
    const caption = `${result.caption}\n\n${result.hashtags.join(" ")}`;
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          assetUrl: primaryImage,
          assetUrls: allImages,
          scheduledAt: when || undefined,
          title: result.title,
          type: fmt.postType,
          hashtags: result.hashtags,
          music: result.music && result.music !== "—" ? result.music : undefined,
          instagram: crossIg && ig.connected && !when,
        }),
      });
      const data = await res.json();
      setPublished({
        live: !!data.live,
        permalink: data.permalink ?? "",
        pageName: data.pageName ?? null,
        scheduled: !!data.scheduled,
        error: data.ok === false ? data.error : undefined,
        instagram: data.instagram,
      });
      setShowSchedule(false);
    } catch {
      setPublished({ live: false, permalink: "", pageName: null, scheduled: false, error: "Network error" });
    }
    setPublishing(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Scope note — Studio always acts on the center you're currently in. */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-xl border border-ink-100 bg-ink-50/70 px-4 py-2.5 text-sm text-ink-600 lg:col-span-5">
        <Sparkles className="h-4 w-4 text-brand-500" />
        <span>Creating for <b className="text-ink-800">{profile.name}</b> — publishes to <b>this center&apos;s</b> Facebook Page.</span>
        <a href="/organization" className="font-medium text-brand-600 hover:underline">To post to several branches at once, use Organization → Publish.</a>
      </div>

      {/* Left: input */}
      <div className="space-y-4 lg:col-span-2">
        <div className="card p-5">
          <label className="label">Facebook format</label>
          <div className="grid grid-cols-2 gap-2">
            {FORMATS.map((f) => {
              const active = format === f.key;
              const Icon = f.icon;
              return (
                <button
                  key={f.key}
                  onClick={() => {
                    setFormat(f.key);
                    setImgs([]);
                    setClip(null);
                  }}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    active ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-ink-200 hover:bg-ink-50"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-brand-600" : "text-ink-400")} />
                  <p className="mt-1.5 text-sm font-semibold">{f.label}</p>
                  <p className="text-[11px] leading-tight text-ink-400">{f.note}</p>
                  <p className="mt-0.5 text-[10px] font-medium text-ink-300">{f.dims}</p>
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
                  <div key={`${i}-${genKey}`} className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-ink-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    {maxImgs > 1 && (
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-semibold text-white">{i + 1}</span>
                    )}
                    <button
                      onClick={() => removeImg(i)}
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-400">
                {maxImgs > 1
                  ? `${imgs.length}/${maxImgs} images — one per slide, in this order.`
                  : "Your image — used instead of the AI design."}
              </p>
            </div>
          )}

          {/* Uploaded clip (video/reel) */}
          {isVideo && clip && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-2.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-400">
                <Film className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{clip.name}</p>
                <p className="text-[11px] text-ink-400">Your clip</p>
              </div>
              <button
                onClick={() => setClip(null)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                aria-label="Remove clip"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Drag-&-drop upload — clip for video, image(s) for image formats */}
          {isVideo && !clip && (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={cn(
                "mt-4 rounded-xl border-2 border-dashed p-5 text-center transition",
                dragOver ? "border-brand-400 bg-brand-50" : "border-ink-200 bg-ink-50"
              )}
            >
              <Upload className="mx-auto h-6 w-6 text-ink-400" />
              <p className="mt-2 text-sm font-medium">Drag &amp; drop your {fmt.label.toLowerCase()} clip, or</p>
              <button onClick={() => fileRef.current?.click()} className="btn-ghost mt-2 text-xs">Choose file</button>
              <p className="mt-2 text-xs text-ink-400">
                The platform doesn&apos;t generate video — you provide the clip, we
                produce the caption, hashtags &amp; music.
              </p>
            </div>
          )}

          {!isVideo && imgs.length < maxImgs && (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={cn(
                "mt-4 rounded-xl border-2 border-dashed p-4 text-center transition",
                dragOver ? "border-brand-400 bg-brand-50" : "border-ink-200 bg-ink-50 hover:border-brand-300 hover:bg-brand-50"
              )}
            >
              <Upload className="mx-auto h-6 w-6 text-ink-400" />
              <p className="mt-2 text-sm font-medium">
                {maxImgs > 1 ? "Drag & drop your images, or" : "Drag & drop your image, or"}
              </p>
              <button onClick={() => fileRef.current?.click()} className="btn-ghost mt-2 text-xs">
                {imgs.length > 0 ? "Add more" : "Choose file"}
              </button>
              <p className="mt-2 text-[11px] leading-tight text-ink-400">
                {maxImgs > 1
                  ? `Use your own creatives — up to ${maxImgs}, one per slide. We still write the caption & hashtags.`
                  : "AI design not right? Use your own creative — we still write the caption & hashtags."}
              </p>
            </div>
          )}

          <div className="mt-4">
            <label className="label">What&apos;s this post about?</label>
            <textarea
              className="input min-h-[96px] resize-none"
              placeholder="e.g. Free demo class this Saturday for classes 6 to 12…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ideas.map((idea) => (
                <button
                  key={idea}
                  onClick={() => setPrompt(idea)}
                  className="chip bg-ink-100 text-ink-600 hover:bg-ink-200"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={loading} className="btn-primary mt-4 w-full">
            {loading ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Wand2 className="h-4 w-4" /> Generate {fmt.label.toLowerCase()}</>
            )}
          </button>
          <div className="mt-3"><AiStatus compact /></div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink-500">CONTEXT USED FOR AI</p>
            <Link href="/settings" className="text-[11px] font-medium text-brand-600 hover:text-brand-700">Edit</Link>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            <Row k="Business" v={profile.name} />
            <Row k="Type" v={profile.type} />
            <Row k="City" v={profile.city} />
            <Row k="Tone" v={profile.tone} />
            <Row k="Brand colours" v="">
              <span className="flex gap-1">
                {[kit.primary, kit.secondary, kit.accent].map((c) => (
                  <span key={c} className="h-4 w-4 rounded-full ring-1 ring-ink-200" style={{ background: c }} />
                ))}
              </span>
            </Row>
          </div>
        </div>
      </div>

      {/* Right: output */}
      <div className="lg:col-span-3">
        {loading && <PreviewSkeleton fmt={fmt} />}

        {!loading && !result && (
          <div className="card grid min-h-[320px] place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-500">
                <Sparkles className="h-7 w-7" />
              </span>
              <h3 className="mt-3 font-semibold">Your post preview appears here</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
                Pick a Facebook format, describe your offer, and generate a
                ready-to-post creative at the right size — with caption, hashtags
                {isVideo ? " & music" : ""}.
              </p>
            </div>
          </div>
        )}

        {!loading && result && (
          <div className="card space-y-4 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{fmt.label} preview</p>
                <p className="text-[11px] text-ink-400">{fmt.dims}</p>
              </div>
              <div className="flex items-center gap-2">
                {fmt.kind === "image" && (
                  <button onClick={generateAiImage} disabled={aiImg.busy} className="btn-ghost text-xs disabled:opacity-60">
                    {aiImg.busy ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Creating…</> : <><Sparkles className="h-3.5 w-3.5" /> AI image (Pro)</>}
                  </button>
                )}
                <button onClick={generate} className="btn-ghost text-xs">
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </button>
              </div>
            </div>
            {aiImg.msg && (
              <p className={cn("text-xs", aiImg.upgrade ? "text-amber-700" : aiImg.msg.includes("ready") ? "text-emerald-600" : "text-rose-600")}>
                {aiImg.msg}
                {aiImg.upgrade && <> — <a href="/billing" className="font-semibold underline">Upgrade to Pro</a></>}
              </p>
            )}

            {/* Creative preview at the real aspect ratio */}
            <div className="mx-auto w-full" style={{ maxWidth: fmt.maxW }}>
              {fmt.kind === "image" ? (
                <div className={cn("overflow-hidden rounded-2xl", fmt.slides > 1 && "flex snap-x snap-mandatory gap-2 overflow-x-auto")}>
                  {Array.from({ length: fmt.slides }).map((_, i) => (
                    <Slide
                      key={`${genKey}-${i}`}
                      ratio={fmt.ratio}
                      image={slideImage(i)}
                      title={i === 0 ? result.title : undefined}
                      cta={i === 0 ? result.cta : undefined}
                      badge={imgs[i] ? "Your creative" : i === 0 ? kit.logoText : `${i + 1}/${fmt.slides}`}
                      showLogo={i === 0 && !imgs[i]}
                    />
                  ))}
                </div>
              ) : (
                <ClipPreview ratio={fmt.ratio} clip={clip} title={result.title} cta={result.cta} onPick={() => fileRef.current?.click()} />
              )}
            </div>

            {fmt.slides > 1 && (
              <p className="text-center text-[11px] text-ink-400">← swipe · {fmt.slides} slides →</p>
            )}

            {/* Caption + meta */}
            <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3.5">
              <p className="whitespace-pre-line text-sm text-ink-700">{result.caption}</p>
              <div className="mt-2.5 flex items-start gap-1.5 text-xs text-brand-600">
                <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{result.hashtags.join(" ")}</span>
              </div>
              {result.music !== "—" && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-500">
                  <Music className="h-3.5 w-3.5" /> {result.music}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                <p className="text-sm font-medium text-brand-800">
                  {saved ? "Saved as draft! Find it under Posts → Drafts." : "Happy with this post?"}
                </p>
                <div className="flex w-full gap-2 sm:w-auto">
                  <button onClick={saveDraft} disabled={saved} className="btn-ghost flex-1 sm:flex-none">
                    {saved ? <><Check className="h-4 w-4" /> Saved</> : "Save draft"}
                  </button>
                  <button onClick={() => setShowSchedule((s) => !s)} className="btn-ghost flex-1 sm:flex-none">
                    <CalendarClock className="h-4 w-4" /> Schedule
                  </button>
                  <button onClick={() => publish()} disabled={publishing} className="btn-primary flex-1 sm:flex-none">
                    {publishing && !scheduleAt ? <><RefreshCw className="h-4 w-4 animate-spin" /> Publishing…</> : <><Send className="h-4 w-4" /> Publish now</>}
                  </button>
                </div>
              </div>

              {/* Instagram cross-post — only when an IG account is linked */}
              {ig.connected && fmt.kind === "image" && (
                <label className="mt-2 flex items-center gap-2 text-xs text-ink-600">
                  <input type="checkbox" checked={crossIg} onChange={(e) => setCrossIg(e.target.checked)} />
                  <span>Also post to Instagram{ig.username ? ` (@${ig.username})` : ""} — needs a stock image (AI/uploaded images can&apos;t cross-post yet)</span>
                </label>
              )}

              {/* Schedule picker */}
              {showSchedule && (
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-brand-100 bg-white p-3 sm:flex-row sm:items-center">
                  <label className="text-xs font-medium text-ink-600">Publish at:</label>
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="input flex-1 text-sm"
                  />
                  <button
                    onClick={() => publish(scheduleAt ? new Date(scheduleAt).toISOString() : undefined)}
                    disabled={!scheduleAt || publishing}
                    className="btn-primary text-sm"
                  >
                    {publishing ? <><RefreshCw className="h-4 w-4 animate-spin" /> Scheduling…</> : "Confirm schedule"}
                  </button>
                </div>
              )}

              {published?.error ? (
                <p className="mt-2.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  ⚠ Couldn&apos;t publish: {published.error}
                </p>
              ) : published && (
                <p className="mt-2.5 text-xs font-medium text-brand-800">
                  {published.scheduled ? (
                    published.live ? <>🗓️ Scheduled live on <b>{published.pageName}</b>. </> : <>🗓️ Scheduled (demo). </>
                  ) : published.live ? (
                    <>✅ Published live to <b>{published.pageName}</b>! </>
                  ) : (
                    <>📭 Published in demo mode (connect a real Page in Settings to go live). </>
                  )}
                  {published.permalink && (
                    <a href={published.permalink} target="_blank" rel="noreferrer" className="underline">View post</a>
                  )}
                  {published.instagram && (
                    published.instagram.ok
                      ? <span className="ml-1">· 📸 Also on Instagram {published.instagram.permalink && <a href={published.instagram.permalink} target="_blank" rel="noreferrer" className="underline">view</a>}</span>
                      : <span className="ml-1 text-amber-700">· Instagram skipped: {published.instagram.error}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// One framed creative: AI/own image background + title & CTA overlay.
function Slide({
  ratio,
  image,
  title,
  cta,
  badge,
  showLogo,
}: {
  ratio: string;
  image?: string;
  title?: string;
  cta?: string;
  badge: string;
  showLogo?: boolean;
}) {
  const { kit } = useBrand().brand;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showImg = !!image && !failed;
  // Never draw scrim/badge/title/CTA over a real image — show the creative clean.
  // The overlay only appears on the pure-gradient fallback (no image available),
  // where it IS the design and would otherwise be blank.
  const showChrome = !showImg;

  return (
    <div
      className="relative flex w-full shrink-0 snap-center flex-col justify-between p-4 text-white"
      style={{ aspectRatio: ratio, background: `linear-gradient(135deg, ${kit.primary}, ${kit.secondary})` }}
    >
      {showImg && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0")}
          />
          {showChrome && <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />}
        </>
      )}
      {showImg && !loaded && (
        <span className="absolute inset-0 z-[1] grid place-items-center">
          <span className="flex flex-col items-center gap-1.5 text-white/90">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-[11px] font-medium">Loading image…</span>
          </span>
        </span>
      )}
      {showChrome && (
        <div className="relative">
          {showLogo && kit.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kit.logo} alt="" className="h-8 w-fit max-w-[45%] rounded-md bg-white/20 object-contain p-1 backdrop-blur-sm" />
          ) : (
            <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold backdrop-blur-sm">{badge}</span>
          )}
        </div>
      )}
      {showChrome && (title || cta) && (
        <div className="relative">
          {title && <p className="text-lg font-extrabold leading-tight drop-shadow-sm">{title}</p>}
          {cta && (
            <span className="mt-2 inline-block rounded-md px-2.5 py-1 text-xs font-bold text-ink-900" style={{ background: kit.accent }}>
              {cta}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Video/Reel visual: the user's clip (or an upload prompt) framed at FB size.
function ClipPreview({
  ratio,
  clip,
  title,
  cta,
  onPick,
}: {
  ratio: string;
  clip: { name: string } | null;
  title: string;
  cta: string;
  onPick: () => void;
}) {
  const { kit } = useBrand().brand;
  if (!clip) {
    return (
      <button
        onClick={onPick}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-300 bg-ink-50 p-6 text-center transition hover:border-brand-300 hover:bg-brand-50"
        style={{ aspectRatio: ratio }}
      >
        <Upload className="h-7 w-7 text-ink-400" />
        <p className="text-sm font-medium">Upload your clip</p>
        <p className="text-xs text-ink-400">Caption & music are ready — add the video to finish.</p>
      </button>
    );
  }
  return (
    <div className="relative flex flex-col justify-between rounded-2xl bg-ink-900 p-4 text-white" style={{ aspectRatio: ratio }}>
      {kit.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={kit.logo} alt="" className="h-8 w-fit max-w-[45%] self-start rounded-md bg-white/20 object-contain p-1 backdrop-blur-sm" />
      ) : (
        <span className="self-start rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold backdrop-blur-sm">{kit.logoText}</span>
      )}
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white/25 backdrop-blur">
          <Play className="h-6 w-6" />
        </span>
      </span>
      <div className="relative">
        <p className="text-lg font-extrabold leading-tight drop-shadow-sm">{title}</p>
        <span className="mt-2 inline-block rounded-md px-2.5 py-1 text-xs font-bold text-ink-900" style={{ background: kit.accent }}>
          {cta}
        </span>
        <p className="mt-2 truncate text-[11px] text-white/70">🎬 {clip.name}</p>
      </div>
    </div>
  );
}

function PreviewSkeleton({ fmt }: { fmt: (typeof FORMATS)[number] }) {
  return (
    <div className="card space-y-4 p-4 sm:p-5">
      <div className="skeleton h-4 w-32 rounded" />
      <div className="mx-auto w-full" style={{ maxWidth: fmt.maxW }}>
        <div className="skeleton rounded-2xl" style={{ aspectRatio: fmt.ratio }} />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}

function Row({ k, v, children }: { k: string; v: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-400">{k}</span>
      {children ?? <span className="font-medium capitalize">{v}</span>}
    </div>
  );
}
