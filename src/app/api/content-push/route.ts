import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/access";
import { pushContent, listPushes } from "@/lib/contentPush";
import { notifyMany } from "@/lib/notify";
import { audit } from "@/lib/audit";

// GET: recent pushes (with approval progress). POST: compose & push to centers.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const orgId = new URL(req.url).searchParams.get("orgId") ?? undefined;
  return NextResponse.json({ pushes: await listPushes(user, orgId) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const res = await pushContent(user, body);
    // Notify each target center + record in the org's activity log.
    await notifyMany(res.centerIds, {
      title: "New content from Head Office",
      body: `"${(body.title || body.caption || "Content").slice(0, 60)}" is waiting for your approval.`,
      type: "approval",
      href: "/approvals",
    });
    await audit({
      organizationId: res.orgId,
      actorUserId: user.id,
      actorName: user.name ?? user.username,
      action: "content.push",
      detail: `Pushed "${(body.title || body.caption || "content").slice(0, 60)}" to ${res.pushed} center${res.pushed === 1 ? "" : "s"}`,
    });
    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
