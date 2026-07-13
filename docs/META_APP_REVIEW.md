# Meta App Review — SocialPilot AI

Copy-paste the sections below into the Meta App Dashboard → **App Review → Permissions and Features**
(one justification per permission) and use the screencast script to record ONE video that shows every
permission in use. Reviewers reject vague answers and videos that don't *show the permission being used*,
so each justification below points at the exact on-screen step in the screencast.

- **App name:** SocialPilot AI
- **App ID:** 3598064290334860
- **Owner business (must own the app):** Nexvora Technologies — **Udyam: UDYAM-WB-10-021416**
- **App admin:** Santanu Sarkar (sarkarsantanu69@gmail.com)
- **App URL:** https://socialpilotai-bay.vercel.app
- **Privacy Policy:** https://socialpilotai-bay.vercel.app/privacy
- **Category:** Business / Social media management
- **Platform:** Web

---

## 0. Before you submit (pre-requisites — do these IN ORDER)

App Review fails instantly if these aren't in place. Do §0.1 → §0.2 first; the app's
owning business is what gets verified, so it must be Nexvora Technologies BEFORE you verify.

### 0.1 Put the app under the right business (Nexvora Technologies)

The app must be owned by **your product company, Nexvora Technologies** — not a client
portfolio (e.g. MindMantra Abacus). An app can belong to only ONE business at a time, so
**remove it from the old business first, then add it to Nexvora** (claiming while it's still
owned elsewhere throws an "unexpected technical issue"):

1. Old business portfolio → **Settings → Accounts → Apps → Social Pilot → ⋯ / Remove**.
2. **Nexvora Technologies → Settings → Accounts → Apps → Add** → App ID `3598064290334860` → **Add App**.
3. Verify: App Dashboard → Social Pilot → "Business:" reads **Nexvora Technologies**.

### 0.2 Business Verification (verify Nexvora with Udyam)

`pages_manage_posts` needs Advanced Access, which needs a **verified business**. It's the
**company** that's verified, not your personal profile — you're just the admin who submits it.

1. **Nexvora Technologies → Settings → Security Centre → Start verification**
   (or the "Authorisations and verifications" link).
2. Enter the business details **exactly as printed on the Udyam certificate**
   (legal name *Nexvora Technologies*, address, phone) → upload **UDYAM-WB-10-021416** →
   verify by phone OTP. Review takes ~2–5 business days.

### 0.3 Everything else

