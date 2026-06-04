import { NextResponse } from "next/server";

// Returns N square photos for a post, in priority order:
//   1. CURATED — hand-picked, India-relevant, on-topic Pexels photos per business
//      type (e.g. abacus posts get real abacus-tool photos). Public CDN URLs, so
//      they work with NO key. Best relevance for the demo.
//   2. Pexels search (if PEXELS_API_KEY set) — for custom/unknown types.
//   3. LoremFlickr keyword stock — last-resort free fallback.
// Verified Pexels photo IDs (alt text confirms Indian / on-topic subjects).
const CURATED: Record<string, number[]> = {
  abacus: [8613095, 31864404, 1019470, 8612925, 6692923, 7188764],
  coaching: [35745592, 35745581, 18870256, 35745583, 8617762, 8618062],
  playschool: [4047662, 8612877, 30279471, 17332827, 29279438],
  gym: [5221029, 11661410, 10795063, 13534122, 11439928],
  salon: [17548721, 20826575, 7755209, 11876088, 36874235],
  restaurant: [8818723, 29148133, 17223838, 35008222],
};

const pexelsCdn = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900&h=900&fit=crop`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const type = (searchParams.get("type") || "").trim();
  const n = Math.min(Math.max(parseInt(searchParams.get("n") || "1", 10) || 1, 1), 6);
  const query = q || "small business marketing";

  // 1. Curated pool for known business types — best relevance, no key needed.
  const pool = CURATED[type];
  if (pool && pool.length) {
    // Rotate from a random start so repeated generates vary.
    const start = Math.floor(Math.random() * pool.length);
    const images = Array.from({ length: n }, (_, i) => pexelsCdn(pool[(start + i) % pool.length]));
    return NextResponse.json({ images, source: "curated" });
  }

  // 2. Live Pexels search (custom types). Vary page for variety.
  const page = parseInt(searchParams.get("page") || "", 10) || 1 + Math.floor(Math.random() * 5);
  const key = process.env.PEXELS_API_KEY;
  if (key) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${n}&page=${page}&orientation=square`,
        { headers: { Authorization: key }, cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        const images: string[] = (data.photos || [])
          .map((p: { src?: { large?: string; original?: string } }) => p.src?.large || p.src?.original)
          .filter(Boolean);
        if (images.length) return NextResponse.json({ images, source: "pexels" });
      }
    } catch {
      // network/quota issue — fall through to the free fallback below
    }
  }

  // 3. Free, no-key fallback. `lock` makes each slide deterministic but distinct.
  const keyword = encodeURIComponent(query.split(/\s+/).slice(0, 2).join(",") || "business");
  const images = Array.from(
    { length: n },
    (_, i) => `https://loremflickr.com/768/768/${keyword}?lock=${i + 1}`
  );
  return NextResponse.json({ images, source: "loremflickr" });
}
