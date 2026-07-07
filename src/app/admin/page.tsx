import { redirect } from "next/navigation";
import { getCurrentUser, isSuperadmin } from "@/lib/access";
import { platformOverview } from "@/lib/admin";
import { listAllPending } from "@/lib/billing";
import { AdminClient } from "./AdminClient";

// Platform console for the super-admin. Lives OUTSIDE the (app) layout so it
// works without owning a center.
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear"); // clear any stale cookie, then /login
  if (!isSuperadmin(user)) redirect("/dashboard");

  const overview = await platformOverview();
  const pending = await listAllPending(user);

  return <AdminClient name={user.name ?? user.username} overview={overview} pending={pending} />;
}
