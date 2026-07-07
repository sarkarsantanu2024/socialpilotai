// Prisma client singleton. In dev, Next.js hot-reload would otherwise create a
// new client on every reload and exhaust Neon's connection limit — so we cache
// it on globalThis. Import `prisma` anywhere on the server to query the real DB.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Neon's free-tier compute auto-suspends after inactivity; the FIRST query after
// it goes idle can fail with "Can't reach database server" while it wakes up.
// Retry transient connection errors a couple of times so cold-starts are
// invisible to the user. Non-connection errors are re-thrown immediately.
export async function withDbRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 700): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = (e as Error)?.message ?? "";
      const transient = /reach database|can't reach|connection|ECONN|ETIMEDOUT|timeout|terminating connection|Closed/i.test(msg);
      if (!transient || i === attempts - 1) throw e;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}
