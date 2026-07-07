"use client";

import { useEffect } from "react";
import { RefreshCw, RotateCw, Plane } from "lucide-react";

// App-wide error boundary. Catches server/render errors (including a transient
// "can't reach database" when Neon's free-tier compute is waking up) and shows a
// friendly retry instead of a raw stack trace.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  const isDb = /reach database|can't reach|prisma|connection|ECONN|timeout/i.test(error.message);

  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 p-6">
      <div className="card max-w-md p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white">
          <Plane className="h-7 w-7 -rotate-45" />
        </span>
        <h1 className="mt-4 text-xl font-bold">{isDb ? "Reconnecting…" : "Something went wrong"}</h1>
        <p className="mt-2 text-sm text-ink-500">
          {isDb
            ? "We couldn't reach the server for a moment — it may have been waking up. Please try again in a second."
            : "An unexpected error occurred. Try again, and if it keeps happening, reload the page."}
        </p>
        <button onClick={reset} className="btn-primary mt-6 w-full">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <button onClick={() => window.location.reload()} className="btn-ghost mt-2 w-full text-sm">
          <RotateCw className="h-4 w-4" /> Reload page
        </button>
      </div>
    </div>
  );
}
