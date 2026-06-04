import { NextResponse } from "next/server";
import { FB_GRAPH_VERSION, webhookVerifyToken } from "@/lib/config";
import { getPageToken, addLead } from "@/lib/fb/store";
import type { Lead } from "@/lib/types";

const GRAPH = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;

// GET — Meta's webhook verification handshake. Echo hub.challenge if the token matches.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === webhookVerifyToken()) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

// POST — a new Lead Ads submission. Retrieve the full lead via the Graph API
// (using the Page token) and store it. Always 200 quickly so Meta doesn't retry.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;
      const v = change.value ?? {};
      const pageId: string | undefined = v.page_id ?? entry.id;
      const leadgenId: string | undefined = v.leadgen_id;
      const token = pageId ? getPageToken(pageId) : undefined;
      if (!leadgenId || !pageId || !token) continue;

      try {
        const res = await fetch(`${GRAPH}/${leadgenId}?fields=field_data,created_time&access_token=${token}`, { cache: "no-store" });
        const data = await res.json();
        if (data.error) continue;

        const fields: Record<string, string> = {};
        for (const f of data.field_data ?? []) fields[f.name] = (f.values ?? [])[0] ?? "";

        const lead: Lead = {
          id: leadgenId,
          campaignId: v.ad_id ?? "lead_ad",
          campaignName: "Lead Ad",
          name: fields.full_name || fields.name || "Unknown",
          phone: fields.phone_number || fields.phone || "",
          email: fields.email || "",
          interest: fields.interest || fields.job_title || "Lead form submission",
          createdAt: data.created_time ?? new Date().toISOString(),
          isTest: false,
        };
        addLead(pageId, lead);
      } catch {
        /* skip this lead; Meta will not be retried since we 200 below */
      }
    }
  }

  return NextResponse.json({ received: true });
}
