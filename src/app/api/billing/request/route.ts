import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/access";
import { createPaymentRequest } from "@/lib/billing";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const r = await createPaymentRequest(user, { plan: body.plan, upiRef: body.upiRef, screenshot: body.screenshot });
    return NextResponse.json({ ok: true, id: r.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
