import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionTenantId } from "@/lib/session";

// Marks the active center's setup wizard as complete.
export async function POST() {
  const tenantId = getSessionTenantId();
  if (tenantId) await prisma.tenant.update({ where: { id: tenantId }, data: { onboarded: true } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
