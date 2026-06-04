import { PageHeader } from "@/components/ui/PageHeader";
import { AdsClient } from "./AdsClient";
import { getClientSamples } from "@/lib/clientData";

export default function AdsPage() {
  const { recommendations } = getClientSamples();
  return (
    <div className="space-y-6">
      <PageHeader
        phase="Phase 5 · Ad decisioning engine"
        title="Ad Recommendations"
        subtitle="AI ranks your posts by performance and recommends which to promote — objective, audience, budget and expected outcome. Edit, approve or reject. Nothing runs without you."
      />
      <AdsClient initial={recommendations} />
    </div>
  );
}
