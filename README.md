# SocialPilot AI

**Facebook-only marketing automation for small businesses** — generate posts with AI,
schedule & publish, track performance, get an AI ad recommendation, approve it, run a
**paused** sandbox ad, and capture leads. Built to demo end-to-end for **₹0**.

> Target customer: coaching centres, gyms, playschools, abacus centres (₹499–₹999/mo).
> The demo tenant is **Bright Minds Coaching Centre, Pune**.

---

## ⚡ Quick start (zero setup)

```bash
npm install
npm run dev
```

Open **http://localhost:3000** → click **"Try the live demo"**.

That's it. The app runs in **DEMO_MODE** by default — **no database, no API keys, no
Facebook account, and no money** are ever required. Every external call (Gemini, Facebook
Graph & Marketing API) has a realistic mock fallback, so all 9 screens are fully clickable.

---

## 📱 Responsive on every screen size

The whole app is mobile-first and adapts across breakpoints:

- **Mobile (<640px):** collapsible drawer nav (hamburger), card-based lists, single column.
- **Tablet (640–1024px):** 2-column grids, condensed tables.
- **Desktop (≥1024px):** fixed sidebar, multi-column dashboards, full data tables.

To show it: open dev tools → device toolbar, or just resize the window. Try the **Leads**
page (table → cards) and the **Calendar** (full labels → dots) on a phone width.

---

## 🎬 5-minute client demo script

Click through in this order — it's the full loop the platform automates:

| # | Screen | What to show |
|---|--------|--------------|
| 1 | **Dashboard** | Live stats, growth chart, best-time-to-post, AI performance report, "next step" card. |
| 2 | **AI Content Studio** (Phase 1) | Type an offer → **Generate 3 variations** → branded templates with caption + hashtags + music → pick one → **Save as draft**. |
| 3 | **Posts & Publishing** (Phase 2) | Filter Drafts/Scheduled/Published → hit **Publish now** on a draft (simulated Graph API call → gets a Facebook post ID). |
| 4 | **Content Calendar** (Phase 2) | Month grid with scheduled/published posts + the **Indian festival calendar** overlaid. Navigate months. |
| 5 | **Content Intelligence** (Phase 3) | **Festival library** (auto-stamped with brand kit) and **business-type templates** ("Rewrite for my business"). |
| 6 | **Analytics** (Phase 4) | Reach/engagement trend, best day, top-posts table, AI-written plain-language report. |
| 7 | **Ad Recommendations** (Phase 5) | AI recommendation card → edit budget (spend-cap enforced) → **Approve** → creates a campaign. |
| 8 | **Campaigns** (Phase 6) | Campaign is **PAUSED** in a **sandbox** account, with FB IDs. "Go live" is the ONLY money button. |
| 9 | **Leads** (Phase 6) | **Simulate test lead** (Meta Lead Ads Testing Tool style) → appears instantly → ROI / cost-per-lead. |

End on **Settings** to show the business profile + brand kit (the single AI context object)
and the Facebook/sandbox connections.

---

## 🔒 Safety guarantees (built in, even in real mode)

1. **DEMO_MODE** — on by default, and auto-on whenever a credential is missing.
2. **Ads are always created `status=PAUSED`** — never auto-activated (`src/lib/meta`).
3. **Sandbox / unfunded ad account only** — cannot deliver or charge.
4. **Spend caps** enforced in the approval UI (max ₹1,000/day, ₹5,000 total).
5. **"Go live"** is the single, explicit action that could ever spend money.
6. Real Facebook path uses **development mode** — acts only on Pages you have a role on,
   so **no App Review** is needed.

---

## 🧱 Architecture

```
src/
  app/
    page.tsx                 Landing / "open app"
    (app)/                   Authenticated shell (responsive sidebar + topbar)
      dashboard/             Overview + AI report
      studio/                Phase 1 — AI Content Studio
      posts/  calendar/      Phase 2 — Publishing & scheduling
      intelligence/          Phase 3 — Festival library + segment templates
      analytics/             Phase 4 — Insights + AI report
      ads/                   Phase 5 — Recommendation approval cards
      campaigns/  leads/     Phase 6 — Paused execution + leads/ROI
      settings/              Profile, brand kit, connections, billing
    api/                     generate · publish · campaign (call the services)
  lib/
    ai/                      Gemini wrapper + MOCK layer
    meta/                    Graph + Marketing API wrapper + MOCK layer
    demo/data.ts             The seed that powers DEMO_MODE
    config.ts                DEMO_MODE switch + pinned Graph API version
    types.ts                 Domain types (mirror Prisma schema)
  components/                UI kit, layout shell, charts
prisma/schema.prisma         Real data model (Neon Postgres), every table tenant-scoped
```

**Tech:** Next.js 14 (App Router, TypeScript), Tailwind CSS, Recharts, Lucide icons.
Designed for free tiers: Cloudflare Pages, Neon Postgres, Cloudflare R2, Gemini Flash-Lite,
GitHub Actions cron, Resend/Brevo email, Razorpay (stubbed).

---

## 🔌 Going from demo → real (later)

Set `NEXT_PUBLIC_DEMO_MODE=false` and fill `.env` (see `.env.example`):

- **Gemini:** add `GEMINI_API_KEY` → real text generation in `src/lib/ai`.
- **Facebook:** add `FB_APP_ID` / `FB_APP_SECRET` (development mode) → real OAuth,
  organic publish, and Marketing API in `src/lib/meta`. Graph version pinned in
  `src/lib/config.ts` (`FB_GRAPH_VERSION`).
- **Database:** add Neon `DATABASE_URL`, then `npx prisma migrate dev`.

The mock and real paths share the same function signatures, so screens don't change.

---

## Phase status

- ✅ Phase 1 — Content core (AI Content Studio)
- ✅ Phase 2 — Publishing & scheduling (publish, calendar)
- ✅ Phase 3 — Content intelligence (festivals + segment templates)
- ✅ Phase 4 — Analytics (insights + AI report)
- ✅ Phase 5 — Ad decisioning engine (recommendation + approval)
- ✅ Phase 6 — Ads execution & leads (paused campaigns + leads/ROI)

All six phases are demoable in DEMO_MODE.
