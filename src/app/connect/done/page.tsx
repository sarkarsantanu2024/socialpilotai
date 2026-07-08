import { Plane, CheckCircle2, AlertTriangle } from "lucide-react";

// PUBLIC success/failure page shown after a connect-link OAuth completes.
const MESSAGES: Record<string, { ok: boolean; title: string; body: string }> = {
  connected: { ok: true, title: "Your Page is connected! 🎉", body: "Head Office can now publish to your Facebook Page. You can close this window." },
  no_pages: { ok: false, title: "No Page found", body: "That Facebook account doesn't manage any Page. Sign in with the account that manages your Page and try the link again." },
  expired: { ok: false, title: "Link expired", body: "This connect link is no longer valid. Please ask your Head Office to send a fresh one." },
  denied: { ok: false, title: "Connection cancelled", body: "You didn't finish the Facebook step. Open the link again to retry." },
  token_failed: { ok: false, title: "Something went wrong", body: "We couldn't complete the connection. Please try the link again." },
};

export default function ConnectDone({ searchParams }: { searchParams: { fb?: string } }) {
  const m = MESSAGES[searchParams.fb ?? "connected"] ?? MESSAGES.connected;
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white">
            <Plane className="h-5 w-5 -rotate-45" />
          </span>
          <span className="text-lg font-bold tracking-tight">SocialPilot<span className="text-brand-600"> AI</span></span>
        </div>
        <div className="card p-8 text-center">
          <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${m.ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
            {m.ok ? <CheckCircle2 className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
          </span>
          <h1 className="mt-4 text-xl font-bold">{m.title}</h1>
          <p className="mt-2 text-sm text-ink-500">{m.body}</p>
        </div>
      </div>
    </div>
  );
}
