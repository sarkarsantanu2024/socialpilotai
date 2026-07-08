import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/access";
import { deleteCenter, updateCenter } from "@/lib/org";
import { audit } from "@/lib/audit";

// Edit a center's details. Owner/HO, super-admin, or that center's own manager.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await updateCenter(user, id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// Permanently remove a center. Owner/HO or super-admin only.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  try {
    const { name } = await deleteCenter(user, id);
    await audit({
      organizationId: user.memberships.find((m) => m.role === "owner")?.organizationId ?? "",
      actorUserId: user.id,
      actorName: user.name ?? user.username,
      action: "center.delete",
      detail: `Removed center "${name}"`,
    });
    return NextResponse.json({ ok: true, name });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
