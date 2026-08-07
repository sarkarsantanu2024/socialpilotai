# Meta App Review — SocialPilot AI

Copy-paste the sections below into the Meta App Dashboard → **App Review** (one justification per
permission) and use the shot list in §3 to record ONE video. Every justification cites the exact
timestamp in that video where the permission is demonstrated — that citation is the direct answer to
the rejection we received, so do not drop it.

- **App name:** SocialPilot AI
- **App ID:** 3598064290334860
- **Owner business (must own the app):** Nexvora Technologies — **Udyam: UDYAM-WB-10-021416**
- **App admin:** Santanu Sarkar (sarkarsantanu69@gmail.com)
- **App URL:** https://socialpilot.nexvoratechnologies.co.in
- **Privacy Policy:** https://socialpilot.nexvoratechnologies.co.in/privacy
- **Terms:** https://socialpilot.nexvoratechnologies.co.in/terms
- **Category:** Business / Social media management
- **Platform:** Web

> **The apex `nexvoratechnologies.co.in` now serves the Nexvora corporate site, NOT this app.**
> Every URL you give a reviewer must be on `socialpilot.nexvoratechnologies.co.in`. Sending them to the
> apex lands them on a company brochure and earns an instant rejection.

---

## Round 2 — why round 1 was rejected

Submitted 2026-08-05, rejected. `public_profile` approved; `pages_manage_posts`, `pages_show_list`,
`pages_read_engagement` and `business_management` all rejected with the identical boilerplate:

> **Screencast Not Aligned with Use Case Details** — Developer Policy 1.6. "The submitted screencast
> fails to demonstrate the end-to-end experience of the use case described in the submission notes."

Their required elements were:

1. The complete Meta login flow
2. **A user granting app access to the permission/feature**
3. The end-to-end experience of the use case
4. English UI, captions/tool-tips, explain buttons and UI elements
5. Declare it if the app is server-to-server or uses a system user token

**Items 1 and 2 are what we missed.** The submitted video opened on the screen-recorder's own setup UI
and went straight to a grid of already-published posts. The reviewer never saw the facebook.com login
page or the blue permissions-consent dialog — so from their side the app simply *had* Page access with
no visible grant. Nothing was wrong with the code, the written justifications, the business
verification, or the policy pages.

**Changes for round 2:**

- **`business_management` is dropped.** It needs its own distinct on-screen proof (a Page owned by a
  Business Portfolio appearing in the connect list), and carrying it meant one weak beat could sink the
  three scopes the product actually runs on. It is commented out of `CORE_SCOPES` in
  `src/lib/config.ts`. Request it in a later round. Until then `/me/accounts` only enumerates Pages the
  connecting user owns personally — not ones held inside a client's Business Manager.
- **Three scopes this round:** `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`.
- **The screencast is re-recorded from a revoked state** so the consent dialog is forced to appear.

---

## 0. Before you submit (pre-requisites — do these IN ORDER)

### 0.1 App ownership — DONE

The app is owned by **Nexvora Technologies** (not the MindMantra Abacus client portfolio). Verify at
App Dashboard → Social Pilot → "Business:". An app can belong to only ONE business at a time; to move
one you must remove it from the old portfolio first, then add it to the new one, or the claim throws
an "unexpected technical issue".

### 0.2 Business Verification — DONE

`pages_manage_posts` needs Advanced Access, which needs a **verified business**. It is the *company*
that gets verified, not your personal profile. Verified via Udyam **UDYAM-WB-10-021416** under
Nexvora Technologies → Settings → Security Centre.

### 0.3 Settings that must be true before recording

1. **Not in demo mode** — Vercel env `NEXT_PUBLIC_DEMO_MODE=false` on socialpilotai, **and redeployed
   after saving**. Env vars only apply to new builds. If demo mode is on, `hasFacebook()` returns false
   and every live Facebook feature is disabled (`src/lib/config.ts`).
2. **`FB_REDIRECT_URI`** = `https://socialpilot.nexvoratechnologies.co.in/api/auth/facebook/callback`
3. **`NEXT_PUBLIC_APP_URL`** = `https://socialpilot.nexvoratechnologies.co.in`
   Both must point at the **same host** — the session cookie in `src/lib/session.ts` is set with no
   `domain`, so it is host-only and never travels between hostnames. A half-move breaks the callback.
4. **Valid OAuth Redirect URI** in Facebook Login for Business → Settings:
   `https://socialpilot.nexvoratechnologies.co.in/api/auth/facebook/callback`
   Note the path is `/api/auth/facebook/callback` — **not** the Auth.js default
   `/api/auth/callback/facebook`.
5. **App Domains** (Settings → Basic): `nexvoratechnologies.co.in` — the root covers all subdomains.
6. **App icon (1024×1024), display name, Privacy Policy + Terms URLs** filled in.
7. **A test Facebook Page** you control and can post to.

### 0.4 Roles

