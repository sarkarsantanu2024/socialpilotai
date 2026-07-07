import { PageHeader } from "@/components/ui/PageHeader";
import { AdsClient } from "./AdsClient";
import { getClientData } from "@/lib/clientData";

export default async function AdsPage() {
  const { recommendations } = await getClientData();
  return (
    <div className="space-y-6">
      <PageHeader
        phase="Promote"
        title="Boost recommendations"
        subtitle="AI ranks your posts by real performance and recommends your best one to promote — with a suggested budget and audience. Boost it on Facebook in one tap; you pay Facebook directly."
      />
      <AdsClient initial={recommendations} />
    </div>
  );
}
