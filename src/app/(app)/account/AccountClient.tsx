"use client";

import { useState } from "react";
import { User, Mail, AtSign, Lock, Check, RefreshCw, Eye, EyeOff } from "lucide-react";

type Initial = { name: string; username: string; email: string; role: string };

export function AccountClient({ initial }: { initial: Initial }) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveProfile() {
    setSavingProfile(true); setProfileMsg(null);
    const res = await fetch("/api/account", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }),
    });
    const d = await res.json().catch(() => ({}));
    setSavingProfile(false);
    setProfileMsg(res.ok ? { ok: true, text: "Profile saved." } : { ok: false, text: d.error ?? "Couldn't save." });
  }

  async function changePassword() {
    setPwMsg(null);
    if (next.length < 8) { setPwMsg({ ok: false, text: "New password must be at least 8 characters." }); return; }
    if (next !== confirm) { setPwMsg({ ok: false, text: "New passwords don't match." }); return; }
    setSavingPw(true);
    const res = await fetch("/api/account", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const d = await res.json().catch(() => ({}));
    setSavingPw(false);
    if (res.ok) { setPwMsg({ ok: true, text: "Password changed." }); setCurrent(""); setNext(""); setConfirm(""); }
    else setPwMsg({ ok: false, text: d.error ?? "Couldn't change password." });
  }

  return (
    <div className="grid max-w-3xl gap-6">
      {/* Profile */}
      <div className="card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><User className="h-5 w-5 text-brand-600" /> Account details</h2>
        <p className="mt-1 text-sm text-ink-500">Signed in as <span className="chip bg-brand-50 text-brand-700">{initial.role}</span></p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Your name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Your name" />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><AtSign className="h-3.5 w-3.5" /> Username</label>
            <input value={initial.username} readOnly disabled className="input cursor-not-allowed bg-ink-50 text-ink-500" />
            <p className="mt-1 text-[11px] text-ink-400">Your login — can&apos;t be changed.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="label flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email <span className="font-normal text-ink-400">(for receipts &amp; reminders)</span></label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input" placeholder="you@business.com" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={saveProfile} disabled={savingProfile} className="btn-primary disabled:opacity-60">
            {savingProfile ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> Save changes</>}
          </button>
          {profileMsg && <span className={profileMsg.ok ? "text-sm font-medium text-emerald-600" : "text-sm font-medium text-rose-600"}>{profileMsg.text}</span>}
        </div>
      </div>

      {/* Password */}
      <div className="card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Lock className="h-5 w-5 text-brand-600" /> Change password</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="label">Current password</label>
            <div className="relative">
              <input value={current} onChange={(e) => setCurrent(e.target.value)} type={show ? "text" : "password"} className="input pr-10" placeholder="Current password" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 hover:text-ink-700">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">New password</label>
            <input value={next} onChange={(e) => setNext(e.target.value)} type={show ? "text" : "password"} className="input" placeholder="At least 8 characters" />
          </div>
          <div>
            <label className="label">Confirm new</label>
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type={show ? "text" : "password"} className="input" placeholder="Repeat new password" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={changePassword} disabled={savingPw || !current || !next} className="btn-primary disabled:opacity-60">
            {savingPw ? <><RefreshCw className="h-4 w-4 animate-spin" /> Updating…</> : <><Lock className="h-4 w-4" /> Update password</>}
          </button>
          {pwMsg && <span className={pwMsg.ok ? "text-sm font-medium text-emerald-600" : "text-sm font-medium text-rose-600"}>{pwMsg.text}</span>}
        </div>
      </div>
    </div>
  );
}
