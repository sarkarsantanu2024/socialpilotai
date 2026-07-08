// Persist Business Profile + Brand Kit edits (from Settings) to Postgres for the
// logged-in tenant. Called by the BrandProvider whenever the owner edits a field.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/currentTenant";
import type { BusinessType } from "@/lib/types";

export async function POST(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { profile, kit } = (await req.json()) ?? {};

  try {
    if (profile) {
      const data: Record<string, unknown> = {};
      if (typeof profile.name === "string") data.name = profile.name;
      if (typeof profile.type === "string") data.type = profile.type as BusinessType;
      if (typeof profile.city === "string") data.city = profile.city;
      if (typeof profile.language === "string") data.language = profile.language;
      if (typeof profile.tone === "string") data.tone = profile.tone;
      if (typeof profile.audience === "string") data.audience = profile.audience;
      // Contact details (editable by the center's own owner/manager too).
      if (typeof profile.ownerName === "string") data.ownerName = profile.ownerName.trim() || null;
      if (typeof profile.phone === "string") data.phone = profile.phone.trim() || null;
      if (typeof profile.whatsapp === "string") data.whatsapp = profile.whatsapp.trim() || null;
      if (typeof profile.address === "string") data.address = profile.address.trim() || null;
      if (typeof profile.locality === "string") data.locality = profile.locality.trim() || null;
      if (typeof profile.email === "string") data.email = profile.email.trim().toLowerCase() || null;
      if (Object.keys(data).length) {
        await prisma.businessProfile.update({ where: { tenantId: tenant.id }, data });
      }
    }
    if (kit) {
      const data: Record<string, unknown> = {};
      if (typeof kit.logoText === "string") data.logoText = kit.logoText;
      if ("logo" in kit) data.logoUrl = kit.logo ?? null;
      if (typeof kit.primary === "string") data.primary = kit.primary;
      if (typeof kit.secondary === "string") data.secondary = kit.secondary;
      if (typeof kit.accent === "string") data.accent = kit.accent;
      if (typeof kit.font === "string") data.font = kit.font;
      if (Object.keys(data).length) {
        await prisma.brandKit.update({ where: { tenantId: tenant.id }, data });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
