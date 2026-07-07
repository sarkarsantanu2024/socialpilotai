"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Store, Building2 } from "lucide-react";

const ROLE_LABEL: Record<string, { label: string; icon: typeof Crown }> = {
  owner: { label: "Organization owner (HO)", icon: Crown },
  manager: { label: "Center manager", icon: Store },
  staff: { label: "Staff", icon: Store },
};

export function AcceptInviteClient({
  token, orgName, role, centerName, email,
}: {
  token: string; orgName: string; role: string; centerName: string | null; email: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const RL = ROLE_LABEL[role] ?? ROLE_LABEL.manager;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch("/api/invites/accept", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, username, password, name }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(data.error ?? "Couldn't accept the invite."); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="card p-8">
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-brand-700">
        <Building2 className="h-5 w-5 shrink-0" />
        <div className="text-sm">
          You've been invited to <b>{orgName}</b>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-brand-600">
            <RL.icon className="h-3.5 w-3.5" /> {RL.label}{centerName ? ` · ${centerName}` : ""}
          </div>
        </div>
      </div>
      <h1 className="text-xl font-bold">Create your login</h1>
      <p className="mt-1 text-sm text-ink-500">Set your own username &amp; password — no one else sees it.</p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="block text-xs font-medium text-ink-600">Your name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" className="input mt-1" />
        </label>
        <label className="block text-xs font-medium text-ink-600">Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="choose a username" className="input mt-1" required />
        </label>
        <label className="block text-xs font-medium text-ink-600">Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="at least 8 characters" className="input mt-1" required />
        </label>
        {email && <p className="text-xs text-ink-400">Invited as {email}</p>}
        {err && <p className="text-sm font-medium text-rose-600">{err}</p>}
        <button disabled={busy} className="btn-primary w-full py-2.5 text-sm disabled:opacity-60">
          {busy ? "Creating…" : "Accept & create account"}
        </button>
      </form>
    </div>
  );
}
