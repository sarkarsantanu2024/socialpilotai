import { NextResponse } from "next/server";
import { createAccount } from "@/lib/authService";

// Creates the account but does NOT auto-login — the client sends the user to
// /login to sign in (classic register → login flow).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, business, username, email, password, type, city } = body ?? {};
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }
    await createAccount({ name, business, username, email, password, type, city });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
