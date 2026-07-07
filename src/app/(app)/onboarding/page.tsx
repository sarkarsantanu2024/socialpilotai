import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/lib/currentTenant";
import { OnboardingClient } from "./OnboardingClient";

// Guided setup shown right after signup. Skips itself if there's no center
// (super-admin) or the center is already onboarded.
export default async function OnboardingPage() {
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
