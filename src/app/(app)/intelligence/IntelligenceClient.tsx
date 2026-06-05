"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarHeart,
  CalendarClock,
  Layers,
  Sparkles,
  Check,
  Stamp,
  RefreshCw,
  Pencil,
  Image as ImageIcon,
  Images,
  Film,
  Video,
  Upload,
  Shuffle,
  Send,
} from "lucide-react";
import { cn, fmtDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useBrand } from "@/lib/brand/store";
import type { Festival, SegmentTemplate } from "@/lib/types";

type FestType = "image" | "carousel" | "reel" | "video";
const FEST_TYPES: { key: FestType; label: string; icon: typeof ImageIcon }[] = [
  { key: "image", label: "Single", icon: ImageIcon },
  { key: "carousel", label: "Slides", icon: Images },
  { key: "reel", label: "Reel", icon: Film },
  { key: "video", label: "Video", icon: Video },
];

export function IntelligenceClient({
  festivals,
  segments,
}: {
  festivals: Festival[];
  segments: SegmentTemplate[];
}) {
  const [mode, setMode] = useState<"festival" | "segment">("festival");

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-xl border border-ink-200 bg-white p-1">
        <Tab active={mode === "festival"} onClick={() => setMode("festival")} icon={<CalendarHeart className="h-4 w-4" />}>
          Festival library
        </Tab>
        <Tab active={mode === "segment"} onClick={() => setMode("segment")} icon={<Layers className="h-4 w-4" />}>
          Business-type templates
        </Tab>
      </div>

      {mode === "festival" ? <FestivalLibrary festivals={festivals} /> : <SegmentLibrary segments={segments} />}
    </div>
  );
}

