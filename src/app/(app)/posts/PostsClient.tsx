"use client";

import { useState } from "react";
import { Send, Clock, FileEdit, CheckCircle2, RefreshCw, ExternalLink, Trash2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import type { Post, PostStatus } from "@/lib/types";

const TABS: { key: PostStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
];

export function PostsClient({ initial }: { initial: Post[] }) {
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<PostStatus | "all">("all");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = tab === "all" ? items : items.filter((p) => p.status === tab);

  async function publishNow(post: Post) {
    setBusy(post.id);
    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: post.caption, assetUrl: post.assetUrl }),
    });
    const data = await res.json();
    setItems((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              status: "published",
              fbPostId: data.fbPostId,
              // Real, clickable URL only when actually published live to a Page.
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
      setBusy(null);
      if (!data.ok) {
        alert(`Couldn't delete on Facebook: ${data.error}`);
        return;
      }
    } else {
      setBusy(null);
    }
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
              <Image src={p.assetUrl} alt="" fill className="object-cover" sizes="400px" unoptimized />
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
              <p className="mt-1 line-clamp-2 text-sm text-ink-500">{p.caption}</p>

              <p className="mt-2.5 text-xs text-ink-400">
                {p.status === "scheduled" && p.scheduledAt && (
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Scheduled · {fmtDateTime(p.scheduledAt)}</span>
                )}
                {p.status === "published" && p.publishedAt && (
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Published · {fmtDateTime(p.publishedAt)}</span>
                )}
                {p.status === "draft" && (
                  <span className="flex items-center gap-1"><FileEdit className="h-3.5 w-3.5" /> Draft · not scheduled</span>
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
                      <CheckCircle2 className="h-3.5 w-3.5" /> Published (demo)
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
    </div>
  );
}
