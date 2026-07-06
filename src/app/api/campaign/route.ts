import { NextResponse } from "next/server";
import { createPausedCampaign, type AdsCtx } from "@/lib/meta";
import { getClientData } from "@/lib/clientData";
import { getConnection, activePage } from "@/lib/fb/session";
import { getCurrentTenant } from "@/lib/currentTenant";
import { prisma } from "@/lib/db";

// Creating a campaign from an approved recommendation.
// INVARIANT: always returns status=PAUSED. Real Marketing API call when an ad
// account is connected (premium); simulated (sandbox) otherwise. Persisted to DB.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const rec = (await getClientData()).recommendations.find((r) => r.id === body.recId);
  if (!rec) {
    return NextResponse.json({ error: "recommendation not found" }, { status: 404 });
  }

  const conn = getConnection();
  const page = activePage(conn);
  const ads: AdsCtx | undefined =
    conn?.adAccountId && conn.userToken
      ? { adAccountId: conn.adAccountId, userToken: conn.userToken, pageId: page?.id }
      : undefined;

  // No connected/funded ad account → sandbox campaign (cannot deliver or charge).
  const isSandbox = !ads;

  const { campaign } = await createPausedCampaign(
    { ...rec, dailyBudget: body.dailyBudget ?? rec.dailyBudget, days: body.days ?? rec.days },
    isSandbox,
    ads
  );

  // Persist the PAUSED campaign to the tenant's history.
  const tenant = await getCurrentTenant();
  if (tenant) {
    try {
      const saved = await prisma.campaign.create({
        data: {
          tenantId: tenant.id,
          name: campaign.name,
          fbCampaignId: campaign.fbCampaignId,
          adsetId: campaign.adsetId,
          adId: campaign.adId,
          objective: campaign.objective,
          status: "PAUSED",
          isSandbox: campaign.isSandbox,
          dailyBudget: campaign.dailyBudget,
          days: campaign.days,
        },
      });
      campaign.id = saved.id;
    } catch (e) {
      console.warn("[campaign] persist failed:", (e as Error).message);
    }
  }

  return NextResponse.json({ campaign, live: !!ads });
}
