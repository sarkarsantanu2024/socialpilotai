"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Facebook, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageOption {
  id: string;
  name: string;
  category: string | null;
  picture: string | null;
}

export function SelectPageClient({
  pages,
  activePageId,
  returnTo,
}: {
  pages: PageOption[];
  activePageId: string | null;
  returnTo: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(activePageId ?? pages[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  async function confirm() {
    if (!selected) return;
    setSaving(true);
    await fetch("/api/fb/select-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: selected }),
    }).catch(() => {});
    // Land back where the connect flow started, with the success flag.
    const dest = returnTo.includes("?") ? `${returnTo}&fb=connected` : `${returnTo}?fb=connected`;
    router.push(dest);
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="space-y-2">
        {pages.map((p) => (
          <label
            key={p.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition",
              selected === p.id ? "border-brand-400 bg-brand-50" : "border-ink-100 hover:border-ink-200"
            )}
          >
            <input
              type="radio"
              name="page"
              value={p.id}
              checked={selected === p.id}
              onChange={() => setSelected(p.id)}
              className="sr-only"
            />
            {p.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.picture} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#1877F2] text-white">
                <Facebook className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-800">{p.name}</p>
              {p.category && <p className="truncate text-xs text-ink-400">{p.category}</p>}
            </div>
            {selected === p.id && <Check className="h-5 w-5 shrink-0 text-brand-600" />}
          </label>
        ))}
      </div>

      <button onClick={confirm} disabled={saving || !selected} className="btn-primary w-full">
        {saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</> : <>Use this Page</>}
      </button>
    </div>
  );
}
