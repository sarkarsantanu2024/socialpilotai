import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/access";
import { revokeInvite } from "@/lib/org";

// Revoke a pending invite.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  try {
    await revokeInvite(user, params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
