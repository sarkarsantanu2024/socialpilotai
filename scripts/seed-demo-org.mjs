// Seeds a realistic multi-tenant demo:
//   Organization "Mind Mantra Abacus" with 3 centers,
//   an HO owner login, a single-center manager login, and a platform super-admin.
// Idempotent — safe to run repeatedly. Run:
//   npx dotenv -e .env.local -- node scripts/seed-demo-org.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const KIT = { primary: "#244fdb", secondary: "#0ea5e9", accent: "#f59e0b", font: "Poppins" };

async function upsertUser({ username, email, password, name, platformRole = "none" }) {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return prisma.user.update({ where: { id: existing.id }, data: { platformRole } });
  }
  return prisma.user.create({
    data: { username, email, password: await bcrypt.hash(password, 10), name, platformRole },
  });
}

async function upsertMembership(userId, organizationId, role, centerId = null) {
  const found = await prisma.membership.findFirst({ where: { userId, organizationId, role, centerId } });
  if (found) return found;
  return prisma.membership.create({ data: { userId, organizationId, role, centerId } });
}

async function makeCenter(orgId, { name, city, type }) {
  const existing = await prisma.tenant.findFirst({
    where: { organizationId: orgId, businessProfile: { is: { name } } },
  });
  if (existing) return existing;
  return prisma.tenant.create({
    data: {
      username: `center_${name.toLowerCase().replace(/\W+/g, "_")}_${Date.now().toString(36)}`,
      password: "",
      name,
      plan: "pro",
      planStatus: "active",
      organizationId: orgId,
      businessProfile: { create: { name, type, city, language: "English", tone: "Warm, friendly, professional", audience: "Parents of 5–14 year olds" } },
      brandKit: { create: { logoText: name.slice(0, 24), ...KIT } },
    },
  });
}

async function main() {
  // 1) Organization (brand / franchise)
  let org = await prisma.organization.findFirst({ where: { name: "Mind Mantra Abacus" } });
  if (!org) org = await prisma.organization.create({ data: { name: "Mind Mantra Abacus", vertical: "abacus", plan: "pro" } });

  // 2) Centers under it
  const barasat = await makeCenter(org.id, { name: "Mind Mantra — Barasat", city: "Barasat", type: "abacus" });
  await makeCenter(org.id, { name: "Mind Mantra — Salt Lake", city: "Kolkata", type: "abacus" });
  await makeCenter(org.id, { name: "Mind Mantra — Howrah", city: "Howrah", type: "abacus" });

  // 3) People
  const superadmin = await upsertUser({ username: "superadmin", password: "superadmin123", name: "Platform Admin", platformRole: "superadmin", email: "systems@webspiders.com" });
  const ho = await upsertUser({ username: "mindmantra", password: "mindmantra123", name: "Mind Mantra HO" });
  const manager = await upsertUser({ username: "barasat", password: "barasat123", name: "Barasat Center Owner" });

  // 4) Memberships
  await upsertMembership(ho.id, org.id, "owner");                 // HO: all centers in the org
  await upsertMembership(manager.id, org.id, "manager", barasat.id); // Manager: just Barasat

  console.log("\n✅ Seeded 'Mind Mantra Abacus' with 3 centers.\n");
  console.log("Demo logins (password shown):");
  console.log("  • Super-admin  →  superadmin / superadmin123   (sees EVERY org & center)");
  console.log("  • HO / Owner   →  mindmantra / mindmantra123    (sees all 3 Mind Mantra centers)");
  console.log("  • Center owner →  barasat / barasat123          (sees only Barasat)\n");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
