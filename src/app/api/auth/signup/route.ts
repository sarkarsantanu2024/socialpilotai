import { NextResponse } from "next/server";
import { createTenant } from "@/lib/authService";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, business, username, email, password, type, city } = body ?? {};
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }
    const tenant = await createTenant({ name, business, username, email, password, type, city });
    setSessionCookie(tenant.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
