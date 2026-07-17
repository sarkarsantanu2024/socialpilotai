"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Upload, Download, Plus, Trash2, X, Clock,
  Image as ImageIcon, Film, Video, Type as TypeIcon, Smile, Bold, Italic,
  Sparkles, Send, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Festival, Post } from "@/lib/types";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MON_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TYPES: Post["type"][] = ["image", "reel", "video", "text"];
const STORAGE_KEY = "sp_calendar";

type View = "feed" | "daily" | "weekly" | "monthly";
type Kind = "published" | "scheduled" | "planned";

// A user-planned calendar entry (added via CSV import or the composer). These
// live in localStorage so they persist across reloads without a backend.
type Planned = {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  title: string;
  caption: string;
  type: Post["type"];
  hashtags: string[];
  image?: string; // data-URL or http URL (local-only)
  status?: "draft" | "scheduled";
};

// Unified render item (posts + planned) used by every view.
type CalItem = {
  id: string;
  key: string; // YYYY-MM-DD
  time?: string; // HH:MM
  title: string;
  caption: string;
  hashtags: string[];
  type: Post["type"];
  image?: string;
  kind: Kind;
  planned?: Planned; // present when editable
};

// ── date helpers (UTC-based so they line up with ISO date strings) ──────────
function keyOf(d: Date) { return d.toISOString().slice(0, 10); }
function parseKey(k: string) { return new Date(`${k}T00:00:00Z`); }
function addDays(d: Date, n: number) { return new Date(d.getTime() + n * 86400000); }
function addMonths(d: Date, n: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}
function mondayOf(d: Date) {
  const dow = (d.getUTCDay() + 6) % 7; // 0=Mon … 6=Sun
  return addDays(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), -dow);
}
function fmtDayNum(k: string) {
  const d = parseKey(k);
  return `${d.getUTCDate()} ${MON_SHORT[d.getUTCMonth()]}`;
}
function fmtRange(a: string, b: string) { return `${fmtDayNum(a)} – ${fmtDayNum(b)}`; }
function timeOf(iso?: string) {
  if (!iso || iso.length < 16 || iso[10] !== "T") return undefined;
  return iso.slice(11, 16);
}

function loadPlanned(): Planned[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Planned[]) : [];
  } catch { return []; }
}

// Minimal CSV parser that handles quoted fields with embedded commas/quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((f) => f.trim() !== "")) rows.push(row); }
  return rows;
}

const CSV_TEMPLATE =
  "date,title,caption,type,hashtags\n" +
  "2026-07-01,Summer batch starts,\"🌞 New summer batch begins! Limited seats — enrol now.\",image,#Admissions #SummerBatch\n" +
  "2026-07-10,Study tip reel,\"📚 Save this quick study hack for exams!\",reel,#StudyHacks #ExamTips\n";

const TYPE_ICON: Record<Post["type"], typeof ImageIcon> = {
  image: ImageIcon, reel: Film, video: Video, text: TypeIcon,
};
const KIND_DOT: Record<Kind, string> = {
  published: "bg-emerald-500", scheduled: "bg-brand-500", planned: "bg-violet-500",
};

