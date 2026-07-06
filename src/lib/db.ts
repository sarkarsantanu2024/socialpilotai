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