3. **App not in demo mode in production** — Vercel env `NEXT_PUBLIC_DEMO_MODE=false` (else the live
   Facebook features are disabled and the reviewer can't test them).
4. **Valid OAuth redirect URI** added: `https://socialpilotai-bay.vercel.app/api/auth/facebook/callback`
   (Facebook Login → Settings), and App Domain `socialpilotai-bay.vercel.app` (Settings → Basic).
5. **App icon (1024×1024), display name, and Privacy Policy + Terms URLs** filled in (Settings → Basic).
6. **A test Facebook Page** you control, ideally with a **linked Instagram Business account** (needed to
   demonstrate the two `instagram_*` permissions). If you have no IG account to show, submit the
   Instagram permissions in a separate round.
7. **Screen recording** ≤ a few minutes, in English, showing the full flow (script in §3).

### 0.4 Roles — you are the ADMIN, not a tester

Your own role on the app is **Administrator** (App Dashboard → App roles → Roles). "Testers" are
the **branch owners you invite** so they can connect their Page while the app is still *In
development*. You never become a tester. Once the app is **Published (Live)** after this review,
Development-mode limits disappear and the WhatsApp self-connect link works for **any** branch owner —
no tester role needed at all.

---

## 1. What the app does (use-case summary — paste in "Tell us how you're using this")

SocialPilot AI is a social-media management tool for local businesses (coaching centres, abacus
franchises, gyms, salons). A business owner connects **their own** Facebook Page, then uses the app to:

1. **Generate** on-brand post content (caption, hashtags, image) with AI.
2. **Publish or schedule** that content to their connected Facebook Page (and optionally the linked
   Instagram account).
3. **See engagement insights** (reach, reactions, comments, shares) for their Page so the app can
   recommend what to post next.

Franchise head offices manage many branches; each branch owner connects their own Page via a secure
link — the app never asks for or stores Facebook passwords; connection is via Facebook Login only.

---

## 2. Permission-by-permission justification

Paste each block into the matching permission's "How will you use this permission?" field.

### `pages_show_list`
> Our app lets a business connect their own Facebook Page. After the user clicks "Connect with
> Facebook" and grants access, we call `/me/accounts` to display the list of Pages they manage so they
> can pick which Page SocialPilot should publish to. Without this permission we cannot show the user
> their Pages to choose from. Shown in the screencast at **[00:20]** — the Page picker after login.

### `pages_manage_posts`
> This is the app's core feature. After the user selects their Page, they generate a post in the AI
> Content Studio and click "Publish now" (or "Schedule"). We use the Page's access token to create the
> post on their Page via the Page Feed / photo endpoints. Head-office users can also publish the same
> post to several of their own branch Pages at once. Without this permission the app cannot publish the
> content the user created, which is its primary purpose. Shown in the screencast at **[00:45]** —
> composing and publishing a live post that then appears on the Page at **[01:05]**.

### `pages_read_engagement`
> After a user connects and publishes, the app shows them their Page's performance — reach, reactions,
> comments and shares — on the Dashboard and Analytics screens, and uses those metrics to recommend the
> best time to post and which post to promote. We read this via the Page Insights / post engagement
> fields using the Page token. Without it we cannot show the user how their content performed. Shown in
> the screencast at **[01:20]** — the Analytics page displaying real reach/engagement for the Page.

### `instagram_basic`
> When the connected Facebook Page has a linked Instagram Business account, the app reads the linked IG
> account's id and username (via `instagram_business_account`) so the user can opt to also post to
> Instagram and see which IG account they're posting as. Without it we cannot identify the linked IG
> account. Shown in the screencast at **[01:40]** — the "Also post to Instagram (@handle)" option.

### `instagram_content_publish`
> With the user's consent, the app publishes the same image + caption to the Instagram Business account
> linked to their connected Page (create media container → publish). This lets a small business post to
> both Facebook and Instagram in one step. Without it the "Also post to Instagram" option cannot
> function. Shown in the screencast at **[01:50]** — the post being published to Instagram and appearing
> on the IG profile at **[02:05]**.

> If you are NOT demonstrating Instagram in this round, remove the two `instagram_*` blocks and request
> them later — approving FB-only first is faster.

---

## 3. Screencast script (record one continuous video)

Record at 1080p, cursor visible, narrate in English. Log in with a Facebook **test user or your own
account that manages a real test Page** (with a linked IG account if showing Instagram). Keep it under
~2.5 minutes. Timestamps are targets, not strict.

**[00:00] Intro (say this on camera):**
"This is SocialPilot AI, a social-media manager for local businesses. I'll connect a Facebook Page,
publish a post to it, and show the Page's engagement — demonstrating each requested permission."

**[00:08] Start the connect flow:**
- Go to `https://socialpilotai-bay.vercel.app`, log in to the SocialPilot demo account (creds in §4).
- Open **Organization → Overview → Facebook connections** and click **Connect** next to a center
  (or open a `/connect/<link>` page and click **Connect with Facebook**).

**[00:15] Facebook Login + consent:**
- The Facebook Login dialog appears. Show the requested permissions on screen. Click **Continue**.

**[00:20] `pages_show_list` — pick a Page:**
- The app shows the list of Pages you manage. Select your test Page. *(This proves `pages_show_list`.)*

**[00:30] Back in the app — connected:**
- Show the center now says "Connected · <Page name>".

**[00:38] Generate content:**
- Open **AI Content Studio**, choose "Single Image", type a prompt, click **Generate** — a caption +
  image appear.

**[00:45] `pages_manage_posts` — publish live:**
- Click **Publish now**. Narrate: "This publishes to my connected Facebook Page using
  pages_manage_posts."
- Show the success message with the "View post" link.

**[01:05] Show the post on Facebook:**
- Open the Page in another tab and show the post is now live. *(Proves `pages_manage_posts`.)*

**[01:20] `pages_read_engagement` — insights:**
- Back in the app, open **Analytics** (or Dashboard). Show reach / reactions / comments / shares for the
  Page. Narrate: "These metrics come from pages_read_engagement." *(Proves `pages_read_engagement`.)*

**[01:40] `instagram_basic` — linked IG (only if demoing IG):**
- In the Studio, show the checkbox "Also post to Instagram (@yourhandle)" — the handle proves we read
  the linked IG account. *(Proves `instagram_basic`.)*

**[01:50] `instagram_content_publish` — post to IG:**
- Tick the box, click **Publish now**, show the confirmation.

**[02:05] Show it on Instagram:**
- Open the IG profile and show the post is live. *(Proves `instagram_content_publish`.)*

**[02:15] Close:**
- "That's the full flow: connect a Page, publish to Facebook and Instagram, and view engagement.
  Thank you."

---

## 4. Reviewer test instructions (paste in "Instructions for reviewer")

> 1. Go to https://socialpilotai-bay.vercel.app and log in:
>    - Username: `<REVIEWER_TEST_USERNAME>`
>    - Password: `<REVIEWER_TEST_PASSWORD>`
> 2. Open **Organization → Overview → Facebook connections** and click **Connect** next to a center
>    (or use this connect link: `<A FRESH /connect/... LINK>`).
> 3. Complete Facebook Login and select a Page you manage — the app shows your Pages (`pages_show_list`).
> 4. Open **AI Content Studio**, click **Generate**, then **Publish now** — the post publishes to your
>    Page (`pages_manage_posts`). A "View post" link confirms it.
> 5. Open **Analytics** to see the Page's reach and engagement (`pages_read_engagement`).
> 6. (Instagram) If your Page has a linked Instagram Business account, tick "Also post to Instagram" in
>    the Studio and Publish — it posts to the linked IG account (`instagram_basic`,
>    `instagram_content_publish`).
>
> Notes: The app never collects Facebook passwords — connection is via Facebook Login only. Page access
> tokens are stored encrypted and used solely to publish content the user creates and to read that
> Page's engagement.

Create a dedicated **reviewer test login** in SocialPilot before submitting, and generate a **fresh
connect link** (they expire in 14 days) right before you submit.

---

## 5. Data handling & privacy (for the Data Use questions)

- **What we access:** the user's list of Pages, a Page access token, the ability to publish posts to the
  user-selected Page, that Page's engagement metrics, and (optional) the linked IG account id/username +
  publish capability.
- **Why:** to publish content the user creates and show them how it performed.
- **Storage:** Page access tokens are stored **encrypted at rest** (AES) in our database, scoped to the
  user's account. We never store Facebook passwords.
- **Retention/deletion:** the user can disconnect at any time (Settings → disconnect), which deletes the
  stored tokens. Data handling follows our Privacy Policy:
  https://socialpilotai-bay.vercel.app/privacy
- **No sharing:** Page data is not sold or shared with third parties.

---

## 6. Common rejection reasons — avoid these

- Video doesn't actually *show* the permission being used (e.g., claims publishing but never shows a post
  appearing on the Page). Show the result on Facebook/Instagram each time.
- App in demo mode / feature not reachable by the reviewer. Verify `NEXT_PUBLIC_DEMO_MODE=false` and that
  the reviewer login can reach the connect + publish + analytics screens.
- Requesting Instagram permissions but the demo Page has no linked IG account. Either link one or drop
  the IG permissions from this round.
- Business Verification incomplete.
- Privacy Policy URL missing/irrelevant.
