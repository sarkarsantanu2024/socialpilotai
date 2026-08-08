// Set an account's plan, so a demo/reviewer login never hits the trial wall.
//
// The trial gate (lib/billing.ts) only fires when the plan resolves to "trial"
// AND trialEndsAt has passed. Paid plans never expire, so moving the Meta App
// Review tester onto one is permanent — unlike pushing trialEndsAt forward,
// which lapses again mid-review. We clear trialEndsAt as well, belt and braces.
//
// IMPORTANT: the username you log in with is a USER, not a Tenant. Signup gives
// the centre row a generated `center_<hash>_<ts>` username (authService.ts), so
// looking a login name up in Tenant always misses. Resolve
// User → Membership → Organization → centers, exactly like auth does.
//
// Usage:
//   node scripts/set-plan.mjs <login-username> [plan]
//   node scripts/set-plan.mjs metareviewer single
//
// plan: trial | single | ho | custom   (default: single)
// Reads DATABASE_URL from .env.local unless it is already set in the env.

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

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

const [rawUsername, plan = "single"] = process.argv.slice(2);

if (!rawUsername) {
  console.error("Usage: node scripts/set-plan.mjs <login-username> [trial|single|ho|custom]");
  process.exit(1);
}
if (!["trial", "single", "ho", "custom"].includes(plan)) {
  console.error(`Unknown plan "${plan}". Use: trial | single | ho | custom`);
  process.exit(1);
}

// Print the target database — running against the wrong one looks identical to
// the script not working.
try {
  const u = new URL(process.env.DATABASE_URL ?? "");
  console.log(`Database: ${u.hostname}${u.pathname}\n`);
} catch {
  console.error("DATABASE_URL is missing or unparseable. Set it in .env.local.");
  process.exit(1);
}

const username = rawUsername.trim().toLowerCase();
const prisma = new PrismaClient();

const user = await prisma.user.findUnique({
  where: { username },
  select: {
    id: true,
    username: true,
    memberships: {
      select: {
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            plan: true,
            centers: { select: { id: true, name: true, plan: true, trialEndsAt: true } },
          },
        },
      },
    },
  },
});

if (!user) {
  const names = await prisma.user.findMany({ select: { username: true }, take: 25, orderBy: { createdAt: "desc" } });
  console.error(`No user found with username "${username}".`);
  console.error(`Most recent usernames in this database: ${names.map((n) => n.username).join(", ") || "(none)"}`);
  await prisma.$disconnect();
  process.exit(1);
}

if (user.memberships.length === 0) {
  console.error(`User "${username}" has no organization membership — nothing to bill.`);
  await prisma.$disconnect();
  process.exit(1);
}

for (const m of user.memberships) {
  const org = m.organization;
  console.log(`Org "${org.name}" (role: ${m.role})`);
  console.log(`  before: org.plan=${org.plan}`);
  for (const c of org.centers) {
    console.log(`          center "${c.name}" plan=${c.plan} trialEndsAt=${c.trialEndsAt?.toISOString() ?? "null"}`);
  }

  await prisma.organization.update({
    where: { id: org.id },
    data: { plan, planStatus: "active" },
  });
  await prisma.tenant.updateMany({
    where: { organizationId: org.id },
    data: { plan, planStatus: "active", ...(plan === "trial" ? {} : { trialEndsAt: null }) },
  });

  const after = await prisma.organization.findUnique({
    where: { id: org.id },
    select: { plan: true, centers: { select: { name: true, plan: true, trialEndsAt: true } } },
  });
  console.log(`  after:  org.plan=${after?.plan}`);
  for (const c of after?.centers ?? []) {
    console.log(`          center "${c.name}" plan=${c.plan} trialEndsAt=${c.trialEndsAt?.toISOString() ?? "null"}`);
  }
  console.log();
}

console.log("Done. Publishing is no longer trial-gated for this account.");
await prisma.$disconnect();