Your own role is **Administrator**. "Testers" are branch owners you invite so they can connect their
Page while the app is still unpublished — you never become a tester. Once the app is **Published
(Live)** after this review, development-mode limits disappear and the self-connect link works for any
branch owner with no role at all.

---

## 1. What the app does (use-case summary)

SocialPilot AI is a social-media management tool for local businesses — coaching centres, abacus
franchises, gyms, salons. A business owner connects **their own** Facebook Page, then uses the app to:

1. **Generate** on-brand post content (caption, hashtags, image) with AI.
2. **Publish or schedule** that content to their connected Facebook Page.
3. **See engagement insights** (reactions, comments, shares) for their Page, so the app can recommend
   what to post next.

Franchise head offices manage many branches; each branch owner connects their own Page via a secure
link. The app never asks for or stores Facebook passwords — connection is via Facebook Login only.

**This is a standard web application using the Facebook Login frontend flow. No server-to-server
calls and no system user tokens are used.** *(This sentence answers their requirement 5 — keep it.)*

---

## 2. Permission-by-permission justification

Paste each block into the matching permission's "Tell us how you're using this permission or feature"
field. **Keep the timestamp citations** — they are the direct answer to "screencast not aligned with
use case details". Adjust the numbers to match your actual recording.

### `pages_show_list`

> Our app lets a business connect their own Facebook Page. After the user completes Facebook Login and
> grants access, we call `/me/accounts` to display the list of Pages they manage, so they can choose
> which Page SocialPilot should publish to. Without this permission we cannot show the user their own
> Pages to pick from and the connection cannot be established.
>
> In the screencast: the Facebook login page appears at **[0:35]**, the user grants access on the
> consent dialog at **[0:50]**, and the resulting Page list is shown and selected at **[1:05]**.

### `pages_manage_posts`

> This is the app's core feature. After the user selects their Page, they generate a post in the AI
> Content Studio and click "Publish now" (or schedule it for later). We use that Page's access token to
> create the post via the Page feed / photos endpoints. Head-office users can publish the same post to
> several of their own branch Pages at once. Without this permission the app cannot publish the content
> the user created, which is its entire purpose.
>
> In the screencast: the user grants access at **[0:50]**, composes a post at **[1:25]**, publishes at
> **[1:40]**, and the post is shown live on the actual Facebook Page at **[1:55]**.

### `pages_read_engagement`

> After a user connects and publishes, the app shows them how their Page is performing — reactions,
> comments and shares — on the Dashboard and Analytics screens, and uses those metrics to recommend
> what to post next and which post to promote. We read this with the Page token via the post
> engagement fields. Without it we cannot show the user how their own content performed.
>
> In the screencast: the user grants access at **[0:50]** and the Analytics screen showing real
> engagement figures for the connected Page appears at **[2:10]**.

---

## 3. Screencast — shot list

One continuous take. No cuts, no jumps, no speed-up, no black frames. English narration throughout.
Name each permission out loud at the moment you demonstrate it. Under 3 minutes. 1080p, cursor visible.

### 3.1 Prep — this is where round 1 failed. Do every step.

1. **Create a fresh Chrome profile** (profile icon → Add → "Continue without an account"). Nothing
   logged in.
2. **Revoke the app at Facebook**: facebook.com → Settings & Privacy → Settings → **Apps and Websites**
   → **Social Pilot** → **Remove**. ← *This is the critical one. Without it Facebook remembers your
   previous grant and silently skips the consent dialog, which is exactly what got us rejected.*
3. **Disconnect the Page in SocialPilot**: Organization → Facebook connections → disconnect the centre.
4. **Log out of Facebook** in that profile — you need to type credentials on camera.
5. **Confirm `NEXT_PUBLIC_DEMO_MODE=false`** and that the deploy after setting it completed.
6. Close all other tabs. Trim the recorder's own setup screen off the front of the final file.

### 3.2 The shots

| Time | On screen | Narration |
| --- | --- | --- |
| 0:00 | App home or your face | "This is SocialPilot AI, a social media management tool for local businesses. I'll show the complete flow: logging in, granting Facebook permissions, connecting a Page, publishing a post, and viewing engagement." |
| 0:10 | URL bar reading `socialpilot.nexvoratechnologies.co.in`, then the login form | "I'm logging into SocialPilot with a demo account." Type it out. |
| 0:25 | Organization → Facebook connections | "This Connect button starts Facebook Login so the app can manage this centre's Page." |
| **0:35** | **facebook.com login page — show the URL bar, type email and password** | "Now I'm signing in to Facebook." ← **requirement 1** |
| **0:50** | **The blue consent dialog. Hold 4 seconds.** | "Facebook is asking me to grant SocialPilot access to show my Pages, manage posts, and read engagement. I'll click Continue." ← **requirement 2** |
| 1:05 | Page picker list | "The app now lists the Pages I manage — this uses `pages_show_list`." Select the Page. |
| 1:15 | "Connected · &lt;Page name&gt;" | "The centre is connected." |
| 1:25 | AI Content Studio → type a prompt → Generate | "I'll generate a post with AI." |
| 1:40 | Click **Publish now**, success message | "Publishing to my connected Facebook Page using `pages_manage_posts`." |
| **1:55** | **New tab → the real Facebook Page → the post is live** | "Here's the post live on the Page." ← **requirement 3** |
| 2:10 | Analytics screen with real numbers | "These engagement metrics come from `pages_read_engagement`." |
| 2:25 | — | "That's the complete flow: Facebook login, permission grant, Page connect, publish, and engagement." |

