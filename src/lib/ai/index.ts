// ───────────────────────────────────────────────────────────────
// ai/ — single service wrapping Google Gemini with a MOCK FALLBACK.
// If GEMINI_API_KEY is set (and DEMO_MODE off) we call the real API;
// on ANY failure (bad key, quota, network) we fall back to the mock so
// the app never crashes. This makes the product resilient in production.
// ───────────────────────────────────────────────────────────────
import { hasGemini } from "@/lib/config";
import type { BusinessProfile, PostVariation } from "@/lib/types";

export interface GenerateInput {
  prompt: string;
  profile: BusinessProfile;
  type: "image" | "video" | "reel" | "text";
  tone?: string;
}

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? "gemini-2.0-flash";

// ---- REAL GEMINI CALL --------------------------------------------

async function geminiText(prompt: string, json = false): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("no key");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${key}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
  if (json) body.generationConfig = { responseMimeType: "application/json", temperature: 0.9 };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message ?? "Gemini request failed");
  const text: string =
    data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new Error("Gemini returned empty response");
  return text;
}

// ---- MOCK FALLBACK LAYER -----------------------------------------

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
    await delay(700);
    return mockGenerate(input);
  }
  try {
    const { profile, prompt, type } = input;
    const wantsMusic = type === "reel" || type === "video";
    const sys = `You are a senior social media copywriter for small Indian businesses.
Write 3 DISTINCT Facebook post variations for this business.

Business: ${profile.name}
Type: ${profile.type}
City: ${profile.city}
Audience: ${profile.audience}
Brand tone: ${profile.tone}
Language: ${profile.language} (write in this language; keep it natural, not translated-sounding)

The owner's request/offer: "${prompt || "a general engaging post"}"

Return ONLY a JSON array of exactly 3 objects, each with:
- "title": short punchy headline (max 8 words)
- "caption": 2-4 sentence Facebook caption with 1-2 relevant emojis, warm and local
- "hashtags": array of exactly 5 relevant hashtags (each starting with #, no spaces)
- "cta": a 2-3 word call to action (e.g. "Book now", "Message us")
${wantsMusic ? '- "music": a short royalty-free background music suggestion for a reel' : ""}
No markdown, no commentary — just the JSON array.`;

    const raw = await geminiText(sys, true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) throw new Error("bad shape");
    return parsed.slice(0, 3).map((v, i) => ({
      id: `var_${i + 1}`,
      title: String(v.title ?? "").slice(0, 90) || `Variation ${i + 1}`,
      caption: String(v.caption ?? ""),
      hashtags: Array.isArray(v.hashtags)
        ? v.hashtags.map((h: string) => (h.startsWith("#") ? h : `#${h}`)).slice(0, 5)
        : [],
      music: wantsMusic ? String(v.music ?? MUSIC_BANK[i % MUSIC_BANK.length]) : "—",
      cta: String(v.cta ?? "Learn more"),
    }));
  } catch (e) {
    console.warn("[ai] Gemini generateVariations failed, using fallback:", (e as Error).message);
    return mockGenerate(input);
  }
}

// ---- IMAGE GENERATION --------------------------------------------
// Production image generation via Gemini Imagen. On any failure we return null
// and the UI falls back to its branded gradient template / Pexels stock — so a
// missing image never breaks the flow.
export async function generateImage(input: {
  prompt: string;
  profile: BusinessProfile;
}): Promise<string | null> {
  if (!hasGemini()) {
    await delay(500);
    return null;
  }
  try {
    const key = process.env.GEMINI_API_KEY!;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [
            {
              prompt: `High-quality marketing photo for ${input.profile.name}, a ${input.profile.type} in ${input.profile.city}, India. ${input.prompt}. Bright, professional, social-media ready, no text overlay.`,
            },
          ],
          parameters: { sampleCount: 1, aspectRatio: "1:1" },
        }),
        cache: "no-store",
      }
    );
    const data = await res.json();
    const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) return null;
    return `data:image/png;base64,${b64}`;
  } catch (e) {
    console.warn("[ai] Gemini image generation failed, using template:", (e as Error).message);
    return null;
  }
}

// Festival auto-content: a warm, brand-voice greeting post for an upcoming
// festival, written in the business's own language (vernacular). Falls back to a
// simple template when Gemini is unavailable.
export async function generateFestivalPost(input: {
  festival: { name: string; blurb?: string };
  profile: BusinessProfile;
}): Promise<{ title: string; caption: string; hashtags: string[] }> {
  const { festival, profile } = input;
  const tag = festival.name.replace(/[^a-zA-Z]/g, "").slice(0, 20) || "Festival";
  const fallback = {
    title: `${festival.name} greetings`,
    caption: `🎉 Happy ${festival.name} from ${profile.name}! Wishing all our families in ${profile.city} joy, warmth and success. Thank you for being part of our journey. ✨`,
    hashtags: [`#${tag}`, "#Festival", "#Wishes", `#${(profile.city || "Local").replace(/\s/g, "")}`, "#Celebration"],
  };
  if (!hasGemini()) {
    await delay(500);
    return fallback;
  }
  try {
    const sys = `Write a warm Facebook FESTIVAL GREETING post for this business.

Business: ${profile.name}
Type: ${profile.type}
City: ${profile.city}
Brand tone: ${profile.tone}
Language: ${profile.language} (write naturally in this language, not translated-sounding)

Festival: ${festival.name}${festival.blurb ? ` — ${festival.blurb}` : ""}

Return ONLY a JSON object with:
- "caption": a warm 2-3 sentence greeting with 1-2 relevant emojis, mentioning the business naturally
- "hashtags": array of exactly 5 relevant hashtags (each starting with #, no spaces)
No markdown, no commentary — just the JSON object.`;
    const raw = await geminiText(sys, true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any = JSON.parse(raw);
    return {
      title: `${festival.name} greetings`,
      caption: String(parsed.caption ?? fallback.caption),
      hashtags: Array.isArray(parsed.hashtags)
        ? parsed.hashtags.map((h: string) => (h.startsWith("#") ? h : `#${h}`)).slice(0, 5)
        : fallback.hashtags,
    };
  } catch (e) {
    console.warn("[ai] generateFestivalPost failed, using fallback:", (e as Error).message);
    return fallback;
  }
}

export async function generateReport(summary: {
  topPost: string;
  reach: number;
  engagementRate: number;
  growth: number;
}): Promise<string> {
  const fallback = `📈 Great fortnight! Your reach grew **${summary.growth}%** and your best post — "${summary.topPost}" — drove an engagement rate of **${summary.engagementRate}%**, well above your page average. Recommendation: keep posting short study-tip reels twice a week, and consider promoting your top reel for lead generation while interest is high.`;
  if (!hasGemini()) {
    await delay(600);
    return fallback;
  }
  try {
    const prompt = `You are a friendly marketing analyst writing for a non-technical small business owner.
Write a SHORT (2-3 sentence) plain-language performance summary from these numbers:
- Best post: "${summary.topPost}"
- Reach: ${summary.reach}
- Engagement rate: ${summary.engagementRate}%
- Reach growth vs last period: ${summary.growth}%

Be encouraging, use 1 emoji, use **bold** for the key numbers, and END with one concrete recommendation. No headings, no bullet list — just the paragraph.`;
    return await geminiText(prompt);
  } catch (e) {
    console.warn("[ai] Gemini generateReport failed, using fallback:", (e as Error).message);
    return fallback;
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
