import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsClient } from "./SettingsClient";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Your business profile and brand kit power every AI generation. Manage your Facebook connection and plan here."
      />
      <SettingsClient />
    </div>
  );
}
