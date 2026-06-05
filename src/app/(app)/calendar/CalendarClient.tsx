"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Upload, Download, Plus, Trash2, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Festival, Post } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TYPES: Post["type"][] = ["image", "reel", "video", "text"];
const STORAGE_KEY = "sp_calendar";

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// A user-planned calendar entry (added via CSV import or the day editor). These
// live in localStorage so they persist across reloads without a backend.
type Planned = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  caption: string;
  type: Post["type"];
  hashtags: string[];
};

// Minimal CSV parser that handles quoted fields with embedded commas/quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
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

function loadPlanned(): Planned[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Planned[]) : [];
  } catch {
    return [];
  }
}

const CSV_TEMPLATE =
  "date,title,caption,type,hashtags\n" +
  "2026-07-01,Summer batch starts,\"🌞 New summer batch begins! Limited seats — enrol now.\",image,#Admissions #SummerBatch\n" +
  "2026-07-10,Study tip reel,\"📚 Save this quick study hack for exams!\",reel,#StudyHacks #ExamTips\n";

export function CalendarClient({ posts, festivals }: { posts: Post[]; festivals: Festival[] }) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5); // 0-indexed → June
  const [planned, setPlanned] = useState<Planned[]>([]);
  const [editor, setEditor] = useState<{ date: string; entry?: Planned } | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setPlanned(loadPlanned()), []);

  function persist(next: Planned[]) {
    setPlanned(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = "2026-06-03";

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function postsOn(key: string) {
    return posts.filter((p) => (p.scheduledAt ?? p.publishedAt ?? "").startsWith(key));
  }
  function plannedOn(key: string) {
    return planned.filter((p) => p.date === key);
  }
  function festivalOn(key: string) {
    return festivals.find((f) => f.date === key);
  }

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result));
        if (!rows.length) { setImportMsg("⚠ Empty file."); return; }
        // Detect & skip a header row.
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
            id: `cal_${date}_${added.length}_${body.length}`,
            date,
            title: (idx.title >= 0 ? r[idx.title] : "")?.trim() || (r[idx.caption]?.trim().slice(0, 40) ?? "Planned post"),
            caption: (r[idx.caption] ?? "").trim(),
            type,
            hashtags: tags,
          });
        }
        if (!added.length) { setImportMsg("⚠ No valid rows found. Check the date column (YYYY-MM-DD)."); return; }
        persist([...planned, ...added]);
        setImportMsg(`✓ Imported ${added.length} post${added.length > 1 ? "s" : ""}${skipped ? ` (${skipped} skipped)` : ""}.`);
      } catch {
        setImportMsg("⚠ Couldn't parse the file. Use the template format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "socialpilot-calendar-template.csv";
    a.click();
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-600">
          Plan ahead: <b>import a CSV</b> of posts, or click any day to add one. Planned posts are saved on this device.
        </p>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onImport} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="btn-ghost text-sm">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button onClick={downloadTemplate} className="btn-ghost text-sm">
            <Download className="h-4 w-4" /> Template
          </button>
          <button onClick={() => setEditor({ date: toKey(year, month, 1) })} className="btn-primary text-sm">
            <Plus className="h-4 w-4" /> Add post
          </button>
        </div>
      </div>
      {importMsg && (
        <p className={cn("text-xs font-medium", importMsg.startsWith("✓") ? "text-emerald-600" : "text-rose-600")}>
          {importMsg}
        </p>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 p-4">
          <h2 className="text-lg font-bold">{MONTHS[month]} {year}</h2>
          <div className="flex items-center gap-2">
            <div className="hidden gap-3 text-xs text-ink-500 sm:flex">
              <Legend color="bg-emerald-500" label="Published" />
              <Legend color="bg-brand-500" label="Scheduled" />
              <Legend color="bg-violet-500" label="Planned" />
              <Legend color="bg-amber-500" label="Festival" />
            </div>
            <button onClick={() => shift(-1)} className="rounded-lg border border-ink-200 p-1.5 hover:bg-ink-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => shift(1)} className="rounded-lg border border-ink-200 p-1.5 hover:bg-ink-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-ink-100 bg-ink-50 text-center text-xs font-semibold text-ink-500">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{d[0]}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} className="min-h-[64px] border-b border-r border-ink-100 bg-ink-50/40 sm:min-h-[110px]" />;
            const key = toKey(year, month, d);
            const dayPosts = postsOn(key);
            const dayPlanned = plannedOn(key);
            const fest = festivalOn(key);
            const isToday = key === today;
            return (
              <button
                key={i}
                onClick={() => setEditor({ date: key })}
                className={cn(
                  "min-h-[64px] border-b border-r border-ink-100 p-1.5 text-left transition hover:bg-brand-50/40 sm:min-h-[110px] sm:p-2",
                  isToday && "bg-brand-50/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("grid h-6 w-6 place-items-center rounded-full text-xs font-medium", isToday ? "bg-brand-600 text-white" : "text-ink-500")}>
                    {d}
                  </span>
                  {fest && <span className="text-base leading-none" title={fest.name}>{fest.emoji}</span>}
                </div>

                <div className="mt-1 space-y-1">
                  {fest && (
                    <p className="hidden truncate rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 sm:block">
                      {fest.name}
                    </p>
                  )}
                  {dayPosts.map((p) => (
                    <p
                      key={p.id}
                      className={cn(
                        "truncate rounded px-1.5 py-0.5 text-[10px] font-medium",
                        p.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-brand-50 text-brand-700"
                      )}
                      title={p.title}
                    >
                      <span className="hidden sm:inline">{p.title}</span>
                      <span className="sm:hidden">•</span>
                    </p>
                  ))}
                  {dayPlanned.map((p) => (
                    <span
                      key={p.id}
                      onClick={(e) => { e.stopPropagation(); setEditor({ date: key, entry: p }); }}
                      className="flex items-center gap-1 truncate rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700"
                      title={`${p.title} (click to edit)`}
                    >
                      <Pencil className="h-2.5 w-2.5 shrink-0" />
                      <span className="hidden truncate sm:inline">{p.title}</span>
                      <span className="sm:hidden">•</span>
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {editor && (
        <DayEditor
          date={editor.date}
          entry={editor.entry}
          onClose={() => setEditor(null)}
          onSave={saveEntry}
          onDelete={deleteEntry}
        />
      )}
    </div>
  );
}

function DayEditor({
  date,
  entry,
  onClose,
  onSave,
  onDelete,
}: {
  date: string;
  entry?: Planned;
  onClose: () => void;
  onSave: (e: Planned) => void;
  onDelete: (id: string) => void;
}) {
  const [d, setD] = useState(entry?.date ?? date);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [caption, setCaption] = useState(entry?.caption ?? "");
  const [type, setType] = useState<Post["type"]>(entry?.type ?? "image");
  const [tags, setTags] = useState((entry?.hashtags ?? []).join(" "));

  function submit() {
    if (!caption.trim() && !title.trim()) return;
    onSave({
      id: entry?.id ?? `cal_${d}_${Math.abs(hashStr(caption + title))}`,
      date: d,
      title: title.trim() || caption.trim().slice(0, 40),
      caption: caption.trim(),
      type,
      hashtags: tags.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`)),
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{entry ? "Edit planned post" : "Add planned post"}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-ink-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-ink-600">
              Date
              <input type="date" value={d} onChange={(e) => setD(e.target.value)} className="input mt-1" />
            </label>
            <label className="text-xs font-medium text-ink-600">
              Format
              <select value={type} onChange={(e) => setType(e.target.value as Post["type"])} className="input mt-1 capitalize">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
          <label className="block text-xs font-medium text-ink-600">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title" className="input mt-1" />
          </label>
          <label className="block text-xs font-medium text-ink-600">
            Caption
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write your post…" className="input mt-1 min-h-[96px] resize-none" />
          </label>
          <label className="block text-xs font-medium text-ink-600">
            Hashtags
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#Admissions #SummerBatch" className="input mt-1" />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between">
          {entry ? (
            <button onClick={() => onDelete(entry.id)} className="btn-ghost text-sm text-rose-600 hover:bg-rose-50">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button onClick={submit} className="btn-primary text-sm">{entry ? "Save changes" : "Add to calendar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} /> {label}
    </span>
  );
}
