import { NextResponse } from "next/server";
import { verifyLogin } from "@/lib/authService";
import { setSession } from "@/lib/session";
import { firstAccessibleCenterId, isSuperadmin } from "@/lib/access";
import { prisma } from "@/lib/db";

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

    // Land the session on the user's first accessible center (if any).
    const centerId = await firstAccessibleCenterId(user);
    setSession(user.id, centerId);

    // Only send the OWNER of a fresh, un-onboarded center to the setup wizard —
    // not managers of already-set-up centers.
    let next = "/dashboard";
    const isOwner = user.memberships.some((m) => m.role === "owner");
    if (centerId && isOwner) {
      const t = await prisma.tenant.findUnique({ where: { id: centerId }, select: { onboarded: true } });
      if (t && !t.onboarded) next = "/onboarding";
    }
    return NextResponse.json({ ok: true, next });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
