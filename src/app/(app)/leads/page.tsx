import { Users, IndianRupee, Target, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/Stat";
import { LeadsClient } from "./LeadsClient";
import { getClientData } from "@/lib/clientData";
import { inr } from "@/lib/utils";

export default async function LeadsPage() {
  const { leads, campaigns } = await getClientData();
  // ROI: combine ad spend across the tenant's campaigns with captured leads.
  const spend = campaigns.reduce((s, c) => s + c.spend, 0);
  const costPerLead = leads.length ? spend / leads.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        phase="Phase 6 · Leads & ROI"
        title="Leads"
        subtitle="Lead-form submissions captured via the leadgen webhook, with a real-time ROI report combining ad spend, results and cost-per-lead."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total leads" value={String(leads.length)} delta={{ value: "from sandbox ads", up: true }} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Ad spend" value={inr(spend)} icon={<IndianRupee className="h-5 w-5" />} />
        <StatCard label="Cost per lead" value={inr(costPerLead)} delta={{ value: "below ₹200 target", up: true }} icon={<TrendingDown className="h-5 w-5" />} />
        <StatCard label="Conversion goal" value="Demo class" icon={<Target className="h-5 w-5" />} />
      </div>

      <LeadsClient initial={leads} />
    </div>
  );
}
