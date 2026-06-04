import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  icon,
  className,
}: {
  label: string;
  value: string;
  delta?: { value: string; up?: boolean };
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-ink-500">{label}</p>
        {icon && <span className="text-brand-500">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            delta.up ? "text-emerald-600" : "text-rose-600"
          )}
        >
          {delta.up ? "▲" : "▼"} {delta.value}
        </p>
      )}
    </div>
  );
}
