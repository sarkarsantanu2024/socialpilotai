import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/access";
import { decideRequest } from "@/lib/billing";

// Super-admin activates or rejects a pending UPI payment.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    await decideRequest(user, { id: body.id, action: body.action });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
