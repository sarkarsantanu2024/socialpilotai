import { PageHeader } from "@/components/ui/PageHeader";
import { CalendarClient } from "./CalendarClient";
import { festivals } from "@/lib/demo/data";
import { getClientData } from "@/lib/clientData";

export default async function CalendarPage() {
  const { posts, page } = await getClientData();
  return (
    <div className="space-y-6">
      <PageHeader
        phase="Phase 2 · Publishing & scheduling"
        title="Content Calendar"
        subtitle="Plan, schedule and preview your posts across the week. Scheduled and published posts are overlaid with the Indian festival calendar so you never miss an occasion."
      />
      <CalendarClient
        posts={posts}
        festivals={festivals}
        pageName={page.name}
        pageAvatar={page.avatar}
      />
    </div>
  );
}
