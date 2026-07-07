import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentUser } from "@/lib/access";
import { getOrgOverview } from "@/lib/org";
import { OrganizationClient } from "./OrganizationClient";

// Management console for an HO owner / super-admin: add centers (single or bulk)
// and invite people. Center-only managers are sent back to the dashboard.
export default async function OrganizationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");
  const overview = await getOrgOverview(user);
  if (!overview) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader
        phase="Multi-tenant · organization"
        title={overview.org.name}
        subtitle="Add and manage your centers, and invite center owners or staff. Invites let people set their own password — you never share credentials."
      />
      <OrganizationClient initial={overview} />
    </div>
  );
}
