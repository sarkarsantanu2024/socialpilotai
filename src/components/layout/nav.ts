import {
  LayoutDashboard,
  Sparkles,
  CalendarDays,
  Send,
  Brain,
  BarChart3,
  Megaphone,
  Users,
  Settings,
  Inbox,
  Building2,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./role";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  phase?: string;
  // Which roles see this item. superadmin sees everything (handled in the shell).
  roles: Role[];
}

const ALL: Role[] = ["owner", "manager", "staff"];
const MGMT: Role[] = ["owner", "manager"]; // publish/spend/insight — not draft-only staff
const HO: Role[] = ["owner"]; // head-office only

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL },
  { href: "/studio", label: "AI Content Studio", icon: Sparkles, phase: "P1", roles: ALL },
  { href: "/posts", label: "Posts & Publishing", icon: Send, phase: "P2", roles: ALL },
  { href: "/approvals", label: "Approvals", icon: Inbox, roles: MGMT },
  { href: "/calendar", label: "Content Calendar", icon: CalendarDays, phase: "P2", roles: ALL },
  { href: "/intelligence", label: "Content Intelligence", icon: Brain, phase: "P3", roles: MGMT },
  { href: "/analytics", label: "Analytics", icon: BarChart3, phase: "P4", roles: MGMT },
  { href: "/ads", label: "Boost / Promote", icon: Megaphone, phase: "P5", roles: MGMT },
  { href: "/leads", label: "Leads", icon: Users, phase: "P6", roles: MGMT },
  { href: "/organization", label: "Organization", icon: Building2, roles: HO },
  { href: "/billing", label: "Billing", icon: CreditCard, roles: HO },
  { href: "/settings", label: "Settings", icon: Settings, roles: MGMT },
];

/** Filter the menu to what a given role may see. superadmin sees all. */
export function navForRole(role: Role | null): NavItem[] {
  const r = role ?? "staff"; // most-restrictive default while the role resolves
  if (r === "superadmin") return navItems;
  return navItems.filter((it) => it.roles.includes(r));
}
