// Simulate a test lead (Meta Lead Ads Testing Tool style) — persisted to the
// tenant's DB so it survives reloads and shows real cost-per-lead.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/currentTenant";

export async function POST(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const lead = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      name: String(b.name ?? "Test Lead"),
      phone: b.phone ?? null,
      email: b.email ?? null,
      interest: b.interest ?? "Enquiry",
      isTest: true,
    },
  });
  return NextResponse.json({
    ok: true,
    lead: {
      id: lead.id,
      campaignId: lead.campaignId ?? "",
      campaignName: "Test lead",
      name: lead.name,
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      interest: lead.interest ?? "",
      createdAt: lead.createdAt.toISOString(),
      isTest: true,
    },
  });
}
