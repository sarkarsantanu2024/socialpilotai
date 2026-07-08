import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/access";
import { publishToCenters } from "@/lib/contentPush";
import { notifyMany } from "@/lib/notify";
import { audit } from "@/lib/audit";

// HO / super-admin publishes (or schedules) the SAME content straight to each
// selected center's connected Facebook Page — no branch approval (HO is the
// authority). Centers without a Page are reported as skipped, never dropped.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  try {
    const res = await publishToCenters(user, body);

    // Notify the branches whose Page just received a post (FYI, not a request).
    if (res.centerIds.length) {
      const verb = res.scheduled > 0 && res.published === 0 ? "scheduled" : "published";
      await notifyMany(res.centerIds, {
        title: "Head Office posted to your Page",
        body: `"${(body.title || body.caption || "A post").slice(0, 60)}" was ${verb} to your Facebook Page by Head Office.`,
        type: "publish",
        href: "/posts",
      });
    }

    await audit({
      organizationId: res.orgId,
      actorUserId: user.id,
      actorName: user.name ?? user.username,
      action: "content.ho_publish",
      detail: `Published "${(body.title || body.caption || "content").slice(0, 60)}" to ${res.published + res.scheduled}/${res.results.length} centers (${res.skipped} no-page, ${res.failed} failed)`,
    });

    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
