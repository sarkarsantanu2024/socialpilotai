import { AppShell } from "@/components/layout/AppShell";
import { BrandProvider } from "@/lib/brand/store";
import { requireTenant } from "@/lib/currentTenant";
import { toBrand } from "@/lib/store";

// Server component: resolves the logged-in tenant (redirects to /login if none),
// then seeds the client BrandProvider with the tenant's REAL profile + brand kit.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const tenant = await requireTenant();
  const initial = toBrand(tenant);
  return (
    <BrandProvider initial={initial}>
      <AppShell>{children}</AppShell>
    </BrandProvider>
  );
}