export function CalendarClient({
  posts, festivals, pageName, pageAvatar,
}: {
  posts: Post[]; festivals: Festival[]; pageName: string; pageAvatar?: string;
}) {
  const [planned, setPlanned] = useState<Planned[]>([]);
  const [view, setView] = useState<View>("weekly");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Kind>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | Post["type"]>("all");
  const [editor, setEditor] = useState<{ date: string; entry?: Planned } | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Anchor date drives every view. Default: the week of the most recent post.
  const [anchor, setAnchor] = useState<Date>(() => {
    const keys = posts.map((p) => (p.scheduledAt ?? p.publishedAt ?? "").slice(0, 10)).filter(Boolean);
    const latest = keys.sort().at(-1);
    return mondayOf(latest ? parseKey(latest) : new Date());
  });

  useEffect(() => setPlanned(loadPlanned()), []);
  const todayKey = useMemo(() => keyOf(new Date()), []);

  function persist(next: Planned[]) {
    setPlanned(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  // Build unified items list.
  const items: CalItem[] = useMemo(() => {
    const fromPosts: CalItem[] = posts.map((p) => {
      const iso = p.scheduledAt ?? p.publishedAt ?? "";
      return {
        id: p.id, key: iso.slice(0, 10), time: timeOf(iso),
        title: p.title, caption: p.caption, hashtags: p.hashtags ?? [],
        type: p.type, image: p.assetUrl || undefined,
        kind: (p.status === "published" ? "published" : "scheduled") as Kind,
      };
    }).filter((i) => i.key);
    const fromPlanned: CalItem[] = planned.map((p) => ({
      id: p.id, key: p.date, time: p.time, title: p.title, caption: p.caption,
      hashtags: p.hashtags, type: p.type, image: p.image, kind: "planned", planned: p,
    }));
    return [...fromPosts, ...fromPlanned];
  }, [posts, planned]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (statusFilter !== "all" && i.kind !== statusFilter) return false;
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      if (q && !(`${i.title} ${i.caption} ${i.hashtags.join(" ")}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, query, statusFilter, typeFilter]);

  const byKey = useMemo(() => {
    const m = new Map<string, CalItem[]>();
    for (const it of filtered) {
      const arr = m.get(it.key) ?? [];
      arr.push(it);
      m.set(it.key, arr);
    }
    m.forEach((arr) => arr.sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99")));
    return m;
  }, [filtered]);

  // Range label + navigation depend on the current view.
  const weekStart = mondayOf(anchor);
  const rangeLabel =
    view === "weekly" ? fmtRange(keyOf(weekStart), keyOf(addDays(weekStart, 13)))
    : view === "daily" ? fmtDayNum(keyOf(anchor))
    : view === "monthly" ? `${MONTHS[anchor.getUTCMonth()]} ${anchor.getUTCFullYear()}`
    : "All upcoming";

  function shift(dir: number) {
    if (view === "weekly") setAnchor(addDays(weekStart, dir * 14));
    else if (view === "daily") setAnchor(addDays(anchor, dir));
    else if (view === "monthly") setAnchor(addMonths(anchor, dir));
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result));
        if (!rows.length) { setImportMsg("⚠ Empty file."); return; }
        const header = rows[0].map((h) => h.trim().toLowerCase());
        const hasHeader = header.includes("date") && (header.includes("caption") || header.includes("title"));
        const idx = {
          date: hasHeader ? header.indexOf("date") : 0,
          title: hasHeader ? header.indexOf("title") : 1,
          caption: hasHeader ? header.indexOf("caption") : 2,
          type: hasHeader ? header.indexOf("type") : 3,
          tags: hasHeader ? header.indexOf("hashtags") : 4,
        };
        const body = hasHeader ? rows.slice(1) : rows;
        const added: Planned[] = [];
        let skipped = 0;
        for (const r of body) {
          const date = (r[idx.date] ?? "").trim();
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { skipped++; continue; }
          const rawType = (idx.type >= 0 ? r[idx.type] : "").trim().toLowerCase();
          const type = (TYPES as string[]).includes(rawType) ? (rawType as Post["type"]) : "image";
          const tags = (idx.tags >= 0 ? r[idx.tags] ?? "" : "")
            .split(/[\s,]+/).map((t) => t.trim()).filter(Boolean)
            .map((t) => (t.startsWith("#") ? t : `#${t}`));
          added.push({
            id: `cal_${date}_${added.length}_${body.length}`, date,
            title: (idx.title >= 0 ? r[idx.title] : "")?.trim() || (r[idx.caption]?.trim().slice(0, 40) ?? "Planned post"),
            caption: (r[idx.caption] ?? "").trim(), type, hashtags: tags, status: "draft",
          });
        }
        if (!added.length) { setImportMsg("⚠ No valid rows found. Check the date column (YYYY-MM-DD)."); return; }
        persist([...planned, ...added]);
        setImportMsg(`✓ Imported ${added.length} post${added.length > 1 ? "s" : ""}${skipped ? ` (${skipped} skipped)` : ""}.`);
      } catch { setImportMsg("⚠ Couldn't parse the file. Use the template format."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "socialpilot-calendar-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function saveEntry(entry: Planned) {
    const exists = planned.some((p) => p.id === entry.id);
    persist(exists ? planned.map((p) => (p.id === entry.id ? entry : p)) : [...planned, entry]);
    setEditor(null);
  }
  function deleteEntry(id: string) {
    persist(planned.filter((p) => p.id !== id));
    setEditor(null);
  }

  const openNew = (date?: string) => setEditor({ date: date ?? todayKey });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="card flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts…"
              className="input h-9 w-48 pl-8 text-sm"
            />
            <svg className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" /></svg>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="input h-9 w-auto text-sm">
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="planned">Planned</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="input h-9 w-auto text-sm capitalize">
            <option value="all">All formats</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date range + nav */}
          {view !== "feed" && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => shift(-1)} className="rounded-lg border border-ink-200 p-1.5 hover:bg-ink-50"><ChevronLeft className="h-4 w-4" /></button>
              <span className="min-w-[8.5rem] text-center text-sm font-semibold text-ink-700">{rangeLabel}</span>
              <button onClick={() => shift(1)} className="rounded-lg border border-ink-200 p-1.5 hover:bg-ink-50"><ChevronRight className="h-4 w-4" /></button>
            </div>
          )}
          {/* View toggles */}
          <div className="flex rounded-lg border border-ink-200 p-0.5">
            {(["feed", "daily", "weekly", "monthly"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition",
                  view === v ? "bg-brand-600 text-white shadow-sm" : "text-ink-500 hover:bg-ink-50"
                )}
              >{v}</button>
            ))}
          </div>
          <button onClick={() => openNew()} className="btn-primary h-9 text-sm"><Plus className="h-4 w-4" /> Create post</button>
        </div>
      </div>

      {/* Secondary actions + legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onImport} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs"><Upload className="h-3.5 w-3.5" /> Import CSV</button>
          <button onClick={downloadTemplate} className="btn-ghost text-xs"><Download className="h-3.5 w-3.5" /> Template</button>
        </div>
        <div className="hidden gap-3 text-xs text-ink-500 sm:flex">
          <Legend color="bg-emerald-500" label="Published" />
          <Legend color="bg-brand-500" label="Scheduled" />
          <Legend color="bg-violet-500" label="Planned" />
          <Legend color="bg-amber-500" label="Festival" />
        </div>
      </div>
      {importMsg && (
        <p className={cn("px-1 text-xs font-medium", importMsg.startsWith("✓") ? "text-emerald-600" : "text-rose-600")}>{importMsg}</p>
      )}

      {/* Views */}
      {view === "weekly" && (
        <WeeklyGrid
          weekStart={weekStart} byKey={byKey} festivals={festivals} todayKey={todayKey}
          pageName={pageName} pageAvatar={pageAvatar}
          onAdd={openNew} onOpen={(it) => it.planned && setEditor({ date: it.key, entry: it.planned })}
        />
      )}
      {view === "daily" && (
        <DailyView
          dayKey={keyOf(anchor)} items={byKey.get(keyOf(anchor)) ?? []} festival={festivals.find((f) => f.date === keyOf(anchor))}
          pageName={pageName} pageAvatar={pageAvatar}
          onAdd={openNew} onOpen={(it) => it.planned && setEditor({ date: it.key, entry: it.planned })}
        />
      )}
      {view === "monthly" && (
        <MonthlyGrid
          anchor={anchor} byKey={byKey} festivals={festivals} todayKey={todayKey}
          onAdd={openNew} onOpen={(it) => it.planned && setEditor({ date: it.key, entry: it.planned })}
        />
      )}
      {view === "feed" && (
        <FeedView
          items={[...filtered].sort((a, b) => `${b.key}${b.time ?? ""}`.localeCompare(`${a.key}${a.time ?? ""}`))}
          pageName={pageName} pageAvatar={pageAvatar}
          onOpen={(it) => it.planned && setEditor({ date: it.key, entry: it.planned })}
        />
      )}

      {editor && (
        <Composer
          date={editor.date} entry={editor.entry} pageName={pageName} pageAvatar={pageAvatar}
          onClose={() => setEditor(null)} onSave={saveEntry} onDelete={deleteEntry}
        />
      )}
    </div>
  );
}

// ── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name, src, size = "h-5 w-5" }: { name: string; src?: string; size?: string }) {
  if (src) return <img src={src} alt="" className={cn("shrink-0 rounded-full object-cover", size)} />;
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full bg-brand-gradient text-[9px] font-bold text-white", size)}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

// ── Rich post card (weekly / daily / feed) ──────────────────────────────────
function PostCard({
  item, pageName, pageAvatar, onOpen,
}: {
  item: CalItem; pageName: string; pageAvatar?: string; onOpen: (i: CalItem) => void;
}) {
  const Icon = TYPE_ICON[item.type];
  return (
    <button
      onClick={() => onOpen(item)}
      className="group w-full overflow-hidden rounded-xl border border-ink-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="flex items-center gap-1.5 px-2 pt-2">
        <Avatar name={pageName} src={pageAvatar} />
        <span className="truncate text-[11px] font-semibold text-ink-800">{pageName}</span>
        <span className={cn("ml-auto h-2 w-2 shrink-0 rounded-full", KIND_DOT[item.kind])} title={item.kind} />
      </div>
      {item.time && (
        <div className="flex items-center gap-1 px-2 pt-1 text-[10px] font-medium text-ink-500">
          <Clock className="h-3 w-3" /> {item.time}
        </div>
      )}
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt="" className="mt-1.5 aspect-[5/4] w-full object-cover" />
      ) : (
        <div className="mt-1.5 grid aspect-[5/4] w-full place-items-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-400">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="line-clamp-2 px-2 py-1.5 text-[11px] leading-snug text-ink-700">{item.caption || item.title}</p>
      <div className="flex items-center gap-1 px-2 pb-2 text-ink-400"><Icon className="h-3 w-3" /></div>
    </button>
  );
}

