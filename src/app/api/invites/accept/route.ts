import { NextResponse } from "next/server";
import { acceptInvite } from "@/lib/org";
import { setSession } from "@/lib/session";

// Accept an invite: the recipient sets their OWN username + password and is
// signed straight in. Public (no session required) — the token is the auth.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { token, username, password, name } = body ?? {};
  if (!token || !username || !password) {
    return NextResponse.json({ error: "token, username and password are required." }, { status: 400 });
  }
  try {
    const { userId, centerId } = await acceptInvite(token, { username, password, name });
    setSession(userId, centerId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
