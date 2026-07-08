import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentUser } from "@/lib/access";
import { getConnection } from "@/lib/fb/connection";
import { sanitizeReturnTo } from "@/lib/fb/oauthState";
import { SelectPageClient } from "./SelectPageClient";

// Shown right after Facebook OAuth when the connected account manages MORE THAN
// ONE Page — so the user consciously maps a Page to THIS center instead of the
// callback silently defaulting to the first Page Facebook returned. One Page (or
// none) → nothing to choose, so we skip straight to where the flow was headed.
export default async function SelectPagePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/clear");

  const { returnTo: rawReturnTo } = await searchParams;
  const returnTo = sanitizeReturnTo(rawReturnTo) ?? "/settings";

  const conn = await getConnection(); // active center's connection
  if (!conn || conn.pages.length <= 1) {
    // Nothing to pick — proceed to the original destination.
    redirect(returnTo);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Choose the Page for this center"
        subtitle="Your Facebook account manages several Pages. Pick the one this center should publish to and read insights from. You can change it later in Settings → Connections."
      />
      <SelectPageClient
        pages={conn.pages.map((p) => ({ id: p.id, name: p.name, category: p.category ?? null, picture: p.picture ?? null }))}
        activePageId={conn.activePageId}
        returnTo={returnTo}
      />
    </div>
  );
}
