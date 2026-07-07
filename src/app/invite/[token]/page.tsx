import Link from "next/link";
import { Plane } from "lucide-react";
import { getInviteByToken } from "@/lib/org";
import { AcceptInviteClient } from "./AcceptInviteClient";

// Public page: someone opens the invite link and sets their own password. No
// existing session needed — the token is the authorization.
export default async function InvitePage({ params }: { params: { token: string } }) {
  const inv = await getInviteByToken(params.token);

  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white">
            <Plane className="h-5 w-5 -rotate-45" />
          </span>
          <span className="text-lg font-bold tracking-tight">SocialPilot<span className="text-brand-600"> AI</span></span>
        </div>

        {!inv ? (
          <div className="card p-8 text-center">
            <h1 className="text-xl font-bold">Invite not valid</h1>
            <p className="mt-2 text-sm text-ink-500">This invite link is invalid, already used, or has expired. Ask whoever invited you to send a new one.</p>
            <Link href="/login" className="btn-ghost mt-6 text-sm">Go to login</Link>
          </div>
        ) : (
          <AcceptInviteClient
            token={params.token}
            orgName={inv.organization.name}
            role={inv.role}
            centerName={inv.center?.businessProfile?.name ?? null}
            email={inv.email}
          />
        )}
      </div>
    </div>
  );
}
