import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/lib/currentTenant";
import { getCurrentUser } from "@/lib/access";
import { OnboardingClient } from "./OnboardingClient";

// Guided setup shown right after a business owner's first login. Super-admins
// (no center of their own) are sent to the platform console instead.
export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (user?.platformRole === "superadmin") redirect("/admin");
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/dashboard");
  if (tenant.onboarded) redirect("/dashboard");

  const bp = tenant.businessProfile;
  return (
    <OnboardingClient
      initial={{
        name: bp?.name ?? tenant.name ?? "",
        type: bp?.type ?? "coaching",
        city: bp?.city ?? "",
        audience: bp?.audience ?? "",
        language: bp?.language ?? "English",
      }}
    />
  );
}
