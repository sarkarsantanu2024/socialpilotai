// Generates DEMO_GUIDE.pdf with a screenshot of every screen.
// Usage:
//   1) keep the app running:  npm run dev   (http://localhost:3001)
//   2) one-time:              npm i -D playwright && npx playwright install chromium
//   3) build the PDF:         npm run demo:pdf
//
// It logs in as a demo client, screenshots each feature, and prints a PDF.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.DEMO_BASE || "http://localhost:3001";
const OUT_DIR = path.resolve("demo-assets");
fs.mkdirSync(OUT_DIR, { recursive: true });

// Each step: route + heading + explanation shown under the screenshot.
const STEPS = [
  { route: "/dashboard", title: "1. Dashboard", desc: "The automated loop at a glance — reach, engagement, leads, and an AI-written performance summary." },
  { route: "/studio", title: "2. AI Content Studio", desc: "Pick a Facebook format, describe the offer, and generate a branded post with image, caption, hashtags and music.", generate: true },
  { route: "/intelligence", title: "3. Content Intelligence — Festival posts", desc: "Ready-made, editable festival posts auto-stamped with the client's brand. Edit caption/hashtags and choose the format." },
  { route: "/calendar", title: "4. Content Calendar", desc: "Plan and schedule a month of posts." },
  { route: "/posts", title: "5. Posts & Publishing", desc: "Drafts, scheduled and published posts." },
  { route: "/analytics", title: "6. Performance Analytics", desc: "Reach, engagement, best posting times and an AI report." },
  { route: "/ads", title: "7. Ad Recommendations", desc: "AI recommends what to promote — objective, audience, budget — for one-tap approval." },
  { route: "/campaigns", title: "8. Campaigns", desc: "Running ads (always created paused / sandbox-safe)." },
  { route: "/leads", title: "9. Leads", desc: "Captured lead-form submissions with cost-per-lead." },
  { route: "/settings", title: "10. Settings & Facebook connect", desc: "Business profile, brand kit + logo upload, and real Facebook Page connection." },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// Log in as the first demo client.
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
const clientBtn = page.locator("text=Continue as a demo client").first();
try {
  await page.locator("button:has-text('MMA Abacus'), button:has-text('Iron Forge'), button:has-text('Tiny Tots')").first().click({ timeout: 5000 });
} catch {
  // Fallback: demo credentials
  await page.fill("#email", "demo@socialpilot.ai");
  await page.fill("#password", "demo1234");
  await page.click("button[type=submit]");
}
await page.waitForURL("**/dashboard", { timeout: 15000 }).catch(() => {});

const shots = [];
for (const step of STEPS) {
  try {
    await page.goto(`${BASE}${step.route}`, { waitUntil: "networkidle", timeout: 30000 });
    await wait(1500);
    if (step.generate) {
      // Trigger a generation so the screenshot shows a real post.
      await page.locator(".chip, button:has-text('workshop'), button:has-text('demo')").first().click().catch(() => {});
      await page.locator("button:has-text('Generate')").first().click().catch(() => {});
      await wait(6000); // let text + image load
    }
    const file = path.join(OUT_DIR, `${step.route.replace(/\W+/g, "_")}.png`);
    await page.screenshot({ path: file, fullPage: true });
    shots.push({ ...step, file });
    console.log("captured", step.route);
  } catch (e) {
    console.warn("skip", step.route, e.message);
  }
}

// Build a printable HTML report and render it to PDF.
const html = `<!doctype html><meta charset="utf-8"><style>
  body{font-family:system-ui,Segoe UI,Roboto,sans-serif;color:#0f172a;margin:0}
  .cover{height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:linear-gradient(135deg,#244fdb,#0ea5e9);color:#fff}
  .cover h1{font-size:44px;margin:0}.cover p{opacity:.9}
  section{page-break-before:always;padding:32px 40px}
  h2{color:#244fdb;font-size:22px;margin:0 0 4px}
  p.desc{color:#475569;margin:0 0 16px}
  img{width:100%;border:1px solid #e2e8f0;border-radius:12px}
</style>
<div class="cover"><h1>SocialPilot AI</h1><p>Product Demo Guide — step by step</p></div>
${shots.map((s) => `<section><h2>${s.title}</h2><p class="desc">${s.desc}</p><img src="file://${s.file.replace(/\\/g, "/")}"></section>`).join("")}`;

const htmlPath = path.join(OUT_DIR, "demo-guide.html");
fs.writeFileSync(htmlPath, html);
await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
await page.pdf({ path: "DEMO_GUIDE.pdf", format: "A4", printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
await browser.close();
console.log("\n✅ Wrote DEMO_GUIDE.pdf");
