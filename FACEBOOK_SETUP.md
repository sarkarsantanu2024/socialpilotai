# Connecting Real Facebook — Setup Guide

This enables **real login with a client's Facebook account** and **live publishing
to their Page**. The code is already built — you just need a Meta app and keys.

## What works at each stage

| Stage | What you can do | Requires |
|---|---|---|
| **Demo mode** (now) | Everything mocked, ₹0 | nothing |
| **Development mode** | Log in + **publish live** to Pages **you/your testers admin** | Meta app keys only — **no App Review** |
| **Public launch** | Publish to **any client's** Page | Business Verification + **App Review** |

> For demos to clients, **Development mode is enough** — connect a Page you have a
> role on and publish for real, no review needed.

---

## Step 1 — Create a Meta app (~5 min)

1. Go to **https://developers.facebook.com/apps** → **Create App**.
2. Type: **Business**. Name it (e.g. "SocialPilot AI").
3. In the app dashboard, **Add Product → Facebook Login → Set up**.
4. Facebook Login → **Settings** → **Valid OAuth Redirect URIs**, add:
   ```
   http://localhost:3001/api/auth/facebook/callback
   ```
   (and your production URL later, e.g. `https://app.yoursite.com/api/auth/facebook/callback`)
5. From **App Settings → Basic**, copy the **App ID** and **App Secret**.

## Step 2 — Add your keys locally

Edit **`.env.local`** (create if missing — it is gitignored):

```
NEXT_PUBLIC_DEMO_MODE=false
FB_APP_ID=your_app_id
FB_APP_SECRET=your_app_secret
FB_REDIRECT_URI=http://localhost:3001/api/auth/facebook/callback
TOKEN_ENC_KEY=<64-char hex>   # optional but recommended; openssl rand -hex 32
```

Then **restart** the dev server (`Ctrl+C`, `npm run dev`) — env vars load at boot.

## Step 3 — Add testers (for Pages you don't own)

While the app is in development, only people with an **app role** can connect.
App dashboard → **App roles → Roles** → add the client as **Tester** (they accept
the invite). Or just connect a Page **you** are an admin of.

## Step 4 — Connect & publish

1. In the app → **Settings → Connections → Connect Facebook Page**.
2. Approve the permissions (`pages_show_list`, `pages_manage_posts`,
   `pages_read_engagement`).
3. Pick the Page (if you manage several).
4. Go to **AI Content Studio → Generate → Publish to Facebook** → it posts **live**
   to the selected Page. 🎉

---

## Step 5 — Public launch (later)

To publish to **clients' Pages who aren't testers**, Meta requires:
- **Business Verification** (company documents — free, ~2–5 days).
- **App Review** for `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`
  (screencast + explanation — free, ~1–3 weeks).

Start these early — they are the main launch-timeline risk (architecture §12, §17).

## Scheduled publishing (cron)

Two layers (architecture §5.2):
1. **Native Facebook scheduling** — in the Studio, click **Schedule**, pick a date/time,
   **Confirm schedule**. For a connected Page this posts with `published=false` +
   `scheduled_publish_time`, so **Facebook publishes it at that moment**.
2. **Cron orchestrator** — `GET /api/cron/publish` finds due posts and publishes them
   (handles video/reels + retries that native scheduling can't). Protect it with
   `CRON_SECRET` in `.env.local`; the caller sends `Authorization: Bearer <secret>`.
   - Vercel runs it every 10 min automatically (`vercel.json`).
   - Test locally: `GET /api/cron/publish?force=1` (publishes all scheduled demo posts).

## Live per-client data

When a client's Page is connected, **Posts, Calendar, Analytics & Dashboard show REAL
data** pulled from the Graph API (their actual posts, reach, reactions, followers) —
look for the green **"Live data"** badge. Not connected → the per-client demo dataset
(amber **"Demo data"**). Leads/Campaigns stay demo until the Ads & Leads (premium)
APIs are connected.

## Notes
- Page access tokens **don't expire**; we store them **encrypted** (AES-256-GCM)
  in an httpOnly cookie for the demo, and in the `connected_pages` table in
  production.
- The same Meta app later adds the **Marketing API** (`ads_management`) and
  **Lead Ads** (`leads_retrieval`) for Modules 5 & 6 — separate App Review.
- Uploaded images (data URLs) publish as **text posts**; AI/stock images (public
  URLs) publish as **photo posts**. Video/reels send the client's uploaded file.
