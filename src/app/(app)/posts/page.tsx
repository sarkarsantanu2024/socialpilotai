import Link from "next/link";
import { Sparkles, Facebook, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { PostsClient } from "./PostsClient";
import { getClientData } from "@/lib/clientData";
import { getCurrentTenant } from "@/lib/currentTenant";
import { compact } from "@/lib/utils";

// Show only the most recent posts on this page (drafts/scheduled first, then the
// latest published) instead of the full Page history.
const RECENT_LIMIT = 10;

// The connected Page's name doesn't contain this center's distinguishing (last)
// name token — almost always the WRONG branch's Page (e.g. the Ramnagar Page
// connected to the Barasat center). Everything on this screen would then really
// belong to that other branch, so warn loudly.
function looksLikeWrongPage(centerName: string, pageName: string): boolean {
  const tokenize = (s: string) => s.toLowerCase().replace(/[!-/:-@[-`{-~]/g, " ").split(/\s+/).filter(Boolean);
  const centerTokens = tokenize(centerName);
  if (!centerTokens.length || !pageName) return false;
  return !new Set(tokenize(pageName)).has(centerTokens[centerTokens.length - 1]);
}

export default async function PostsPage() {
  const { posts, page: connectedPage, live } = await getClientData();
  const tenant = await getCurrentTenant();
  const centerName = tenant?.businessProfile?.name ?? tenant?.name ?? "";
  const wrongPage = live && !!centerName && looksLikeWrongPage(centerName, connectedPage.name);
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

      {/* Wrong-branch connection warning — this whole screen mirrors the CONNECTED
          Page, so if that's another branch's Page, say so instead of confusing. */}
      {wrongPage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <b>{centerName}</b> is connected to the <b>{connectedPage.name}</b> Facebook Page — that looks like a
            different branch&apos;s Page, so the posts below belong to it. If {centerName} has its own Page, reconnect it in{" "}
            <Link href="/organization" className="font-semibold underline">Organization → Facebook connections</Link>{" "}
            (use the WhatsApp link so the branch owner connects with the account that manages their Page).
          </p>
        </div>
      )}

      <PostsClient initial={recent} notConnected={!live} centerName={centerName} />
    </div>
  );
}
