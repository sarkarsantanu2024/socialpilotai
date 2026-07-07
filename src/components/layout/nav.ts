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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  phase?: string;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio", label: "AI Content Studio", icon: Sparkles, phase: "P1" },
  { href: "/posts", label: "Posts & Publishing", icon: Send, phase: "P2" },
  { href: "/approvals", label: "Approvals", icon: Inbox },
  { href: "/calendar", label: "Content Calendar", icon: CalendarDays, phase: "P2" },
  { href: "/intelligence", label: "Content Intelligence", icon: Brain, phase: "P3" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, phase: "P4" },
  { href: "/ads", label: "Boost / Promote", icon: Megaphone, phase: "P5" },
  { href: "/leads", label: "Leads", icon: Users, phase: "P6" },
  { href: "/settings", label: "Settings", icon: Settings },
];
