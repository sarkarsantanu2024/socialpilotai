import { Plane, Facebook, AlertTriangle, ShieldCheck } from "lucide-react";
import { verifyConnectToken } from "@/lib/fb/connectToken";
import { prisma } from "@/lib/db";

// PUBLIC page (see middleware). A branch owner opens this from a WhatsApp/link the
// Head Office sent, and connects THEIR OWN Facebook Page to their center — no
// login, no Business-Manager admin dance. The signed token names the center.
export default async function ConnectPage({ params }: { params: { token: string } }) {
  const v = verifyConnectToken(params.token);
  const center = v
    ? await prisma.tenant.findUnique({ where: { id: v.centerId }, include: { businessProfile: true } })
    : null;
  const name = center?.businessProfile?.name ?? center?.name ?? null;

  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white">
            <Plane className="h-5 w-5 -rotate-45" />
          </span>
          <span className="text-lg font-bold tracking-tight">SocialPilot<span className="text-brand-600"> AI</span></span>
        </div>

        {!v || !center ? (
          <div className="card p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-xl font-bold">This link has expired</h1>
            <p className="mt-2 text-sm text-ink-500">
              Connect links are valid for a limited time. Please ask your Head Office to send you a fresh link.
            </p>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Facebook className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-xl font-bold">Connect {name}&apos;s Facebook Page</h1>
            <p className="mt-2 text-sm text-ink-500">
              Sign in with the Facebook account that manages <b>{name}</b>&apos;s Page and choose it — that&apos;s it.
              We&apos;ll publish posts to your Page on your behalf. We never see your password.
            </p>

            <a href={`/api/auth/facebook?connect=${encodeURIComponent(params.token)}`} className="btn-primary mt-6 w-full py-3 text-base">
              <Facebook className="h-5 w-5" /> Connect with Facebook
            </a>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure connection via Facebook — you can disconnect anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
