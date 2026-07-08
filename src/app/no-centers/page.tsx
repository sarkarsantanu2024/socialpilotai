import { Building2, LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/access";
import { redirect } from "next/navigation";

// Shown when a signed-in NON-super user has no center yet (e.g. a manager whose
// center hasn't been created). Super-admins get /admin instead. "Back to login"
// clears the session (via /api/session/clear) so it doesn't bounce back.
export default async function NoCenters() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");
  if (user.platformRole === "superadmin") redirect("/admin");
  // Owners CAN create centers — send them to the console instead of this dead-end.
  if (user.memberships.some((m) => m.role === "owner")) redirect("/organization");

  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 p-6">
      <div className="card max-w-md p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Building2 className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold">No centers yet</h1>
        <p className="mt-2 text-sm text-ink-500">
          You&apos;re signed in as <b>{user.name ?? user.username}</b>, but there are no centers
          assigned to you yet. A center is added by your organization owner or the platform admin —
          once one exists, it will appear here.
        </p>
        <a href="/api/session/clear" className="btn-ghost mt-6 w-full text-sm">
          <LogOut className="h-4 w-4" /> Back to login
        </a>
      </div>
    </div>
  );
}
