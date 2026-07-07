import QRCode from "qrcode";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentUser, isSuperadmin } from "@/lib/access";
import { getCurrentTenant } from "@/lib/currentTenant";
import { orgBilling, listAllPending } from "@/lib/billing";
import { PLANS, upiUri, payee } from "@/lib/plans";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");
  const tenant = await getCurrentTenant();
  const orgId = tenant?.organizationId ?? null;
  const admin = isSuperadmin(user);

  const billing = orgId ? await orgBilling(orgId) : null;
  const pendingAll = admin ? await listAllPending(user) : [];

  // Pre-generate a UPI QR (data URL) per plan.
  const p = payee();
  const qr: Record<string, string> = {};
  for (const plan of PLANS) {
    qr[plan.id] = await QRCode.toDataURL(upiUri(plan.price, `SocialPilot ${plan.name}`), { margin: 1, width: 220 });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        phase="Billing"
        title="Plans & billing"
        subtitle="Upgrade by paying via any UPI app — scan the QR or use the UPI ID. Your plan activates once we confirm the payment."
      />
      <BillingClient
        plans={PLANS}
        qr={qr}
        upi={p}
        billing={billing}
        isSuperadmin={admin}
        pendingAll={pendingAll}
      />
    </div>
  );
}
