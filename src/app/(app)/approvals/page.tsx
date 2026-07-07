import { PageHeader } from "@/components/ui/PageHeader";
import { ApprovalsClient } from "./ApprovalsClient";

// Center inbox: content awaiting approval (pushed by the HO, or staff drafts).
export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        phase="Content governance"
        title="Approvals"
        subtitle="Content sent to this centre — by your Head Office or your staff — waiting for you to approve before it can be published."
      />
      <ApprovalsClient />
    </div>
  );
}
