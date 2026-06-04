import { PageHeader } from "@/components/ui/PageHeader";
import { StudioClient } from "./StudioClient";

export default function StudioPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        phase="Phase 1 · Content core"
        title="AI Content Studio"
        subtitle="Pick a Facebook format — single image, carousel, reel or video — describe your offer, and get a ready-to-post creative at the right size with caption, hashtags and a music idea."
      />
      <StudioClient />
    </div>
  );
}
