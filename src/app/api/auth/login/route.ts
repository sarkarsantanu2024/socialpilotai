import { NextResponse } from "next/server";
import { verifyLogin } from "@/lib/authService";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { username, password } = (await req.json()) ?? {};
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }
    const tenant = await verifyLogin(username, password);
    if (!tenant) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }
    setSessionCookie(tenant.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
