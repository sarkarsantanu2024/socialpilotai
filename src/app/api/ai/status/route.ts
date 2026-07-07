import { NextResponse } from "next/server";
import { hasGemini } from "@/lib/config";

// Live-but-cached Gemini health probe. A tiny request tells us whether the key
// works, is rate-limited (429/RESOURCE_EXHAUSTED), or misconfigured — so the UI
// can honestly show why AI output might be a template fallback. Cached ~5 min so
// we don't burn quota on every page load.
const g = globalThis as unknown as { __aiStatus?: { t: number; data: unknown } };
const CACHE_MS = 5 * 60 * 1000;

export async function GET() {
  const model = process.env.GEMINI_TEXT_MODEL ?? "gemini-2.0-flash";

  if (!hasGemini()) {
    return NextResponse.json({ status: "not_configured", model });
  }

  const now = Date.now();
  if (g.__aiStatus && now - g.__aiStatus.t < CACHE_MS) {
    return NextResponse.json({ ...(g.__aiStatus.data as object), cached: true });
  }

  let status: "ok" | "rate_limited" | "error" = "ok";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "hi" }] }], generationConfig: { maxOutputTokens: 1 } }),
        cache: "no-store",
      }
    );
    const data = await res.json().catch(() => ({}));
    if (res.status === 429 || data?.error?.status === "RESOURCE_EXHAUSTED") status = "rate_limited";
    else if (!res.ok || data?.error) status = "error";
  } catch {
    status = "error";
  }

  const out = { status, model };
  g.__aiStatus = { t: now, data: out };
  return NextResponse.json(out);
}
