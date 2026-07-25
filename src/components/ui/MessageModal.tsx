"use client";

import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  info: { Icon: Info, cls: "bg-brand-50 text-brand-600" },
  success: { Icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-600" },
  warning: { Icon: AlertTriangle, cls: "bg-amber-50 text-amber-600" },
  error: { Icon: XCircle, cls: "bg-rose-50 text-rose-600" },
} as const;

export type MessageTone = keyof typeof ICONS;

// App-wide message dialog — replaces toasts/alerts so nothing important scrolls
// away or auto-dismisses. Pass `actions` for custom buttons; the default is OK.
export function MessageModal({
  title,
  tone = "info",
  onClose,
  children,
  actions,
}: {
  title: string;
  tone?: MessageTone;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const { Icon, cls } = ICONS[tone];
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", cls)}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-snug">{title}</h3>
            <div className="mt-1.5 text-sm text-ink-600">{children}</div>
          </div>
          <button onClick={onClose} className="btn-ghost -mr-1 -mt-1 px-2" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {actions ?? <button onClick={onClose} className="btn-primary text-sm">OK</button>}
        </div>
      </div>
    </div>
  );
}
