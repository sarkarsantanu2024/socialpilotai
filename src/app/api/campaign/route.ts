import { NextResponse } from "next/server";
import { createPausedCampaign, type AdsCtx } from "@/lib/meta";
import { adAccount } from "@/lib/demo/data";
import { getClientSamples } from "@/lib/clientData";
import { getConnection, activePage } from "@/lib/fb/session";

// Creating a campaign from an approved recommendation.
// INVARIANT: always returns status=PAUSED. Real Marketing API call when an ad
// account is connected (premium); demo mock otherwise.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const rec = getClientSamples().recommendations.find((r) => r.id === body.recId);
  if (!rec) {
    return NextResponse.json({ error: "recommendation not found" }, { status: 404 });
  }

  const conn = getConnection();
  const page = activePage(conn);
  const ads: AdsCtx | undefined =
    conn?.adAccountId && conn.userToken
      ? { adAccountId: conn.adAccountId, userToken: conn.userToken, pageId: page?.id }
      : undefined;

  const { campaign } = await createPausedCampaign(
    { ...rec, dailyBudget: body.dailyBudget ?? rec.dailyBudget, days: body.days ?? rec.days },
    adAccount.isSandbox,
    ads
  );
  return NextResponse.json({ campaign, live: !!ads });
}
