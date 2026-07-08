"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronDown, Search, Check, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_BADGE, type Role } from "./role";

// Mirror of lib/session.ts HO_MODE — the active-center sentinel for "Head office".
const HO_MODE = "__ho__";

type Center = { id: string; name: string; city: string; type: string; orgId: string | null; orgName: string | null; role: Role };
type Data = { activeCenterId: string | null; isSuperadmin: boolean; isOwner?: boolean; centers: Center[] };

export function CenterSwitcher() {
  const [data, setData] = useState<Data | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/centers", { cache: "no-store" }).then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const hoMode = data?.activeCenterId === HO_MODE;
  const canHO = !!(data?.isOwner || data?.isSuperadmin);
  const active = hoMode ? null : (data?.centers.find((c) => c.id === data.activeCenterId) ?? data?.centers[0] ?? null);

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    return s ? data.centers.filter((c) => `${c.name} ${c.city} ${c.orgName ?? ""}`.toLowerCase().includes(s)) : data.centers;
  }, [data, q]);

  const groups = useMemo(() => {
    const m = new Map<string, { orgName: string; centers: Center[] }>();
    for (const c of filtered) {
      const key = c.orgId ?? "_";
      const g = m.get(key) ?? { orgName: c.orgName ?? "Standalone", centers: [] };
      g.centers.push(c);
      m.set(key, g);
    }
    return Array.from(m.values());
  }, [filtered]);

  async function pick(centerId: string) {
    if (!hoMode && centerId === data?.activeCenterId) { setOpen(false); return; }
    setSwitching(centerId);
    await fetch("/api/center/select", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ centerId }),
    }).catch(() => {});
    setSwitching(null); setOpen(false);
    window.location.reload();
  }

  async function pickHeadOffice() {
    if (hoMode) { setOpen(false); return; }
    setSwitching(HO_MODE);
    await fetch("/api/center/select", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ headOffice: true }),
    }).catch(() => {});
    setSwitching(null); setOpen(false);
    window.location.reload();
  }

  // Show the switcher for anyone with >1 center, and always for owners/super-admins
  // (so they can flip between Head office and any branch).
  if (!data || (data.centers.length <= 1 && !canHO)) return null;

  const badge = hoMode ? ROLE_BADGE.owner : (active ? ROLE_BADGE[active.role] : ROLE_BADGE.manager);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex max-w-[15rem] items-center gap-2 rounded-xl border border-ink-100 py-1.5 pl-2 pr-2.5 transition hover:bg-ink-50"
        aria-expanded={open}
      >
        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white", hoMode ? "bg-amber-500" : "bg-brand-gradient")}>
          {hoMode ? <Crown className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-xs font-semibold leading-tight">{hoMode ? "Head office" : (active?.name ?? "Select center")}</span>
          <span className="block truncate text-[10px] leading-tight text-ink-400">{hoMode ? `All ${data.centers.length} centers · ${badge.label}` : `${data.centers.length} centers · ${badge.label}`}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-400 transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-40 w-80 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-pop">
          {/* Head office (org-wide) — owners & super-admins */}
          {canHO && (
            <button
              onClick={pickHeadOffice}
              className={cn("flex w-full items-center gap-2.5 border-b border-ink-100 px-3 py-2.5 text-left transition hover:bg-ink-50", hoMode && "bg-amber-50/60")}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500 text-white"><Crown className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink-800">Head office</span>
                <span className="block truncate text-[11px] text-ink-400">Operate all centers · HO branding</span>
              </span>
              {switching === HO_MODE ? (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              ) : hoMode ? <Check className="h-4 w-4 shrink-0 text-amber-600" /> : null}
            </button>
          )}

          <div className="border-b border-ink-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-400" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search centers…" className="input h-9 w-full pl-8 text-sm" />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto p-1.5">
            {groups.length === 0 && <p className="px-3 py-6 text-center text-sm text-ink-400">No centers yet.</p>}
            {groups.map((g) => (
              <div key={g.orgName} className="mb-1">
                {(data.isSuperadmin || groups.length > 1) && (
                  <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">{g.orgName}</p>
                )}
                {g.centers.map((c) => {
                  const RB = ROLE_BADGE[c.role];
                  const isActive = !hoMode && c.id === data.activeCenterId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => pick(c.id)}
                      className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-ink-50", isActive && "bg-brand-50/60")}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-100 text-xs font-bold text-ink-600">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink-800">{c.name}</span>
                        <span className="block truncate text-[11px] text-ink-400">{c.city || c.type}</span>
                      </span>
                      <span className={cn("hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:flex", RB.cls)}>
                        <RB.icon className="h-3 w-3" /> {RB.label}
                      </span>
                      {switching === c.id ? (
                        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      ) : isActive ? (
                        <Check className="h-4 w-4 shrink-0 text-brand-600" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
