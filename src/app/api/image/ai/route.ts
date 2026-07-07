import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/currentTenant";
import { generateImage } from "@/lib/ai";
import { planForCenter } from "@/lib/billing";
import { isPro } from "@/lib/plans";
import type { BusinessType } from "@/lib/types";

// Real AI image generation (Google Imagen) — a PRO feature. Returns a data URL
// that the Studio previews and that can be published to Facebook directly
// (bytes uploaded via multipart, no external hosting needed).
export async function POST(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Gate to paid Pro plan.
  const plan = await planForCenter(tenant.id);
  if (!isPro(plan)) {
    return NextResponse.json(
      { error: "AI image generation is a Pro feature.", upgrade: true },
      { status: 403 }
    );
  }

  const b = await req.json().catch(() => ({}));
  const bp = tenant.businessProfile;
  const profile = {
    id: bp?.id ?? "biz",
    name: bp?.name ?? tenant.name ?? "Your business",
    type: (bp?.type ?? "coaching") as BusinessType,
    city: bp?.city ?? "",
    language: bp?.language ?? "English",
    tone: bp?.tone ?? "Warm, friendly, professional",
    audience: bp?.audience ?? "Local customers",
  };

  const image = await generateImage({ prompt: String(b.prompt ?? ""), profile });
  if (!image) {
    // hasGemini() true but Imagen returned nothing → almost always billing not enabled.
    return NextResponse.json(
      { error: "Couldn't generate an image. Imagen needs billing enabled on your Google AI project." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, image });
}
