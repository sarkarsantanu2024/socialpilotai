// Server-side: which demo client is active (from the sp_tenant cookie set by the
// brand store). Server pages use this to pick the right per-tenant dataset.
import { cookies } from "next/headers";
import { demoTenants } from "@/lib/demo/data";
import { getTenantData, type TenantData } from "@/lib/demo/tenantData";

export function getActiveTenantId(): string {
  const id = cookies().get("sp_tenant")?.value;
  return demoTenants.some((t) => t.id === id) ? id! : demoTenants[0].id;
}

export function activeTenantData(): TenantData {
  return getTenantData(getActiveTenantId());
}
