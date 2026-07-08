import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentUser } from "@/lib/access";
import { getOrgOverview } from "@/lib/org";
import { OrganizationClient } from "./OrganizationClient";

// Management console for an HO owner / super-admin: add centers (single or bulk)
// and invite people. Center-only managers are sent back to the dashboard.
export default async function OrganizationPage({ searchParams }: { searchParams: { tab?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");
  const overview = await getOrgOverview(user);
  if (!overview) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader
        phase="Head office · all centers"
        title={`${overview.org.name} — HO console`}
        subtitle="Your head-office cockpit: see every center at a glance, push content to branches, add centers, and invite managers or staff. To work inside one center, switch to it from the selector in the top bar."
      />
      <OrganizationClient initial={overview} initialTab={searchParams.tab} />
    </div>
  );
}
