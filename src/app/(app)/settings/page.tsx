import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsClient } from "./SettingsClient";
import { AiStatus } from "@/components/ui/AiStatus";
import { requireTenant } from "@/lib/currentTenant";

export default async function SettingsPage() {
  const tenant = await requireTenant();
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
      />
      <AiStatus />
    </div>
  );
}
