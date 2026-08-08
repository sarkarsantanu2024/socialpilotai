// Set an account's plan, so a demo/reviewer login never hits the trial wall.
//
// The trial gate (lib/billing.ts) only fires when the plan resolves to "trial".
// Any paid plan never expires, so moving the Meta App Review tester onto one is
// permanent — unlike pushing trialEndsAt forward, which lapses again mid-review.
//
// Usage:
//   node scripts/set-plan.mjs <username> [plan]
//   node scripts/set-plan.mjs metareviewer single
//
// plan: trial | single | ho | custom   (default: single)
// Reads DATABASE_URL from .env.local — run it against whichever database the
// account actually lives in.

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

// Minimal .env.local reader so this works without dotenv-cli.
if (!process.env.DATABASE_URL) {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local — rely on the ambient env */
  }
}

const [username, plan = "single"] = process.argv.slice(2);

if (!username) {
  console.error("Usage: node scripts/set-plan.mjs <username> [trial|single|ho|custom]");
  process.exit(1);
}
if (!["trial", "single", "ho", "custom"].includes(plan)) {
  console.error(`Unknown plan "${plan}". Use: trial | single | ho | custom`);
  process.exit(1);
}

// Print which database we're actually talking to — the most common failure is
// running this against a local/dev DATABASE_URL while the live site uses Neon.
try {
  const u = new URL(process.env.DATABASE_URL ?? "");
  console.log(`Database: ${u.hostname}${u.pathname}`);
} catch {
  console.error("DATABASE_URL is missing or unparseable. Set it in .env.local.");
  process.exit(1);
}

const prisma = new PrismaClient();

const center = await prisma.tenant.findUnique({
  where: { username },
  select: {
    id: true,
    username: true,
    plan: true,
    trialEndsAt: true,
    organizationId: true,
    organization: { select: { id: true, name: true, plan: true } },
  },
});

if (!center) {
  console.error(`No account found with username "${username}".`);
  await prisma.$disconnect();
  process.exit(1);
}

console.log(`Found: ${center.username} — org "${center.organization?.name ?? "(none)"}"`);
console.log(`  before: center.plan=${center.plan}  org.plan=${center.organization?.plan ?? "-"}  trialEndsAt=${center.trialEndsAt?.toISOString() ?? "-"}`);

if (!center.organizationId) {
  console.warn("  NOTE: this center has no organization. trialExpiredForCenter reads the");
  console.warn("  ORG plan, so a null org resolves to \"trial\" no matter what the center");
  console.warn("  plan says — clearing trialEndsAt below is what actually unblocks it.");
}

// Belt and braces. Two independent conditions gate publishing:
//   planId(org.plan) === "trial"   AND   trialEndsAt < now
// Setting a paid plan defeats the first; clearing trialEndsAt defeats the
// second even when the center has no organization row. Do both, so the gate
// cannot fire for any reason — a demo account must never expire mid-review.
await prisma.tenant.update({
  where: { id: center.id },
  data: { plan, planStatus: "active", trialEndsAt: plan === "trial" ? center.trialEndsAt : null },
});
if (center.organizationId) {
  await prisma.organization.update({
    where: { id: center.organizationId },
    data: { plan, planStatus: "active" },
  });
}

const after = await prisma.tenant.findUnique({
  where: { id: center.id },
  select: { plan: true, trialEndsAt: true, organization: { select: { plan: true } } },
});
console.log(`  after:  center.plan=${after?.plan}  org.plan=${after?.organization?.plan ?? "-"}  trialEndsAt=${after?.trialEndsAt?.toISOString() ?? "null"}`);
console.log("Done. Publishing is no longer trial-gated for this account.");

await prisma.$disconnect();
