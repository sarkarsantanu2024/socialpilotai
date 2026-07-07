import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/currentTenant";
import { generateFestivalPost } from "@/lib/ai";
import type { BusinessType } from "@/lib/types";

// Generate a brand-voice, in-language greeting post for an upcoming festival.
export async function POST(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  if (!b.name) return NextResponse.json({ error: "Festival name is required." }, { status: 400 });

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

  const post = await generateFestivalPost({ festival: { name: b.name, blurb: b.blurb }, profile });
  return NextResponse.json({ ok: true, post });
}
