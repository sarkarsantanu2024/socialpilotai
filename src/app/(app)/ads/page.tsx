import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdsClient } from "./AdsClient";
import { getClientData } from "@/lib/clientData";
import { getCurrentTenant } from "@/lib/currentTenant";
import { planForCenter } from "@/lib/billing";
import { can } from "@/lib/plans";

export default async function AdsPage() {
  const tenant = await getCurrentTenant();
  const plan = tenant ? await planForCenter(tenant.id) : "trial";

  return (
    <div className="space-y-6">
      <PageHeader
        phase="Promote"
        title="Boost recommendations"
        subtitle="AI ranks your posts by real performance and recommends your best one to promote — with a suggested budget and audience. Boost it on Facebook in one tap; you pay Facebook directly."
      />
      {can(plan, "ads") ? (
        <AdsClient initial={(await getClientData()).recommendations} />
      ) : (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Sparkles className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-bold">Ad decisioning is a paid feature</h2>
          <p className="max-w-md text-sm text-ink-500">
            Upgrade to <b>Single Center</b> or <b>Head Office</b> to let AI pick your best post to
            promote, suggest a budget &amp; audience, and boost it on Facebook in one tap.
          </p>
          <Link href="/billing" className="btn-primary mt-1">
            See plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
