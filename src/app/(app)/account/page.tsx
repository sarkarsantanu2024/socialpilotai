import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentUser } from "@/lib/access";
import { redirect } from "next/navigation";
import { AccountClient } from "./AccountClient";

// Personal account page — every logged-in user (owner, manager, staff, super-admin)
// can edit their own name, email and password here. No center/tenant required.
export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");

  const roleLabel =
    user.platformRole === "superadmin" ? "Super-admin"
    : user.memberships.some((m) => m.role === "owner") ? "Owner / HO"
    : user.memberships[0]?.role === "manager" ? "Center manager"
    : user.memberships[0]?.role === "staff" ? "Staff"
    : "Member";

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        subtitle="Your personal account — name, email and password. This is separate from your business/center settings."
      />
      <AccountClient
        initial={{ name: user.name ?? "", username: user.username, email: user.email ?? "", role: roleLabel }}
      />
    </div>
  );
}
