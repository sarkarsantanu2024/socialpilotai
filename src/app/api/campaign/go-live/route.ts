import { NextResponse } from "next/server";
import { FB_GRAPH_VERSION } from "@/lib/config";
import { getConnection } from "@/lib/fb/session";
import { getCurrentTenant } from "@/lib/currentTenant";
import { prisma } from "@/lib/db";

const GRAPH = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;

// Mark the tenant's campaign ACTIVE in the DB (matched by its FB campaign id).
async function markActive(fbCampaignId: string) {
  const tenant = await getCurrentTenant();
  if (!tenant) return;
  try {
    await prisma.campaign.updateMany({
      where: { tenantId: tenant.id, fbCampaignId },
      data: { status: "ACTIVE" },
    });
  } catch (e) {
    console.warn("[go-live] DB status update failed:", (e as Error).message);
  }
}

// THE ONLY ACTION THAT CAN SPEND MONEY. Flips a PAUSED campaign to ACTIVE.
// Guardrails (architecture §8): runs on the CLIENT's own ad account, requires a
// funding source + an active account, and only ever after explicit approval.
// Demo / no real ad account → simulated activation that cannot deliver or charge.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const campaignId: string | undefined = body.campaignId;
  if (!campaignId) return NextResponse.json({ ok: false, reason: "missing_campaign" }, { status: 400 });

  const conn = getConnection();

  // No connected ad account → sandbox: nothing real happens, no spend, but we do
  // record the activation in the tenant's history.
  if (!conn?.adAccountId || !conn.userToken) {
    await markActive(campaignId);
    return NextResponse.json({ ok: true, live: false, sandbox: true, status: "ACTIVE" });
  }

  try {
    // 1) Funding + account-status guard. account_status 1 = ACTIVE.
    const acctRes = await fetch(
      `${GRAPH}/${conn.adAccountId}?fields=account_status,funding_source,disable_reason&access_token=${conn.userToken}`,
      { cache: "no-store" }
    );
    const acct = await acctRes.json();
    if (acct.error) return NextResponse.json({ ok: false, reason: acct.error.message });
    if (acct.account_status !== 1 || !acct.funding_source) {
      return NextResponse.json({ ok: false, reason: "not_funded" });
    }

    // 2) Activate the campaign.
    const res = await fetch(`${GRAPH}/${campaignId}`, {
      method: "POST",
      body: new URLSearchParams({ status: "ACTIVE", access_token: conn.userToken }),
    });
    const data = await res.json();
    if (data.error) return NextResponse.json({ ok: false, reason: data.error.message });

    await markActive(campaignId);
    return NextResponse.json({ ok: true, live: true, status: "ACTIVE" });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: (e as Error).message });
  }
}
