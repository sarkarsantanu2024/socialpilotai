// Resolve the ACTIVE CENTER (a Tenant, with its business profile + brand kit)
// for the logged-in user, honouring their role (super-admin / owner / manager).
// Server-only. `requireTenant` redirects to /login when there is no valid
// session; if the user is signed in but has no center yet it sends them to the
// no-centers landing instead of looping back to /login.
import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, resolveActiveCenterId } from "@/lib/access";

export type TenantWithBrand = NonNullable<Awaited<ReturnType<typeof getCurrentTenant>>>;

export async function getCurrentTenant() {
  const user = await getCurrentUser();
  if (!user) return null;
  const centerId = await resolveActiveCenterId(user);
  if (!centerId) return null;
  return prisma.tenant.findUnique({
    where: { id: centerId },
    include: { businessProfile: true, brandKit: true },
  });
}

export async function requireTenant() {
  const user = await getCurrentUser();
  // A present-but-unresolvable session (e.g. a stale pre-Phase-1 cookie) would
  // otherwise ping-pong /dashboard ⇄ /login forever, because the Edge middleware
  // only checks that a cookie EXISTS. Route through a handler that clears the
  // cookie first, so the user lands cleanly on /login.
  if (!user) redirect("/api/session/clear");
  const centerId = await resolveActiveCenterId(user);
  // Super-admins without a center get the platform console; others get a
  // friendly "no centers" screen.
  if (!centerId) redirect(user.platformRole === "superadmin" ? "/admin" : "/no-centers");
  const tenant = await prisma.tenant.findUnique({
    where: { id: centerId },
    include: { businessProfile: true, brandKit: true },
  });
  if (!tenant) redirect(user.platformRole === "superadmin" ? "/admin" : "/no-centers");
  return tenant;
}
