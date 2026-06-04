import { cn } from "@/lib/utils";

type Tone = "gray" | "green" | "blue" | "amber" | "red" | "violet";

const tones: Record<Tone, string> = {
  gray: "bg-ink-100 text-ink-700",
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-brand-50 text-brand-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  violet: "bg-violet-50 text-violet-700",
};

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return <span className={cn("chip", tones[tone], className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Tone> = {
    published: "green",
    scheduled: "blue",
    draft: "gray",
    failed: "red",
    pending: "amber",
    approved: "green",
    rejected: "red",
    PAUSED: "amber",
    ACTIVE: "green",
    COMPLETED: "violet",
  };
  return <Badge tone={map[status] ?? "gray"}>{status}</Badge>;
}
