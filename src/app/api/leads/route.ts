// Lead capture + CRM-lite updates for the logged-in center.
//  POST   → add a lead (manual entry, or a simulated test lead)
//  PATCH  → update a lead's pipeline status / notes
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/currentTenant";
import { notify } from "@/lib/notify";

const STATUSES = ["new", "contacted", "enrolled", "lost"];

export async function POST(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const isTest = b.isTest === true;
  const lead = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      name: String(b.name ?? "Lead").slice(0, 120),
      phone: b.phone ?? null,
      email: b.email ?? null,
      interest: b.interest ?? "Enquiry",
      isTest,
      status: "new",
    },
  });
  if (!isTest) {
    await notify(tenant.id, { title: "New lead captured", body: `${lead.name}${lead.interest ? ` — ${lead.interest}` : ""}`, type: "lead", href: "/leads" });
  }
  return NextResponse.json({
    ok: true,
    lead: {
      id: lead.id, campaignId: lead.campaignId ?? "", campaignName: "Lead form",
      name: lead.name, phone: lead.phone ?? "", email: lead.email ?? "", interest: lead.interest ?? "",
      createdAt: lead.createdAt.toISOString(), isTest: lead.isTest, status: lead.status, notes: lead.notes ?? undefined,
    },
  });
}

export async function PATCH(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const data: { status?: string; notes?: string } = {};
  if (typeof b.status === "string" && STATUSES.includes(b.status)) data.status = b.status;
  if (typeof b.notes === "string") data.notes = b.notes;
  // Scoped update — a center can only touch its own leads.
  await prisma.lead.updateMany({ where: { id: b.id, tenantId: tenant.id }, data });
  return NextResponse.json({ ok: true });
}