function FestivalLibrary({ festivals }: { festivals: Festival[] }) {
  const { kit, tenantId, profile } = useBrand();
  const upcoming = festivals.filter((f) => f.date >= "2026-06-03");

  // Connected-page info (so auto-schedule only shows for a real, live Page).
  const [page, setPage] = useState<{ connected: boolean; name: string | null }>({ connected: false, name: null });
  useEffect(() => {
    fetch("/api/fb/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((s) => setPage({ connected: !!s.connected, name: s.activePage?.name ?? null }))
      .catch(() => {});
  }, []);

  // Auto-schedule every upcoming festival to the connected Page using FACEBOOK'S
  // native scheduling (scheduled_publish_time) — Facebook publishes each on the
  // day, so it works per client account with no server cron.
  const [sched, setSched] = useState<{ busy: boolean; done: number; total: number; msg: string | null }>({
    busy: false, done: 0, total: 0, msg: null,
  });

  async function autoSchedule() {
    const now = Date.now();
    // Facebook allows scheduling 10 min – 6 months out; stay safely inside that.
    const within = upcoming.filter((f) => {
      const t = new Date(`${f.date}T09:00:00+05:30`).getTime();
      return t > now + 36e5 && t < now + 170 * 864e5;
    });
    if (!within.length) {
      setSched({ busy: false, done: 0, total: 0, msg: "⚠ No festivals fall within Facebook's 6-month scheduling window." });
      return;
    }
    if (!window.confirm(`Schedule ${within.length} festival posts to ${page.name}?\n\nFacebook will automatically publish each one on its festival date.`)) return;

    setSched({ busy: true, done: 0, total: within.length, msg: null });
    let ok = 0, fail = 0;
    for (let i = 0; i < within.length; i++) {
      const f = within[i];
      let assetUrl: string | undefined;
      try {
        const d = await fetch(`/api/image?q=${encodeURIComponent(f.imageQuery || f.name)}&n=1`).then((r) => r.json());
        assetUrl = d.images?.[0];
      } catch { /* schedule as text if image fetch fails */ }
      const caption = `${(f.caption || "").replaceAll("{brand}", profile.name)}\n\n${(f.hashtags || []).join(" ")}`;
      try {
        const res = await fetch("/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caption, assetUrl, scheduledAt: `${f.date}T09:00:00+05:30` }),
        });
        const d = await res.json();
        d.ok === false ? fail++ : ok++;
      } catch { fail++; }
      setSched((s) => ({ ...s, done: i + 1 }));
    }
    setSched({
      busy: false, done: within.length, total: within.length,
      msg: `✓ Scheduled ${ok} post${ok !== 1 ? "s" : ""}${fail ? `, ${fail} failed` : ""}. Facebook will publish each on its festival date.`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3 bg-amber-50/60 p-4">
        <Stamp className="h-5 w-5 text-amber-600" />
        <p className="text-sm text-amber-800">
          Ready-made festival posts — caption, hashtags, image &amp; format are pre-filled and{" "}
          <b>auto-stamped with your brand kit</b> ({kit.logoText}). Edit anything, then add to your calendar.
        </p>
      </div>

      {/* Auto-schedule banner — only for a connected, live Page */}
      {page.connected && (
        <div className="card flex flex-col gap-3 bg-brand-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 shrink-0 text-brand-600" />
            <p className="text-sm text-brand-800">
              <b>Auto-publish all festivals</b> to {page.name ?? "your Page"} — Facebook posts each one automatically on the day. Switch client &amp; repeat for every account.
            </p>
          </div>
          <button onClick={autoSchedule} disabled={sched.busy} className="btn-primary shrink-0 text-sm">
            {sched.busy
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Scheduling {sched.done}/{sched.total}…</>
              : <><CalendarClock className="h-4 w-4" /> Auto-schedule festivals</>}
          </button>
        </div>
      )}
      {sched.msg && (
        <p className={cn("text-xs font-medium", sched.msg.startsWith("✓") ? "text-emerald-600" : "text-rose-600")}>
          {sched.msg}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.map((f) => (
          // key includes tenantId so cards re-seed with the active client's name
          <FestivalCard key={`${tenantId}-${f.date}`} f={f} />
        ))}
      </div>
    </div>
  );
}

function FestivalCard({ f }: { f: Festival }) {
  const { kit, profile } = useBrand();
  const [editing, setEditing] = useState(false);
  const [added, setAdded] = useState(false);
  const [type, setType] = useState<FestType>((f.postType as FestType) || "image");
  const [caption, setCaption] = useState((f.caption || "").replaceAll("{brand}", profile.name));
  const [tags, setTags] = useState((f.hashtags || []).join(" "));

  const [img, setImg] = useState<string | null>(null);
  const [userImg, setUserImg] = useState<string | null>(null); // uploaded own image
  const [nonce, setNonce] = useState(0); // bump to shuffle a new stock image
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userImg) return; // user picked their own — don't fetch
    let alive = true;
    setImgLoaded(false);
    setImgFailed(false);
    // The route randomises the page each call, so refetching = a fresh image.
    fetch(`/api/image?q=${encodeURIComponent(f.imageQuery || f.name)}&n=1`)
      .then((r) => r.json())
      .then((d) => alive && setImg(d.images?.[0] ?? null))
      .catch(() => alive && setImgFailed(true));
    return () => {
      alive = false;
    };
  }, [f, nonce, userImg]);

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUserImg(reader.result as string);
      setImgLoaded(true);
      setImgFailed(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function shuffle() {
    setUserImg(null);
    setNonce((n) => n + 1);
  }

  const shown = userImg ?? img;
  const showImg = shown && !imgFailed;

  // Publish this festival post straight to the connected Page (real if connected).
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<{ live: boolean; permalink: string; pageName: string | null; error?: string } | null>(null);
  async function publish() {
    setPublishing(true);
    setPublished(null);
    const httpImg = shown && shown.startsWith("http") ? shown : undefined; // data-URL uploads post as text
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: `${caption}\n\n${tags}`, assetUrl: httpImg }),
      });
      const d = await res.json();
      setPublished({ live: !!d.live, permalink: d.permalink ?? "", pageName: d.pageName ?? null, error: d.ok === false ? d.error : undefined });
    } catch {
      setPublished({ live: false, permalink: "", pageName: null, error: "Network error" });
    }
    setPublishing(false);
  }

  return (
    <div className="card overflow-hidden">
      {/* Visual: stock image (or brand gradient) with brand + festival overlay */}
      <div
        className="relative flex aspect-square flex-col justify-between p-4 text-white"
        style={{ background: `linear-gradient(135deg, ${kit.primary}, ${kit.secondary})` }}
      >
        {showImg && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shown!}
              alt=""
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgFailed(true)}
              className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-500", imgLoaded ? "opacity-100" : "opacity-0")}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />
          </>
        )}
        <div className="relative flex items-center justify-between">
          {kit.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kit.logo} alt="" className="h-7 w-fit max-w-[45%] rounded-md bg-white/20 object-contain p-1 backdrop-blur-sm" />
          ) : (
            <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold backdrop-blur-sm">{kit.logoText}</span>
          )}
          <span className="text-3xl drop-shadow">{f.emoji}</span>
        </div>

        <div className="relative flex items-end justify-between gap-2">
          <p className="text-xl font-extrabold drop-shadow-sm">{f.name}</p>
          {/* Image controls: upload your own / shuffle a new stock photo */}
          <div className="flex shrink-0 gap-1.5">
            <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              title="Upload your own image"
              className="grid h-8 w-8 place-items-center rounded-lg bg-white/25 text-white backdrop-blur-sm transition hover:bg-white/40"
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              onClick={shuffle}
              title="Shuffle a new image"
              className="grid h-8 w-8 place-items-center rounded-lg bg-white/25 text-white backdrop-blur-sm transition hover:bg-white/40"
            >
              <Shuffle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <Badge tone="amber">{fmtDate(f.date, { day: "numeric", month: "short" })}</Badge>
          <button onClick={() => setEditing((e) => !e)} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
            <Pencil className="h-3.5 w-3.5" /> {editing ? "Done" : "Edit"}
          </button>
        </div>

        {/* Post-type selector */}
        <div className="mt-3 flex gap-1.5">
          {FEST_TYPES.map((t) => {
            const Icon = t.icon;
            const active = type === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-lg border py-1.5 text-[10px] font-medium transition",
                  active ? "border-brand-400 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-500 hover:bg-ink-50"
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Caption + hashtags — editable when in edit mode */}
        {editing ? (
          <div className="mt-3 space-y-2">
            <textarea
              className="input min-h-[88px] resize-none text-xs"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <input
              className="input text-xs"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="#hashtags"
            />
          </div>
        ) : (
          <>
            <p className="mt-3 line-clamp-3 text-xs text-ink-600">{caption}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {tags
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 4)
                .map((h) => (
                  <span key={h} className="chip bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700">{h}</span>
                ))}
            </div>
          </>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setAdded(true)}
            disabled={added}
            className={cn("flex-1 text-xs", added ? "btn-soft" : "btn-ghost")}
          >
            {added ? (<><Check className="h-3.5 w-3.5" /> Added</>) : (<><Sparkles className="h-3.5 w-3.5" /> Calendar</>)}
          </button>
          <button onClick={publish} disabled={publishing} className="btn-primary flex-1 text-xs">
            {publishing ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> …</> : <><Send className="h-3.5 w-3.5" /> Publish</>}
          </button>
        </div>
        {published?.error ? (
          <p className="mt-2 text-[11px] font-medium text-rose-600">⚠ {published.error}</p>
        ) : published && (
          <p className="mt-2 text-[11px] font-medium text-brand-700">
            {published.live ? <>✅ Posted to {published.pageName}. </> : <>📭 Posted (demo). </>}
            {published.permalink && <a href={published.permalink} target="_blank" rel="noreferrer" className="underline">View</a>}
          </p>
        )}
      </div>
    </div>
  );
}

