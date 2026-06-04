// ───────────────────────────────────────────────────────────────
// ai/ — single service wrapping Google Gemini (Flash-Lite) with a
// MOCK LAYER. In DEMO_MODE (or when GEMINI_API_KEY is missing) every
// function returns realistic fake data instantly. Swap in the real
// fetch() calls behind the same signatures for production.
// ───────────────────────────────────────────────────────────────
import { hasGemini } from "@/lib/config";
import type { BusinessProfile, PostVariation } from "@/lib/types";

export interface GenerateInput {
  prompt: string;
  profile: BusinessProfile;
  type: "image" | "video" | "reel" | "text";
  tone?: string;
}

// ---- MOCK LAYER ---------------------------------------------------

const HASHTAG_BANK = [
  "#PuneCoaching", "#StudySmart", "#BoardExams", "#FreeDemoClass",
  "#BrightMinds", "#ExamTips", "#Class10", "#Class12", "#Parenting",
  "#Education", "#TopperTips", "#AdmissionsOpen",
];

const MUSIC_BANK = [
  "Upbeat motivational — 'Rise Up' (royalty-free)",
  "Trending lo-fi — 'Focus Flow'",
  "Warm acoustic — 'Sunny Day' (royalty-free)",
  "Celebratory — 'Champions' (royalty-free)",
];

function pick<T>(arr: T[], n: number, seed: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(seed + i * 3) % arr.length]);
  return Array.from(new Set(out));
}

function mockGenerate(input: GenerateInput): PostVariation[] {
  const { prompt, profile, type } = input;
  const seed = prompt.length;
  const base = prompt.trim() || "your offer";

  const variations: Array<Pick<PostVariation, "title" | "caption" | "cta">> = [
    {
      title: `${capitalize(base)} — limited seats`,
      caption: `🎯 ${capitalize(base)}! At ${profile.name}, we make it simple and effective. Trusted by parents across ${profile.city}. Don't miss out — only a few spots left this week!`,
      cta: "Book now",
    },
    {
      title: `Why ${profile.city} chooses us`,
      caption: `✨ Looking for ${base.toLowerCase()}? Here's why families in ${profile.city} trust ${profile.name}: small batches, real results, and teachers who care. Message us to know more! 💬`,
      cta: "Message us",
    },
    {
      title: `${capitalize(base)} (free demo inside)`,
      caption: `🆓 Curious about ${base.toLowerCase()}? Come see it for yourself with a FREE demo at ${profile.name}. ${profile.tone.split(",")[0]} guidance, every step of the way.`,
      cta: "Get free demo",
    },
  ];

  return variations.map((v, i) => ({
    id: `var_${i + 1}`,
    title: v.title,
    caption: v.caption,
    hashtags: pick(HASHTAG_BANK, 5, seed + i),
    music:
      type === "reel" || type === "video"
        ? MUSIC_BANK[(seed + i) % MUSIC_BANK.length]
        : "—",
    cta: v.cta,
  }));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---- PUBLIC API ---------------------------------------------------

export async function generateVariations(
  input: GenerateInput
): Promise<PostVariation[]> {
  if (!hasGemini()) {
    // simulate model latency for a realistic demo feel
    await delay(900);
    return mockGenerate(input);
  }
  // Real path (production): call Gemini, parse JSON, map to PostVariation[].
  // const res = await fetch(`https://generativelanguage.googleapis.com/...`)
  throw new Error("Real Gemini path not configured in this demo build.");
}

// ---- IMAGE GENERATION --------------------------------------------
// The demo generates real images for FREE via Pollinations.ai directly in the
// browser (see aiImageUrl() in StudioClient.tsx) — no key, no cost. This server
// path is the PAID production upgrade: higher quality, reliability and control.
// Wire one in here and return its URL; the UI uses it in place of the gradient.
//
// Recommended providers (approx, Jan 2026 list pricing):
//   • Google Imagen 3 (via Gemini API)  ~$0.03 / image   — best price/quality, same SDK as captions
//   • OpenAI gpt-image-1                ~$0.04 / image    — strong text-in-image rendering
//   • Stability AI SD3.5 (API)          ~$0.04 / image    — cheap, self-hostable
//   • fal.ai / Replicate (FLUX.1)       ~$0.003–0.05/img  — pay-per-second, good for batches
// Budget tip: 3 variations × ~$0.03 ≈ $0.09 (~₹8) per generate click.
export async function generateImage(_input: {
  prompt: string;
  profile: BusinessProfile;
}): Promise<string | null> {
  if (!hasGemini()) {
    // Demo: no real generation — the UI falls back to the branded template.
    await delay(600);
    return null;
  }
  // Production path (example — Imagen 3 via Gemini):
  //   const res = await fetch(
  //     `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${process.env.GEMINI_API_KEY}`,
  //     { method: "POST", headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ instances: [{ prompt: buildBrandedPrompt(_input) }], parameters: { sampleCount: 1 } }) }
  //   );
  //   const data = await res.json();
  //   return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
  throw new Error("Real image generation not configured in this demo build.");
}

export async function generateReport(summary: {
  topPost: string;
  reach: number;
  engagementRate: number;
  growth: number;
}): Promise<string> {
  if (!hasGemini()) {
    await delay(700);
    return `📈 Great fortnight! Your reach grew **${summary.growth}%** and your best post — "${summary.topPost}" — drove an engagement rate of **${summary.engagementRate}%**, well above your page average. Reels are clearly resonating with parents. Recommendation: keep posting short study-tip reels twice a week, and consider promoting your top reel for lead generation while interest is high.`;
  }
  throw new Error("Real Gemini path not configured in this demo build.");
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
