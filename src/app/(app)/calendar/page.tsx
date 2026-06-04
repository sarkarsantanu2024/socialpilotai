import { PageHeader } from "@/components/ui/PageHeader";
import { CalendarClient } from "./CalendarClient";
import { festivals } from "@/lib/demo/data";
import { getClientData } from "@/lib/clientData";

export default async function CalendarPage() {
  const { posts } = await getClientData();
  return (
    <div className="space-y-6">
      <PageHeader
        phase="Phase 2 · Publishing & scheduling"
        title="Content Calendar"
        subtitle="A month-at-a-glance view of scheduled and published posts, auto-overlaid with the Indian festival calendar so you never miss an occasion."
      />
      <CalendarClient posts={posts} festivals={festivals} />
    </div>
  );
}