function SegmentLibrary({ segments }: { segments: SegmentTemplate[] }) {
  const { profile } = useBrand();
  // Show ONLY templates that match the connected account's business type, so an
  // abacus centre never sees gym/salon/restaurant ideas. Fall back to all if the
  // type has no dedicated templates (rare).
  const mine = segments.filter((s) => s.type === profile.type);
  const shown = mine.length ? mine : segments;
  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3 bg-brand-50/60 p-4">
        <Layers className="h-5 w-5 text-brand-600" />
        <p className="text-sm text-brand-800">
          Templates tailored to your business type —{" "}
          <span className="font-semibold capitalize">{profile.type}</span> in {profile.city}. AI rewrites the
          tone, offer &amp; hashtags for <b>{profile.name}</b>.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {shown.map((s) => (
          <SegmentCard key={s.id} s={s} isMine />
        ))}
      </div>
    </div>
  );
}

function SegmentCard({ s, isMine }: { s: SegmentTemplate; isMine: boolean }) {
  const { profile } = useBrand();
  const [rewritten, setRewritten] = useState(false);
  const [busy, setBusy] = useState(false);

  function rewrite() {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setRewritten(true);
    }, 800);
  }

  const caption = rewritten
    ? `${s.sampleCaption} — at ${profile.name}, ${profile.city}. ${profile.tone.split(",")[0]} guidance you can trust.`
    : s.sampleCaption;

  return (
    <div className={cn("card p-5", isMine && "ring-1 ring-brand-100")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{s.emoji}</span>
          <h3 className="font-semibold">{s.label}</h3>
        </div>
      </div>

      <p className="mt-2 text-xs text-ink-400">{s.prompt}</p>
      <div className="mt-3 rounded-xl bg-ink-50 p-3 text-sm text-ink-700">{caption}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {s.hashtags.map((h) => (
          <span key={h} className="chip bg-brand-50 text-brand-700">{h}</span>
        ))}
      </div>

      <button onClick={rewrite} disabled={busy || rewritten} className="btn-ghost mt-3 w-full text-xs">
        {busy ? (
          <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Rewriting for your profile…</>
        ) : rewritten ? (
          <><Check className="h-3.5 w-3.5 text-emerald-500" /> Personalised for {profile.city}</>
        ) : (
          <><Sparkles className="h-3.5 w-3.5" /> Rewrite for my business</>
        )}
      </button>
    </div>
  );
}

function Tab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition",
        active ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50"
      )}
    >
      {icon} {children}
    </button>
  );
}
