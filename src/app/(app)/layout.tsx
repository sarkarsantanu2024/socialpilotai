import { AppShell } from "@/components/layout/AppShell";
import { BrandProvider, type InitialBrand } from "@/lib/brand/store";
import { getCurrentTenant } from "@/lib/currentTenant";
import { getCurrentUser } from "@/lib/access";
import { toBrand } from "@/lib/store";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

// Placeholder brand for an owner/super-admin who has no center yet — lets them
// into the shell to create their first center from Organization, instead of
// dead-ending on /no-centers. Replaced by the real brand once a center exists.
const FALLBACK_BRAND: InitialBrand = {
  tenantId: "",
  profile: { id: "biz", name: "Your organization", type: "coaching", city: "", language: "English", tone: "Warm, friendly, professional", audience: "Local customers" },
  kit: { logoText: "Your Brand", primary: "#244fdb", secondary: "#0ea5e9", accent: "#f59e0b", font: "Poppins" },
};

// Server component: resolves the logged-in tenant, then seeds the client
// BrandProvider with the tenant's REAL profile + brand kit.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");

  const tenant = await getCurrentTenant();
  if (tenant) {
    return (
      <BrandProvider initial={toBrand(tenant)}>
        <AppShell>{children}</AppShell>
      </BrandProvider>
    );
  }

  // No active center yet. Super-admins run the platform console; an OWNER still
  // gets the shell so they can add their first center from Organization; only
  // managers/staff (who can't create centers) see the friendly no-centers screen.
  if (user.platformRole === "superadmin") redirect("/admin");
  const ownerMembership = user.memberships.find((m) => m.role === "owner");
  if (!ownerMembership) redirect("/no-centers");
  // Head-office mode (or no centers yet): show the HEAD-OFFICE brand — org name +
  // the HO default brand kit — so operating org-wide reads as head office.
  const org = await prisma.organization.findUnique({
    where: { id: ownerMembership.organizationId },
    select: { name: true, vertical: true, logoUrl: true, logoText: true, primary: true, secondary: true, accent: true, font: true },
  });
  const k = FALLBACK_BRAND.kit;
  const initial: InitialBrand = {
    tenantId: "",
    profile: { ...FALLBACK_BRAND.profile, name: org?.name ?? FALLBACK_BRAND.profile.name, type: (org?.vertical as InitialBrand["profile"]["type"]) ?? FALLBACK_BRAND.profile.type },
    kit: {
      logoText: org?.logoText || org?.name?.slice(0, 24) || k.logoText,
      logo: org?.logoUrl ?? undefined,
      primary: org?.primary || k.primary,
      secondary: org?.secondary || k.secondary,
      accent: org?.accent || k.accent,
      font: org?.font || k.font,
    },
  };
  return (
    <BrandProvider initial={initial}>
      <AppShell>{children}</AppShell>
    </BrandProvider>
  );
}
