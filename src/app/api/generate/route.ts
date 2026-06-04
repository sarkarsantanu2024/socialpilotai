import { NextResponse } from "next/server";
import { generateVariations } from "@/lib/ai";
import { businessProfile } from "@/lib/demo/data";
import type { BusinessProfile, PostType } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const prompt: string = body.prompt ?? "";
  const type: PostType = body.type ?? "image";
  // Use the caller's live business profile (edited in Settings); fall back to demo.
  const profile: BusinessProfile = { ...businessProfile, ...(body.profile ?? {}) };

  const variations = await generateVariations({ prompt, type, profile });

  return NextResponse.json({ variations });
}
