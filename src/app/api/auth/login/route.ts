import { NextResponse } from "next/server";
import { verifyLogin } from "@/lib/authService";
import { setSession } from "@/lib/session";
import { firstAccessibleCenterId } from "@/lib/access";
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
    // Land the session on the user's first accessible center (if any).
    const centerId = await firstAccessibleCenterId(user);
    setSession(user.id, centerId);

    // First-time users land on the setup wizard; everyone else on the dashboard.
    // (Super-admins have no center → dashboard → redirected to /admin.)
    let next = "/dashboard";
    if (centerId) {
      const t = await prisma.tenant.findUnique({ where: { id: centerId }, select: { onboarded: true } });
      if (t && !t.onboarded) next = "/onboarding";
    }
    return NextResponse.json({ ok: true, next });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
