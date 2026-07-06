# Deploying SocialPilot AI to Vercel

The app is production-ready: `npm run build` runs `prisma generate → prisma migrate deploy → next build`, so the database schema is applied automatically on every deploy. Auto-publishing runs via Vercel Cron (`vercel.json`, every 10 min).

## 1. Push the code to GitHub

```bash
git add -A
git commit -m "Live build: real auth, DB, AI, billing, redesign"
git push origin main
```

## 2. Import the repo into Vercel

1. Go to **vercel.com → Add New → Project** → import `sarkarsantanu2024/socialpilotai`.
2. Framework preset: **Next.js** (auto-detected). Leave build/output defaults.
3. Before the first deploy, add the **Environment Variables** below.

## 3. Environment variables (Project → Settings → Environment Variables)

Set these for **Production** (and Preview if you want). Copy the values from your local `.env.local`, **except `FB_REDIRECT_URI`**, which must be your live URL.

| Variable | Value / note |
|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | `false` |
| `DATABASE_URL` | Neon **pooled** URL (…-pooler…, `?sslmode=require`) |
| `DIRECT_URL` | Neon **direct** URL (no `-pooler`) — used by `migrate deploy` |
| `GEMINI_API_KEY` | your `AIza…` key |
| `GEMINI_TEXT_MODEL` | `gemini-2.0-flash` |
| `FB_APP_ID` | your Meta app id |
| `FB_APP_SECRET` | your Meta app secret |
| `FB_REDIRECT_URI` | **`https://YOUR-DOMAIN.vercel.app/api/auth/facebook/callback`** |
| `PEXELS_API_KEY` | your Pexels key |
| `TOKEN_ENC_KEY` | **same** 32-byte hex as local (so encrypted tokens stay valid) |
| `CRON_SECRET` | same as local — Vercel Cron sends it automatically as a Bearer token |
| `WEBHOOK_VERIFY_TOKEN` | `socialpilot-verify` (or your own) |

## 4. Update the Meta (Facebook) app for production

In developers.facebook.com → your app:

1. **Facebook Login → Settings → Valid OAuth Redirect URIs**: add
   `https://YOUR-DOMAIN.vercel.app/api/auth/facebook/callback`
2. **App Domains / Site URL**: add `YOUR-DOMAIN.vercel.app`.
3. **Webhooks → leadgen** (for live Lead Ads): callback URL
   `https://YOUR-DOMAIN.vercel.app/api/webhooks/leadgen`, verify token = `WEBHOOK_VERIFY_TOKEN`.

## 5. Deploy

Click **Deploy**. After it's live:

- Visit the URL → **Sign up** → you're in with a clean, empty workspace.
- **Settings → Connect Facebook Page** to publish/read live.
- Scheduled posts auto-publish via the cron (Vercel **Pro** is needed for sub-daily cron; on Hobby the cron runs once/day — or point an external scheduler like cron-job.org at `/api/cron/publish?secret=YOUR_CRON_SECRET`).

## Notes
- Migrations live in `prisma/migrations/` and apply automatically on deploy.
- To change plans/pricing, edit the tiers in `src/app/(app)/settings/SettingsClient.tsx` and the landing page.
