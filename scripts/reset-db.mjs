// FULL database reset — deletes ALL app data (users, orgs, centers, posts,
// connections, invites, everything). Leaves the schema intact. Use before real
// testing so NO demo/dummy data remains. Run:
//   npx dotenv -e .env.local -- node scripts/reset-db.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Child → parent order (also safe with the schema's cascades).
  const steps = [
    ["invite", () => prisma.invite.deleteMany()],
    ["membership", () => prisma.membership.deleteMany()],
    ["lead", () => prisma.lead.deleteMany()],
    ["campaign", () => prisma.campaign.deleteMany()],
    ["adRecommendation", () => prisma.adRecommendation.deleteMany()],
    ["contentCalendar", () => prisma.contentCalendar.deleteMany()],
    ["postAnalytics", () => prisma.postAnalytics.deleteMany()],
    ["post", () => prisma.post.deleteMany()],
    ["connectedPage", () => prisma.connectedPage.deleteMany()],
    ["fbConnection", () => prisma.fbConnection.deleteMany()],
    ["adAccount", () => prisma.adAccount.deleteMany()],
    ["brandKit", () => prisma.brandKit.deleteMany()],
    ["businessProfile", () => prisma.businessProfile.deleteMany()],
    ["tenant", () => prisma.tenant.deleteMany()],
    ["user", () => prisma.user.deleteMany()],
    ["organization", () => prisma.organization.deleteMany()],
  ];
  const result = {};
  for (const [name, fn] of steps) {
    const { count } = await fn();
    result[name] = count;
  }
  console.log("Deleted rows:", JSON.stringify(result, null, 0));
  console.log("\nDatabase is now completely clean. Sign up fresh to start real testing.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
