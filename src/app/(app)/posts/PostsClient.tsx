"use client";

import { useRef, useState } from "react";
import { Send, Clock, FileEdit, CheckCircle2, RefreshCw, ExternalLink, Trash2, Pencil, X, Play, ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { MessageModal, type MessageTone } from "@/components/ui/MessageModal";
import type { Post, PostStatus } from "@/lib/types";

const TABS: { key: PostStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
];

// Post thumbnail with a graceful fallback. Reels/videos from the Graph API often
// have NO thumbnail (empty assetUrl), and Facebook CDN image URLs can fail/expire
// — either way we show a branded placeholder instead of a black box.
function PostThumb({ post }: { post: Post }) {
  const [failed, setFailed] = useState(false);
  const hasImg = !!post.assetUrl && /^(https?:|data:)/.test(post.assetUrl) && !failed;
  if (hasImg) {
    return (
      <Image
        src={post.assetUrl}
        alt=""
        fill
        className="object-cover"
        sizes="400px"
        unoptimized
        onError={() => setFailed(true)}
      />
    );
  }
  const isClip = post.type === "reel" || post.type === "video";
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-brand-500 to-brand-700 text-white">
      {isClip ? <Play className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
      <span className="text-[11px] font-medium uppercase tracking-wide text-white/80">{post.type}</span>
    </div>
  );
}

export function PostsClient({ initial, notConnected, centerName }: { initial: Post[]; notConnected?: boolean; centerName?: string }) {
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<PostStatus | "all">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  // Errors/notices show as a dialog, never a browser alert.
  const [dialog, setDialog] = useState<{ title: string; body: string; tone: MessageTone } | null>(null);
  // No Facebook Page connected → say so up-front in a dialog (dismissable).
  const [showConnect, setShowConnect] = useState(!!notConnected);

  const filtered = tab === "all" ? items : items.filter((p) => p.status === tab);

  function onSaved(updated: Partial<Post> & { id: string }) {
    setItems((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    setEditing(null);
  }

  async function publishNow(post: Post) {
    // A reel/video draft has no clip on Facebook yet — publishing it via /feed
    // would post caption-only text. Open the editor so the user attaches the
    // clip; the upload + publish happens right there.
    if ((post.type === "reel" || post.type === "video") && !post.fbPostId) {
      setEditing(post);
      return;
    }
    setBusy(post.id);
    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post.id,
        caption: post.caption,
        assetUrl: post.assetUrl,
        assetUrls: post.assetUrls?.length ? post.assetUrls : undefined,
        title: post.title,
        type: post.type,
        hashtags: post.hashtags,
        music: post.music,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      setBusy(null);
      setDialog(
        data.needsConnection
          ? { title: "No Facebook Page connected", body: "Connect your Facebook Page first: go to Settings → Connect Facebook Page, then publish.", tone: "warning" }
          : { title: "Couldn't publish", body: data.error ?? "Unknown error.", tone: "error" }
      );
      return;
    }
    setItems((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              status: "published",
              fbPostId: data.fbPostId,
              permalink: data.live ? data.permalink : undefined,
              publishedAt: new Date().toISOString(),
            }
          : p
      )
    );
    setBusy(null);
  }

  async function removePost(post: Post) {
    const live = !!post.fbPostId;
    const ok = window.confirm(
      live
        ? `Permanently delete this post from your Facebook Page?\n\n"${post.title}"\n\nThis cannot be undone.`
        : `Remove this post from the list?`
    );
    if (!ok) return;

    setBusy(post.id);
    if (live) {
      const res = await fetch(`/api/publish?id=${encodeURIComponent(post.fbPostId!)}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) {
        setBusy(null);
        setDialog({ title: "Couldn't delete on Facebook", body: data.error ?? "Unknown error.", tone: "error" });
        return;
      }
    }
    // Remove the DB row too (no-op for FB-only posts that aren't in our DB).
    await fetch(`/api/posts?id=${encodeURIComponent(post.id)}`, { method: "DELETE" }).catch(() => {});
    setBusy(null);
    setItems((prev) => prev.filter((p) => p.id !== post.id));
  }

  const counts = {
    all: items.length,
    draft: items.filter((p) => p.status === "draft").length,
    scheduled: items.filter((p) => p.status === "scheduled").length,
    published: items.filter((p) => p.status === "published").length,
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium transition",
              tab === t.key ? "bg-brand-600 text-white" : "bg-white text-ink-600 border border-ink-200 hover:bg-ink-50"
            )}
          >
            {t.label}{" "}
            <span className={cn("ml-1", tab === t.key ? "text-brand-100" : "text-ink-400")}>
              {counts[t.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <div key={p.id} className="card overflow-hidden">
            <div className="relative aspect-[4/3] bg-ink-100">
              <PostThumb post={p} />
              <div className="absolute left-2 top-2 flex gap-1.5">
                <Badge tone="blue" className="bg-white/90">{p.type}</Badge>
                {p.source === "festival" && <Badge tone="amber" className="bg-white/90">festival</Badge>}
              </div>
              <div className="absolute right-2 top-2">
                <StatusBadge status={p.status} />
              </div>
            </div>

            <div className="p-4">
              <p className="font-semibold leading-snug">{p.title}</p>
              {/* The title is often the caption's first line — don't print it twice. */}
              {(() => {
                const rest = p.caption.startsWith(p.title) ? p.caption.slice(p.title.length).trim() : p.caption;
                return rest ? <p className="mt-1 line-clamp-2 text-sm text-ink-500">{rest}</p> : null;
              })()}

              <p className="mt-2.5 text-xs text-ink-400">
                {p.status === "scheduled" && p.scheduledAt && (
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Scheduled · {fmtDateTime(p.scheduledAt)}</span>
                )}
                {p.status === "published" && p.publishedAt && (
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Published · {fmtDateTime(p.publishedAt)}</span>
                )}
                {p.status === "draft" && (
                  <span className="flex items-center gap-1">
                    <FileEdit className="h-3.5 w-3.5" />
                    {p.scheduledAt ? <>Draft · suggested slot {fmtDateTime(p.scheduledAt)}</> : <>Draft · not scheduled</>}
                  </span>
                )}
              </p>

              <div className="mt-3 flex gap-2">
                {p.status === "published" ? (
                  p.permalink ? (
                    <a href={p.permalink} target="_blank" rel="noreferrer" className="btn-ghost flex-1 text-xs">
                      View on Facebook <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Published
                    </span>
                  )
                ) : (
                  <button onClick={() => publishNow(p)} disabled={busy === p.id} className="btn-primary flex-1 text-xs">
                    {busy === p.id ? (
                      <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Publishing…</>
                    ) : (
                      <><Send className="h-3.5 w-3.5" /> Publish now</>
                    )}
                  </button>
                )}
                {/* Edit is only for posts not yet on Facebook (drafts/scheduled). */}
                {p.status !== "published" && (
                  <button
                    onClick={() => setEditing(p)}
                    disabled={busy === p.id}
                    title="Edit post"
                    className="btn-ghost px-2.5 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => removePost(p)}
                  disabled={busy === p.id}
                  title="Delete post"
                  className="btn-ghost px-2.5 text-xs text-rose-600 hover:bg-rose-50"
                >
                  {busy === p.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card grid place-items-center p-10 text-center text-sm text-ink-500">
          No posts in this tab yet.
        </div>
      )}

      {editing && <EditModal post={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}

      {dialog && (
        <MessageModal title={dialog.title} tone={dialog.tone} onClose={() => setDialog(null)}>
          {dialog.body}
        </MessageModal>
      )}

      {showConnect && !dialog && (
        <MessageModal
          title={`${centerName || "This center"} isn't connected to Facebook`}
          tone="warning"
          onClose={() => setShowConnect(false)}
          actions={
            <>
              <button onClick={() => setShowConnect(false)} className="btn-ghost text-sm">Later</button>
              <Link href="/settings" className="btn-primary text-sm">Connect Facebook Page</Link>
            </>
          }
        >
          Posts can&apos;t be published until a Facebook Page is connected. Connect it in Settings, or ask Head Office
          to send the WhatsApp connect link to whoever manages this branch&apos;s Page.
        </MessageModal>
      )}
    </div>
  );
}

// ISO → the local "YYYY-MM-DDTHH:mm" a datetime-local input wants.
function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const MAX_SLIDES = 5;

// Full editor for a draft/scheduled post: title, caption, hashtags, creative
// (single image or slideshow slides), music and — for scheduled posts — the
// publish time. Video/reel posts explain that the clip is attached in Studio.
function EditModal({
  post,
  onClose,
  onSaved,
}: {
  post: Post;
  onClose: () => void;
  onSaved: (u: Partial<Post> & { id: string }) => void;
}) {
  const isClip = post.type === "reel" || post.type === "video";
  const queuedOnFb = !!post.fbPostId; // scheduled ON Facebook — our copy is read-only
  const [title, setTitle] = useState(post.title);
  const [caption, setCaption] = useState(post.caption);
  const [hashtags, setHashtags] = useState(post.hashtags.join(" "));
  const [music, setMusic] = useState(post.music ?? "");
  const [when, setWhen] = useState(toLocalInput(post.scheduledAt));
  const [slides, setSlides] = useState<string[]>(
    post.assetUrls?.length ? post.assetUrls : post.assetUrl ? [post.assetUrl] : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Reel/video drafts: attach the actual clip here and it's chunk-uploaded to
  // Facebook on save — published immediately or scheduled at "Publish at".
  const clipRef = useRef<HTMLInputElement>(null);
  const [clip, setClip] = useState<{ file: File; url: string } | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  function pickClip(files: FileList | null) {
    const f = Array.from(files ?? []).find((x) => x.type.startsWith("video/"));
    if (!f) return;
    setClip((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return { file: f, url: URL.createObjectURL(f) };
    });
  }

  function addImages(files: FileList | null) {
    const picked = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
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
    ).then((urls) => setSlides((prev) => [...prev, ...urls].slice(0, MAX_SLIDES)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const tags = hashtags
      .split(/[\s,]+/).map((t) => t.trim()).filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));

    // A clip post going to Facebook needs its schedule ≥ ~10 min out (FB rule).
    const scheduleIso = when ? new Date(when).toISOString() : "";
    if (isClip && clip && scheduleIso && new Date(scheduleIso).getTime() < Date.now() + 11 * 60_000) {
      setError("Pick a publish time at least 15 minutes from now, or clear it to publish immediately.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          title,
          caption,
          hashtags: tags,
          music: music || undefined,
          // Clip posts have no editable slides; don't wipe whatever is stored.
          ...(isClip ? {} : { slides }),
          ...(post.status === "scheduled" && when ? { scheduledAt: scheduleIso } : {}),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Couldn't save changes.");
        setSaving(false);
        return;
      }

      // Clip attached → upload it to Facebook now (chunked), tied to this post
      // row: published immediately, or scheduled when a future time is set.
      if (isClip && clip) {
        setUploadPct(0);
        const fbCaption = `${caption}${tags.length ? "\n\n" + tags.join(" ") : ""}`;
        const startRes = await fetch("/api/publish/video", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start", fileSize: clip.file.size }),
        });
        const start = await startRes.json();
        if (!start.ok) throw new Error(start.error ?? "Couldn't start the video upload.");
        const CHUNK = 3 * 1024 * 1024;
        let offset: number = start.startOffset ?? 0;
        while (offset < clip.file.size) {
          const fd = new FormData();
          fd.set("sessionId", start.sessionId);
          fd.set("startOffset", String(offset));
          fd.set("chunk", clip.file.slice(offset, Math.min(offset + CHUNK, clip.file.size)));
          const r = await fetch("/api/publish/video", { method: "POST", body: fd });
          const j = await r.json();
          if (!j.ok) throw new Error(j.error ?? "The upload failed part-way — please try again.");
          offset = Number(j.startOffset) > offset ? Number(j.startOffset) : offset + CHUNK;
          setUploadPct(Math.min(99, Math.round((Math.min(offset, clip.file.size) / clip.file.size) * 100)));
        }
        const finRes = await fetch("/api/publish/video", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "finish",
            sessionId: start.sessionId,
            videoId: start.videoId,
            postId: post.id, // update THIS row instead of creating a new one
            caption: fbCaption,
            title,
            type: post.type,
            hashtags: tags,
            music: music || undefined,
            scheduledAt: scheduleIso || undefined,
          }),
        });
        const fin = await finRes.json();
        if (!fin.ok) throw new Error(fin.error ?? "Facebook couldn't finish the upload.");
        setUploadPct(null);
        onSaved({
          id: post.id,
          title,
          caption,
          hashtags: tags,
          music: music || undefined,
          status: fin.scheduled ? "scheduled" : "published",
          fbPostId: fin.fbPostId,
          permalink: fin.permalink || undefined,
          publishedAt: fin.scheduled ? undefined : new Date().toISOString(),
          scheduledAt: fin.scheduled ? scheduleIso : undefined,
        });
        return;
      }

      onSaved({
        id: post.id,
        title: data.post.title,
        caption: data.post.caption,
        hashtags: data.post.hashtags,
        music: data.post.music ?? undefined,
        assetUrl: data.post.assetUrl,
        assetUrls: data.post.assetUrls,
        scheduledAt: data.post.scheduledAt,
      });
    } catch (e) {
      setError((e as Error).message || "Network error — please try again.");
      setUploadPct(null);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Edit post</h3>
          <button onClick={onClose} className="btn-ghost px-2" title="Close"><X className="h-4 w-4" /></button>
        </div>

        {queuedOnFb ? (
          // Already queued on Facebook's side — Facebook publishes it as-is.
          <div className="mt-4 space-y-3">
            <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              This post is already <b>queued on Facebook</b> — Facebook will publish it exactly as submitted, so it
              can&apos;t be edited here. To change it, delete this post and create a new one.
            </p>
            <div className="flex justify-end">
              <button onClick={onClose} className="btn-primary text-sm">OK</button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              {/* Creative: single image or slideshow slides (add/remove). */}
              {!isClip && (
                <div>
                  <label className="label">
                    {slides.length > 1 ? `Slideshow — ${slides.length} images` : "Image"}
                    <span className="ml-1 font-normal text-ink-400">(first image is the cover; 2+ = slideshow)</span>
                  </label>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
                  <div className="grid grid-cols-4 gap-2">
                    {slides.map((src, i) => (
                      <div key={i} className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-ink-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        {slides.length > 1 && (
                          <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-semibold text-white">{i + 1}</span>
                        )}
                        <button
                          onClick={() => setSlides((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                          aria-label="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {slides.length < MAX_SLIDES && (
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-ink-200 text-ink-400 transition hover:border-brand-300 hover:text-brand-600"
                        title="Add image(s)"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-ink-400">
                    {slides.length === 0
                      ? "No image — this will publish as a text post. Add up to 5."
                      : slides.length === 1
                        ? "Add more images to turn this into a slideshow (Facebook carousel)."
                        : "Publishes as a real multi-photo Facebook post, in this order."}
                  </p>
                </div>
              )}

              {isClip && (
                <div>
                  <label className="label">Video clip</label>
                  <input ref={clipRef} type="file" accept="video/*" className="hidden"
                    onChange={(e) => { pickClip(e.target.files); e.target.value = ""; }} />
                  {clip ? (
                    <div className="space-y-2">
                      <video src={clip.url} controls playsInline preload="metadata" className="max-h-56 w-full rounded-xl bg-ink-900 object-contain" />
                      <div className="flex items-center justify-between gap-2 text-xs text-ink-500">
                        <span className="truncate">🎬 {clip.file.name}</span>
                        <button onClick={() => clipRef.current?.click()} className="btn-ghost shrink-0 px-2 py-1 text-[11px]">Change clip</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => clipRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 p-5 text-center transition hover:border-brand-300 hover:bg-brand-50"
                    >
                      <Play className="h-6 w-6 text-ink-400" />
                      <span className="text-sm font-medium">Add your {post.type} clip</span>
                      <span className="text-xs text-ink-400">The caption below is ready — attach the video and it uploads to Facebook on save.</span>
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="label">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="input text-sm" maxLength={80} />
              </div>
              <div>
                <label className="label">Caption</label>
                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={6} className="input text-sm" />
                <p className="mt-1 text-[11px] text-ink-400">This is the exact text that will be posted to Facebook.</p>
              </div>
              <div>
                <label className="label">Hashtags</label>
                <input value={hashtags} onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#MindMantraAbacus #AbacusLearning" className="input text-sm" />
              </div>
              {isClip && (
                <div>
                  <label className="label">Music <span className="font-normal text-ink-400">(caption note for the clip)</span></label>
                  <input value={music} onChange={(e) => setMusic(e.target.value)} className="input text-sm" />
                </div>
              )}
              {(post.status === "scheduled" || (isClip && clip)) && (
                <div>
                  <label className="label">
                    Publish at
                    {isClip && clip && <span className="ml-1 font-normal text-ink-400">(leave blank to publish immediately)</span>}
                  </label>
                  <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="input text-sm" />
                </div>
              )}
              {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary text-sm">
                {saving && uploadPct !== null ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Uploading… {uploadPct}%</>
                ) : saving ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</>
                ) : isClip && clip ? (
                  when ? <><Send className="h-4 w-4" /> Upload &amp; schedule</> : <><Send className="h-4 w-4" /> Upload &amp; publish</>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
