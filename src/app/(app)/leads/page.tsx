import { PageHeader } from "@/components/ui/PageHeader";
import { LeadsClient } from "./LeadsClient";
import { getClientData } from "@/lib/clientData";

export default async function LeadsPage() {
  const { leads } = await getClientData();
  return (
    <div className="space-y-6">
      <PageHeader
        phase="Leads & follow-up"
        title="Leads"
        subtitle="Every enquiry in one place — move it through your pipeline, add notes, and follow up on WhatsApp in one tap."
      />
      <LeadsClient initial={leads} />
    </div>
  );
}
