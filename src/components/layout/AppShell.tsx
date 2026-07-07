"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  Plane,
  Bell,
  Search,
  ChevronDown,
  Settings,
  LogOut,
  CheckCheck,
  Users,
  Building2,
  Inbox,
  Send,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { navItems } from "./nav";
import { cn } from "@/lib/utils";
import { DEMO_MODE } from "@/lib/config";
import { useBrand } from "@/lib/brand/store";
import { CenterSwitcher } from "./CenterSwitcher";

// Real notifications, fetched from /api/notifications (scoped to the active center).
type Notif = { id: string; title: string; body?: string | null; type: string; href?: string | null; read: boolean; createdAt: string };

const NOTIF_ICON: Record<string, typeof Bell> = {
  approval: Inbox, publish: Send, lead: Users, warning: AlertTriangle, info: Bell,
};

function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { brand } = useBrand();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<"none" | "notif" | "profile">("none");
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [fb, setFb] = useState<{ connected: boolean; pages: { id: string; name: string }[]; activePageId: string | null } | null>(null);
  const [canManageOrg, setCanManageOrg] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // When a real Facebook Page is connected, the header shows IT (not the demo profile).
  useEffect(() => {
    fetch("/api/fb/status", { cache: "no-store" })
      .then((r) => r.json())
      .then(setFb)
      .catch(() => {});
    // Show the Organization console only to HO owners / super-admins.
    fetch("/api/centers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCanManageOrg(!!d?.isSuperadmin || (d?.centers ?? []).some((c: { role?: string }) => c.role === "owner")))
      .catch(() => {});
    // Real notifications for the active center.
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setNotifs(d?.notifications ?? []))
      .catch(() => {});
  }, []);
  const connectedName = fb?.connected ? fb.pages.find((p) => p.id === fb.activePageId)?.name ?? null : null;

  async function markAllRead() {
    setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
  }

  const unreadCount = notifs.filter((n) => !n.read).length;
  const bizName = connectedName ?? brand.profile.name;
  const bizSub = connectedName ? "Facebook Page" : brand.profile.city;
  const initials =
    bizName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "BM";

  // Close any open dropdown on outside click or Escape.
  useEffect(() => {
    if (menu === "none") return;
    function onClick(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMenu("none");
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu("none");
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  async function logout() {
    // Clears the httpOnly session cookie + Facebook connection server-side.
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 transform border-r border-ink-100 bg-white transition-transform lg:static lg:w-64 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-ink-100 px-5">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Plane className="h-5 w-5 -rotate-45" />
            </span>
            <span className="text-base font-bold tracking-tight">
              SocialPilot<span className="text-brand-600"> AI</span>
            </span>
          </Link>
          <button
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-50 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 overflow-y-auto p-3" style={{ maxHeight: "calc(100vh - 4rem)" }}>
          {(canManageOrg
            ? [...navItems.slice(0, -1), { href: "/organization", label: "Organization", icon: Building2 }, { href: "/billing", label: "Billing", icon: CreditCard }, navItems[navItems.length - 1]]
            : navItems
          ).map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", active ? "text-brand-600" : "text-ink-400 group-hover:text-ink-600")} />
                <span className="flex-1">{item.label}</span>
                {item.phase && (
                  <span className={cn("text-[10px] font-semibold", active ? "text-brand-400" : "text-ink-300")}>
                    {item.phase}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header
          ref={headerRef}
          className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-100 bg-white/80 px-4 backdrop-blur sm:px-6"
        >
          <button
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-50 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Center switcher — only appears for users with >1 accessible center */}
          <CenterSwitcher />

          <div className="relative hidden flex-1 sm:block sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="Search posts, leads, campaigns…"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {DEMO_MODE && (
              <span className="chip bg-amber-50 text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Demo Mode
              </span>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setMenu((m) => (m === "notif" ? "none" : "notif"))}
                className="relative rounded-lg p-2 text-ink-600 hover:bg-ink-50"
                aria-label="Notifications"
                aria-expanded={menu === "notif"}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {menu === "notif" && (
                <div className="absolute right-0 top-12 z-30 w-80 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-pop">
                  <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                    <p className="text-sm font-semibold">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 && (
                      <p className="px-4 py-8 text-center text-sm text-ink-400">You&apos;re all caught up.</p>
                    )}
                    {notifs.map((n) => {
                      const Icon = NOTIF_ICON[n.type] ?? Bell;
                      const inner = (
                        <>
                          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-snug text-ink-800">{n.title}</p>
                            {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{n.body}</p>}
                            <p className="mt-0.5 text-[11px] text-ink-400">{relTime(n.createdAt)}</p>
                          </div>
                          {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                        </>
                      );
                      const cls = cn("flex gap-3 px-4 py-3 transition hover:bg-ink-50", !n.read && "bg-brand-50/50");
                      return n.href ? (
                        <Link key={n.id} href={n.href} onClick={() => setMenu("none")} className={cls}>{inner}</Link>
                      ) : (
                        <div key={n.id} className={cls}>{inner}</div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setMenu((m) => (m === "profile" ? "none" : "profile"))}
                className="flex items-center gap-2 rounded-xl border border-ink-100 py-1 pl-1 pr-2 transition hover:bg-ink-50 sm:pr-3"
                aria-expanded={menu === "profile"}
              >
                {brand.kit.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.kit.logo} alt="" className="h-8 w-8 rounded-lg object-cover ring-1 ring-ink-100" />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                    {initials}
                  </span>
                )}
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold leading-tight">{bizName.split(" ").slice(0, 2).join(" ")}</p>
                  <p className="text-[11px] leading-tight text-ink-400">{bizSub}</p>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-ink-400 transition", menu === "profile" && "rotate-180")} />
              </button>

              {menu === "profile" && (
                <div className="absolute right-0 top-12 z-30 w-64 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-pop">
                  <div className="border-b border-ink-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold">{bizName}</p>
                    <p className="truncate text-xs text-ink-400">
                      {connectedName ? "● Connected via Facebook" : bizSub || "Your workspace"}
                    </p>
                  </div>

                  <div className="p-1.5">
                    <Link
                      href="/settings"
                      onClick={() => setMenu("none")}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-50"
                    >
                      <Settings className="h-4 w-4 text-ink-400" /> Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <div className="animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
