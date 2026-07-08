import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/access";
import { prisma } from "@/lib/db";

// Update the LOGGED-IN user's own account (name, email, password). Available to
// every role — it's personal profile data, not center/org data.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") data.name = body.name.trim() || null;

  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase() || null;
    if (email && email !== user.email) {
      const clash = await prisma.user.findUnique({ where: { email } });
      if (clash && clash.id !== user.id) return NextResponse.json({ error: "That email is already in use." }, { status: 400 });
    }
    data.email = email;
  }

  // Password change requires the current password.
  if (body.newPassword) {
    if (typeof body.newPassword !== "string" || body.newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    if (!body.currentPassword || !(await bcrypt.compare(body.currentPassword, user.password))) {
      return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
    }
    data.password = await bcrypt.hash(body.newPassword, 10);
  }

  if (Object.keys(data).length) await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}