function AddTile({ onClick, big }: { onClick: () => void; big?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "grid w-full place-items-center rounded-xl border border-dashed border-ink-200 text-ink-300 transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-500",
        big ? "h-16" : "h-8"
      )}
    >
      <Plus className={big ? "h-6 w-6" : "h-4 w-4"} />
    </button>
  );
}

// ── Weekly (2-week) grid ────────────────────────────────────────────────────
function WeeklyGrid({
  weekStart, byKey, festivals, todayKey, pageName, pageAvatar, onAdd, onOpen,
}: {
  weekStart: Date; byKey: Map<string, CalItem[]>; festivals: Festival[]; todayKey: string;
  pageName: string; pageAvatar?: string; onAdd: (d: string) => void; onOpen: (i: CalItem) => void;
}) {
  const days = Array.from({ length: 14 }, (_, i) => keyOf(addDays(weekStart, i)));
  return (
    <div className="card overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b border-ink-100 bg-ink-50 text-xs font-semibold text-ink-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-3 py-2.5">
            <span className="hidden lg:inline">{d}</span>
            <span className="lg:hidden">{d.slice(0, 3)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((key, i) => {
          const dayItems = byKey.get(key) ?? [];
          const fest = festivals.find((f) => f.date === key);
          const isToday = key === todayKey;
          return (
            <div key={key} className={cn(
              "min-h-[210px] border-b border-r border-ink-100 p-1.5",
              i % 7 === 6 && "border-r-0", isToday && "bg-brand-50/30"
            )}>
              <div className="mb-1.5 flex items-center justify-between px-0.5">
                <span className={cn("text-[11px] font-semibold", isToday ? "text-brand-600" : "text-ink-400")}>{fmtDayNum(key)}</span>
                {fest && <span title={fest.name} className="text-sm leading-none">{fest.emoji}</span>}
              </div>
              {fest && (
                <p className="mb-1.5 truncate rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700" title={fest.name}>{fest.name}</p>
              )}
              <div className="space-y-1.5">
                {dayItems.map((it) => <PostCard key={it.id} item={it} pageName={pageName} pageAvatar={pageAvatar} onOpen={onOpen} />)}
                <AddTile onClick={() => onAdd(key)} big={dayItems.length === 0} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Monthly grid (compact chips) ────────────────────────────────────────────
function MonthlyGrid({
  anchor, byKey, festivals, todayKey, onAdd, onOpen,
}: {
  anchor: Date; byKey: Map<string, CalItem[]>; festivals: Festival[]; todayKey: string;
  onAdd: (d: string) => void; onOpen: (i: CalItem) => void;
}) {
  const y = anchor.getUTCFullYear(), m = anchor.getUTCMonth();
  const firstDow = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7; // Mon-based
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(keyOf(new Date(Date.UTC(y, m, d))));
  return (
    <div className="card overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b border-ink-100 bg-ink-50 text-center text-xs font-semibold text-ink-500">
        {WEEKDAYS.map((d) => <div key={d} className="py-2"><span className="hidden sm:inline">{d.slice(0, 3)}</span><span className="sm:hidden">{d[0]}</span></div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((key, i) => {
          if (!key) return <div key={i} className="min-h-[92px] border-b border-r border-ink-100 bg-ink-50/40" />;
          const dayItems = byKey.get(key) ?? [];
          const fest = festivals.find((f) => f.date === key);
          const isToday = key === todayKey;
          return (
            <button key={key} onClick={() => onAdd(key)} className={cn("min-h-[92px] border-b border-r border-ink-100 p-1.5 text-left transition hover:bg-brand-50/40", isToday && "bg-brand-50/40")}>
              <div className="flex items-center justify-between">
                <span className={cn("grid h-6 w-6 place-items-center rounded-full text-xs font-medium", isToday ? "bg-brand-600 text-white" : "text-ink-500")}>{parseKey(key).getUTCDate()}</span>
                {fest && <span className="text-sm leading-none" title={fest.name}>{fest.emoji}</span>}
              </div>
              <div className="mt-1 space-y-1">
                {dayItems.slice(0, 3).map((it) => (
                  <span
                    key={it.id}
                    onClick={(e) => { e.stopPropagation(); onOpen(it); }}
                    className={cn("block truncate rounded px-1.5 py-0.5 text-[10px] font-medium",
                      it.kind === "published" ? "bg-emerald-50 text-emerald-700" : it.kind === "scheduled" ? "bg-brand-50 text-brand-700" : "bg-violet-50 text-violet-700")}
                    title={it.title}
                  >{it.time ? `${it.time} · ` : ""}{it.title}</span>
                ))}
                {dayItems.length > 3 && <span className="px-1.5 text-[10px] text-ink-400">+{dayItems.length - 3} more</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Daily view ──────────────────────────────────────────────────────────────
function DailyView({
  dayKey, items, festival, pageName, pageAvatar, onAdd, onOpen,
}: {
  dayKey: string; items: CalItem[]; festival?: Festival;
  pageName: string; pageAvatar?: string; onAdd: (d: string) => void; onOpen: (i: CalItem) => void;
}) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">{fmtDayNum(dayKey)}{festival && <span className="ml-2 text-sm font-medium text-amber-600">{festival.emoji} {festival.name}</span>}</h3>
        <button onClick={() => onAdd(dayKey)} className="btn-ghost text-sm"><Plus className="h-4 w-4" /> Add</button>
      </div>
      {items.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-ink-200 py-12 text-sm text-ink-400">
          Nothing planned for this day. <button onClick={() => onAdd(dayKey)} className="ml-1 font-semibold text-brand-600">Create a post</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((it) => <PostCard key={it.id} item={it} pageName={pageName} pageAvatar={pageAvatar} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  );
}

// ── Feed view ───────────────────────────────────────────────────────────────
function FeedView({
  items, pageName, pageAvatar, onOpen,
}: {
  items: CalItem[]; pageName: string; pageAvatar?: string; onOpen: (i: CalItem) => void;
}) {
  if (!items.length) return <div className="card grid place-items-center py-16 text-sm text-ink-400">No posts match your filters.</div>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((it) => (
        <div key={it.id} className="space-y-1">
          <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">{fmtDayNum(it.key)}</p>
          <PostCard item={it} pageName={pageName} pageAvatar={pageAvatar} onOpen={onOpen} />
        </div>
      ))}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={cn("h-2.5 w-2.5 rounded-full", color)} /> {label}</span>;
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

// ── Composer: two-pane editor + live post preview (screenshot 2) ────────────
function Composer({
  date, entry, pageName, pageAvatar, onClose, onSave, onDelete,
}: {
  date: string; entry?: Planned; pageName: string; pageAvatar?: string;
  onClose: () => void; onSave: (e: Planned) => void; onDelete: (id: string) => void;
}) {
  const [d, setD] = useState(entry?.date ?? date);
  const [time, setTime] = useState(entry?.time ?? "");
  const [caption, setCaption] = useState(entry?.caption ?? "");
  const [type, setType] = useState<Post["type"]>(entry?.type ?? "image");
  const [tags, setTags] = useState((entry?.hashtags ?? []).join(" "));
  const [image, setImage] = useState<string | undefined>(entry?.image);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const hashtags = tags.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`));

  // Genuine save: a draft becomes a real DB draft; Schedule creates a real
  // scheduled post on the connected Facebook Page (no fake "planned" note).
  async function save(status: "draft" | "scheduled") {
    if (!caption.trim()) { captionRef.current?.focus(); return; }
    setBusy(true); setErr("");
    const title = caption.trim().split("\n")[0].slice(0, 48) || "Untitled post";
    const fullCaption = hashtags.length ? `${caption.trim()}\n\n${hashtags.join(" ")}` : caption.trim();
    try {
      if (status === "draft") {
        const res = await fetch("/api/posts", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, caption: fullCaption, type, hashtags, assetUrl: image, source: "calendar" }),
        });
        if (!res.ok) throw new Error("Couldn't save the draft.");
      } else {
        const dt = new Date(`${d}T${time || "20:00"}`);
        const res = await fetch("/api/publish", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, caption: fullCaption, type, hashtags, assetUrl: image, scheduledAt: dt.toISOString(), source: "calendar" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.needsConnection ? "Connect your Facebook Page first (Settings → Connect) to schedule." : data.error || "Couldn't schedule this post.");
      }
      if (entry) onDelete(entry.id); // promote an old local plan → real post
      onClose();
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }
  function wrap(sym: string) {
    const el = captionRef.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = caption.slice(s, e) || "text";
    setCaption(caption.slice(0, s) + sym + sel + sym + caption.slice(e));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="card grid w-full max-w-4xl grid-cols-1 overflow-hidden p-0 md:grid-cols-2" onClick={(e) => e.stopPropagation()}>
        {/* Editor */}
        <div className="flex flex-col border-b border-ink-100 p-5 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{entry ? "Edit post" : "Create post"}</h3>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-ink-100"><X className="h-5 w-5" /></button>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink-50 px-2.5 py-2">
            <Avatar name={pageName} src={pageAvatar} size="h-7 w-7" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink-800">{pageName}</p>
              <p className="text-[11px] text-ink-500">Facebook Page</p>
            </div>
          </div>

          <textarea
            ref={captionRef}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's on your mind? Write your post…"
            className="input mt-3 min-h-[130px] resize-none text-sm"
          />

          {/* format toolbar */}
          <div className="mt-2 flex items-center gap-1 text-ink-500">
            <button onClick={() => wrap("**")} className="rounded-md p-1.5 hover:bg-ink-100" title="Bold"><Bold className="h-4 w-4" /></button>
            <button onClick={() => wrap("_")} className="rounded-md p-1.5 hover:bg-ink-100" title="Italic"><Italic className="h-4 w-4" /></button>
            <button onClick={() => setCaption(caption + " 😊")} className="rounded-md p-1.5 hover:bg-ink-100" title="Emoji"><Smile className="h-4 w-4" /></button>
            <span className="ml-auto text-[11px] text-ink-400">{caption.length}</span>
          </div>

          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="#Hashtags"
            className="input mt-2 text-sm"
          />

          {/* image tiles */}
          <div className="mt-3 flex gap-2">
            {image && (
              <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-ink-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="h-full w-full object-cover" />
                <button onClick={() => setImage(undefined)} className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/50 text-white"><X className="h-3 w-3" /></button>
              </div>
            )}
            <input ref={imgRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" />
            <button onClick={() => imgRef.current?.click()} className="grid h-20 w-20 place-items-center rounded-lg border border-dashed border-ink-300 text-ink-400 hover:border-brand-400 hover:text-brand-500">
              <Plus className="h-6 w-6" />
            </button>
          </div>

          {/* schedule + format */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <label className="text-[11px] font-medium text-ink-500">Date
              <input type="date" value={d} onChange={(e) => setD(e.target.value)} className="input mt-1 text-sm" />
            </label>
            <label className="text-[11px] font-medium text-ink-500">Time
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input mt-1 text-sm" />
            </label>
            <label className="text-[11px] font-medium text-ink-500">Format
              <select value={type} onChange={(e) => setType(e.target.value as Post["type"])} className="input mt-1 text-sm capitalize">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>

          {/* actions */}
          <div className="mt-5 flex items-center gap-2">
            {entry ? (
              <button onClick={() => onDelete(entry.id)} className="btn-ghost text-sm text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /> Delete</button>
            ) : <span />}
            <div className="ml-auto flex gap-2">
              <button onClick={() => save("draft")} disabled={busy} className="btn-ghost text-sm disabled:opacity-60">Save draft</button>
              <button onClick={() => save("scheduled")} disabled={busy} className="btn-primary text-sm disabled:opacity-60">
                {busy ? <><RefreshCw className="h-4 w-4 animate-spin" /> Working…</> : <><Send className="h-4 w-4" /> Schedule</>}
              </button>
            </div>
          </div>
          {err && <p className="mt-2 text-right text-xs font-medium text-rose-600">{err}</p>}
        </div>

        {/* Live preview */}
        <div className="bg-ink-50/60 p-5">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" /> Post preview
          </p>
          <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
            <div className="flex items-center gap-2 p-3">
              <Avatar name={pageName} src={pageAvatar} size="h-9 w-9" />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-ink-900">{pageName}</p>
                <p className="text-[11px] text-ink-400">{d}{time ? ` · ${time}` : ""}</p>
              </div>
            </div>
            {caption.trim() ? (
              <p className="whitespace-pre-wrap px-3 pb-2 text-sm text-ink-800">{caption}</p>
            ) : (
              <p className="px-3 pb-2 text-sm italic text-ink-300">Your caption will appear here…</p>
            )}
            {hashtags.length > 0 && (
              <p className="px-3 pb-2 text-sm font-medium text-brand-600">{hashtags.join(" ")}</p>
            )}
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="max-h-72 w-full object-cover" />
            ) : (
              <div className="grid aspect-square w-full place-items-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-300">
                <ImageIcon className="h-10 w-10" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
