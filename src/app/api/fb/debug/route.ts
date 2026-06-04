import { NextResponse } from "next/server";
import { FB_GRAPH_VERSION } from "@/lib/config";
import { getConnection, activePage } from "@/lib/fb/session";

// Diagnostic: shows what each Graph edge ACTUALLY returns for the connected
// Page, so we can see why image posts / new posts aren't surfacing. Open
// /api/fb/debug in the browser while logged into the app. Safe & read-only.
export async function GET() {
  const page = activePage(getConnection());
  if (!page) return NextResponse.json({ connected: false, error: "No Page connected" });

  const GRAPH = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;
  const token = page.token;

  const probe = async (label: string, path: string) => {
    try {
      const res = await fetch(`${GRAPH}/${page.id}/${path}&access_token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.error) return { edge: label, ok: false, error: json.error.message, count: 0, sample: [] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any[] = json.data ?? [];
      return {
        edge: label,
        ok: true,
        count: data.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sample: data.slice(0, 3).map((d: any) => ({
          id: d.id,
          created_time: d.created_time,
          text: (d.message ?? d.name ?? d.description ?? d.story ?? "").slice(0, 50),
          media_type: d.attachments?.data?.[0]?.media_type ?? d.type ?? undefined,
        })),
      };
    } catch (e) {
      return { edge: label, ok: false, error: (e as Error).message, count: 0, sample: [] };
    }
  };

  const edges = await Promise.all([
    probe("feed", "feed?fields=id,message,story,created_time,full_picture,attachments{media_type}&limit=25"),
    probe("published_posts", "published_posts?fields=id,message,story,created_time,full_picture,attachments{media_type}&limit=25"),
    probe("posts", "posts?fields=id,message,story,created_time,full_picture,attachments{media_type}&limit=25"),
    probe("photos_uploaded", "photos?fields=id,name,created_time,images,link&type=uploaded&limit=25"),
    probe("photos_all", "photos?fields=id,name,created_time,images,link&limit=25"),
    probe("videos", "videos?fields=id,description,created_time,picture,permalink_url&limit=25"),
    probe("video_reels", "video_reels?fields=id,description,created_time,permalink_url,picture&limit=25"),
  ]);

  return NextResponse.json(
    {
      connected: true,
      page: { id: page.id, name: page.name },
      graphVersion: FB_GRAPH_VERSION,
      edges,
    },
    { status: 200 }
  );
}
