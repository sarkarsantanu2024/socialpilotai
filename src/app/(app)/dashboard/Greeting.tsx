"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useBrand } from "@/lib/brand/store";

// Client greeting so the dashboard title follows the connected Page (live) or
// the active demo client otherwise.
export function Greeting({ liveName }: { liveName?: string | null }) {
  const { profile } = useBrand();
  const name = liveName || profile.name;
  const shortName = name.split(/\s+/).slice(0, 2).join(" ");
  return (
    <PageHeader
      title={`Welcome back, ${shortName} 👋`}
      subtitle="Here's how your Facebook page is performing and what to do next."
      actions={
        <Link href="/studio" className="btn-primary">
          <Sparkles className="h-4 w-4" /> Create content
        </Link>
      }
    />
  );
}
