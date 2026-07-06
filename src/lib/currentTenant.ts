// Resolve the logged-in tenant (with its business profile + brand kit) from the
// signed session cookie. Server-only. `requireTenant` redirects to /login when
// there is no valid session — defense in depth on top of the middleware.
import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionTenantId } from "@/lib/session";

export type TenantWithBrand = NonNullable<Awaited<ReturnType<typeof getCurrentTenant>>>;

export async function getCurrentTenant() {
  const id = getSessionTenantId();
  if (!id) return null;
  return prisma.tenant.findUnique({
    where: { id },
    include: { businessProfile: true, brandKit: true },
  });
}

export async function requireTenant() {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/login");
  return tenant;
}
