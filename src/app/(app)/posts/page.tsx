import Link from "next/link";
import { Sparkles, Facebook } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { PostsClient } from "./PostsClient";
import { getClientData } from "@/lib/clientData";
import { compact } from "@/lib/utils";

// Show only the most recent posts on this page (drafts/scheduled first, then the
// latest published) instead of the full Page history.
const RECENT_LIMIT = 10;

export default async function PostsPage() {
  const { posts, page: connectedPage, live } = await getClientData();
  const recent = posts.slice(0, RECENT_LIMIT);
  return (
    <div className="space-y-6">
      <PageHeader
        phase="Phase 2 · Publishing & scheduling"
        title="Posts & Publishing"
        subtitle="Publish to your connected Facebook Page or schedule for later. Drafts, scheduled and published posts all in one place."
        actions={
          <Link href="/studio" className="btn-primary">
            <Sparkles className="h-4 w-4" /> New post
          </Link>
        }
      />

      {/* Connected page banner */}
      <div className="card flex items-center gap-3 p-4">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#1877F2] text-white">
          <Facebook className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{connectedPage.name}</p>
          <p className="text-sm text-ink-500">
            {connectedPage.category} · {compact(connectedPage.followers)} followers
          </p>
        </div>
        <Badge tone={live ? "green" : "amber"}>{live ? "Live data" : "Not connected"}</Badge>
      </div>

      <PostsClient initial={recent} />
    </div>
  );
}
