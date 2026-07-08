import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsClient } from "./SettingsClient";
import { AiStatus } from "@/components/ui/AiStatus";
import { getCurrentTenant } from "@/lib/currentTenant";
import { getCurrentUser } from "@/lib/access";

export default async function SettingsPage() {
  // Settings edits the ACTIVE center. In Head-office mode (no center) an owner is
  // sent to HO Settings; managers/staff without a center see the no-centers screen.
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");
  const tenant = await getCurrentTenant();
  if (!tenant) {
    redirect(user.memberships.some((m) => m.role === "owner") ? "/organization?tab=settings" : "/no-centers");
  }
  const trialDaysLeft = tenant.trialEndsAt
    ? Math.max(0, Math.ceil((tenant.trialEndsAt.getTime() - Date.now()) / 86_400_000))
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Your business profile and brand kit power every AI generation. Manage your Facebook connection and plan here."
      />
      <SettingsClient
        plan={{
          plan: tenant.plan,
          status: tenant.planStatus,
          trialDaysLeft,
          username: tenant.username,
          email: tenant.email,
        }}
        details={{
          ownerName: tenant.businessProfile?.ownerName ?? "",
          phone: tenant.businessProfile?.phone ?? "",
          whatsapp: tenant.businessProfile?.whatsapp ?? "",
          email: tenant.businessProfile?.email ?? "",
          locality: tenant.businessProfile?.locality ?? "",
          address: tenant.businessProfile?.address ?? "",
        }}
      />
      <AiStatus />
    </div>
  );
}
