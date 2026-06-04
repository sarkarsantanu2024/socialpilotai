import { PageHeader } from "@/components/ui/PageHeader";
import { IntelligenceClient } from "./IntelligenceClient";
import { festivals, segmentTemplates } from "@/lib/demo/data";

export default function IntelligencePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        phase="Phase 3 · Content intelligence"
        title="Content Intelligence"
        subtitle="Two ways to never run out of ideas: a shared festival library auto-stamped with your brand, and business-type templates the AI rewrites for your exact profile."
      />
      <IntelligenceClient festivals={festivals} segments={segmentTemplates} />
    </div>
  );
}
