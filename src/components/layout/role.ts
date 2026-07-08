import { Shield, Crown, Store, type LucideIcon } from "lucide-react";

export type Role = "superadmin" | "owner" | "manager" | "staff";

// Single source of truth for how each role is labelled + styled across the shell.
export const ROLE_BADGE: Record<Role, { label: string; icon: LucideIcon; cls: string }> = {
  superadmin: { label: "Super-admin", icon: Shield, cls: "bg-violet-50 text-violet-700" },
  owner: { label: "Owner / HO", icon: Crown, cls: "bg-amber-50 text-amber-700" },
  manager: { label: "Manager", icon: Store, cls: "bg-brand-50 text-brand-700" },
  staff: { label: "Staff", icon: Store, cls: "bg-ink-100 text-ink-600" },
};

// Plain-language explanation of what each role can do — shown wherever a role is
// picked (invite form) or displayed, so nobody has to guess the permissions.
export const ROLE_INFO: Record<Role, { label: string; scope: string; can: string[] }> = {
  superadmin: {
    label: "Super-admin",
    scope: "Entire platform — every organization and center.",
    can: ["Create, edit, suspend & delete any account", "Access all centers & billing", "Full platform administration"],
  },
  owner: {
    label: "Owner / HO",
    scope: "Head office — all centers in this organization.",
    can: ["Add & manage centers", "Invite managers and staff", "Push content to centers", "See roll-up analytics & billing"],
  },
  manager: {
    label: "Center manager",
    scope: "One assigned center only.",
    can: ["Create & publish posts", "Approve content and manage leads", "Connect the center's Facebook Page"],
  },
  staff: {
    label: "Staff (draft only)",
    scope: "One assigned center only.",
    can: ["Draft posts and submit for approval", "View leads", "Cannot publish or change settings"],
  },
};

type CenterLite = { id: string; role: Role };

// The user's account-level role, independent of which center is active:
//   super-admin  → platform-wide
//   owner / HO   → owns at least one org
//   otherwise    → the role on the active center (manager/staff)
export function accountRole(
  isSuperadmin: boolean,
  isOwner: boolean,
  centers: CenterLite[],
  activeCenterId: string | null,
): Role {
  if (isSuperadmin) return "superadmin";
  // isOwner covers the zero-center case; the centers scan covers per-center owners.
  if (isOwner || centers.some((c) => c.role === "owner")) return "owner";
  const active = centers.find((c) => c.id === activeCenterId) ?? centers[0];
  return active?.role ?? "manager";
}
