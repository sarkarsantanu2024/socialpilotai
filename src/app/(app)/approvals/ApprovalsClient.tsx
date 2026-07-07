"use client";

import { useEffect, useState } from "react";
import { Check, X, Send, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type Pending = {
  id: string; title: string; caption: string; hashtags: string[];
  type: string; assetUrl: string | null; source: string; scheduledAt: string | null;
};

export function ApprovalsClient() {
  const [posts, setPosts] = useState<Pending[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/approvals", { cache: "no-store" });
    setPosts(r.ok ? (await r.json()).posts ?? [] : []);
  }
  useEffect(() => { load(); }, []);

  async function act(postId: string, action: "approve" | "reject") {
    setBusy(postId);
    await fetch("/api/posts/approve", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, action }),
    }).catch(() => {});
    setBusy(null);
    setPosts((ps) => (ps ?? []).filter((p) => p.id !== postId));
  }

  if (posts === null) return <div className="card p-8 text-center text-sm text-ink-400">Loading…</div>;

  if (!posts.length) {
    return (
      <div className="card grid place-items-center py-16 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Inbox className="h-6 w-6" /></span>
        <p className="mt-3 font-semibold">Nothing to approve</p>
        <p className="mt-1 text-sm text-ink-400">When your Head Office pushes content or staff submit drafts, they&apos;ll appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <div key={p.id} className="card flex flex-col overflow-hidden p-0">
          {p.assetUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.assetUrl} alt="" className="aspect-[5/3] w-full object-cover" />
          ) : (
            <div className="grid aspect-[5/3] w-full place-items-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-400 capitalize">{p.type}</div>
          )}
          <div className="flex flex-1 flex-col p-4">
            <div className="mb-1.5 flex items-center gap-2">
              {p.source === "pushed" && <Badge tone="violet"><Send className="mr-1 inline h-3 w-3" /> From HO</Badge>}
              <Badge tone="blue">{p.type}</Badge>
              {p.scheduledAt && <span className="text-[11px] text-ink-400">{new Date(p.scheduledAt).toLocaleDateString()}</span>}
            </div>
            <p className="text-sm font-semibold">{p.title}</p>
            <p className="mt-1 line-clamp-3 flex-1 text-sm text-ink-600">{p.caption}</p>
            {p.hashtags.length > 0 && <p className="mt-2 line-clamp-1 text-xs font-medium text-brand-600">{p.hashtags.join(" ")}</p>}
            <div className="mt-3 flex gap-2">
              <button disabled={busy === p.id} onClick={() => act(p.id, "approve")} className="btn-primary flex-1 text-sm disabled:opacity-60"><Check className="h-4 w-4" /> Approve</button>
              <button disabled={busy === p.id} onClick={() => act(p.id, "reject")} className="btn-ghost text-sm text-rose-600 hover:bg-rose-50"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