### 3.3 Check the file before uploading

Watch it end to end. You must be able to see, unambiguously:

- [ ] The `facebook.com` URL bar and a login form with credentials being typed
- [ ] The blue permissions dialog, with the permission names readable
- [ ] The Page list, and a Page being selected
- [ ] The post appearing on the real Facebook Page
- [ ] Real numbers on the Analytics screen
- [ ] No frame showing the screen-recorder's own UI

If any one is missing, re-record. A second rejection for the same reason is much harder to recover from.

---

## 4. Reviewer test instructions (paste in "Instructions for reviewer")

> 1. Go to **https://socialpilot.nexvoratechnologies.co.in** and log in:
>    - Username: `<REVIEWER_TEST_USERNAME>`
>    - Password: `<REVIEWER_TEST_PASSWORD>`
> 2. Open **Organization → Overview → Facebook connections** and click **Connect** next to a centre
>    (or use this connect link: `<A FRESH /connect/... LINK>`).
> 3. Complete Facebook Login and select a Page you manage — the app lists your Pages
>    (`pages_show_list`).
> 4. Open **AI Content Studio**, click **Generate**, then **Publish now** — the post publishes to your
>    Page (`pages_manage_posts`). A "View post" link confirms it.
> 5. Open **Analytics** to see the Page's engagement (`pages_read_engagement`).
>
> Notes: This is a standard web application using the Facebook Login frontend flow — no server-to-server
> calls and no system user tokens. The app never collects Facebook passwords. Page access tokens are
> stored encrypted and used solely to publish content the user creates and to read that Page's own
> engagement.

**Immediately before submitting:**

- Test that login in a **private window** and walk the whole path yourself. A broken reviewer login is
  the most common rejection cause after a bad video, and a deploy can wipe seed data.
- Generate a **fresh** `/connect/<token>` link — old tokens may be spent or expired (14 days).

---

## 5. Data handling & privacy (for the Data Use questions)

- **What we access:** the user's list of Pages, a Page access token, the ability to publish posts to the
  user-selected Page, and that Page's engagement metrics.
- **Why:** to publish content the user creates and show them how it performed.
- **Storage:** Page access tokens are stored **encrypted at rest** (AES-256-GCM) in our database, scoped
  to the user's account. We never store Facebook passwords.
- **Retention/deletion:** the user can disconnect at any time, which deletes the stored tokens. Data
  handling follows our Privacy Policy:
  https://socialpilot.nexvoratechnologies.co.in/privacy
- **No sharing:** Page data is not sold or shared with third parties.

---

## 6. Later rounds — do NOT include these now

Kept here so the wording isn't lost. Each needs its own screencast beat before it can be requested.

### `business_management`

> Lets `/me/accounts` enumerate Pages owned by a Business Portfolio, not just personally-owned Pages, so
> branch Pages held in a client's Business Manager appear in the connect list.

To request it: uncomment it in `CORE_SCOPES` (`src/lib/config.ts`), deploy, and add a beat to the video
showing a **Business-Portfolio-owned** Page appearing in the Page list, with narration explaining that
the user's Pages are managed through their Business Manager.

### `read_insights`

> Needed for reach, impressions, video views and clicks — these currently show "—" in the app. Reuses
> the existing Business Verification.

To request it: add `read_insights` to the OAuth scopes, fetch the insights edges in `fetchPageData`,
and note that **every branch must reconnect their Page** because existing tokens lack the new scope.

### `instagram_basic` + `instagram_content_publish`

> When the connected Page has a linked Instagram Business account, the app reads that account's id and
> username so the user can opt to also post to Instagram, and publishes the same image + caption there
> (create media container → publish).

Requires the Instagram product added to the Meta app and a demo Page with a genuinely linked IG
Business account. The scopes are commented out in `CORE_SCOPES`.

---

## 7. Common rejection reasons — avoid these

- **The video doesn't show the Facebook login page and the consent dialog.** This is what killed round
  1. Revoke the app at facebook.com first so the dialog is forced to reappear.
- The video doesn't show the *result* — a post claimed as published but never shown live on the Page.
- App in demo mode, or the feature isn't reachable by the reviewer. Verify `NEXT_PUBLIC_DEMO_MODE=false`
  and that the reviewer login reaches connect + publish + analytics.
- The reviewer login doesn't work, or seed data was wiped by a deploy during the review window.
- URLs in the submission point at the apex instead of `socialpilot.nexvoratechnologies.co.in`.
- Requesting a permission with no distinct on-screen proof of it (see §6).
- Business Verification incomplete, or Privacy Policy URL missing/irrelevant.
