import { NextResponse } from "next/server";
import { verifyLogin } from "@/lib/authService";
import { setSession, HO_MODE } from "@/lib/session";
import { firstAccessibleCenterId, isSuperadmin } from "@/lib/access";

export async function POST(req: Request) {
  try {
    const { username, password } = (await req.json()) ?? {};
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }
    const user = await verifyLogin(username, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    // Super-admins have no center of their own → straight to the platform console.
    // Never send them into a customer center's setup wizard.
    if (isSuperadmin(user)) {
      setSession(user.id, null);
      return NextResponse.json({ ok: true, next: "/admin" });
    }

    // Owners / HO start in Head-office mode (org-wide, HO branding) on their
    // Organization console. Managers & staff land on their own center's dashboard.
    const isOwner = user.memberships.some((m) => m.role === "owner");
    if (isOwner) {
      setSession(user.id, HO_MODE);
      return NextResponse.json({ ok: true, next: "/organization" });
    }
    const centerId = await firstAccessibleCenterId(user);
    setSession(user.id, centerId);
    return NextResponse.json({ ok: true, next: "/dashboard" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
