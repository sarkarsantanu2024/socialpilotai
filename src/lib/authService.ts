// Account creation + login against the real Postgres (Neon) database.
// Passwords are hashed with bcrypt. A new tenant gets a default business
// profile + brand kit and a 14-day trial. Server-only.
import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { BusinessType } from "@/lib/types";

const DEFAULT_KIT = {
  primary: "#244fdb",
  secondary: "#0ea5e9",
  accent: "#f59e0b",
  font: "Poppins",
};

export interface SignupInput {
  name: string;
  business: string;
  username: string;
  email?: string;
  password: string;
  type?: BusinessType;
  city?: string;
}

export async function createTenant(input: SignupInput) {
  const username = input.username.trim().toLowerCase();
  const email = input.email?.trim().toLowerCase() || null;
  if (!username || username.length < 3) {
    throw new Error("A username of at least 3 characters is required.");
  }
  if (!input.password || input.password.length < 8) {
    throw new Error("A password of at least 8 characters is required.");
  }
  if (!/^[a-z0-9_.]+$/.test(username)) {
    throw new Error("Username can only contain letters, numbers, dots and underscores.");
  }

  const existing = await prisma.tenant.findUnique({ where: { username } });
  if (existing) throw new Error("That username is already taken.");
  if (email) {
    const emailTaken = await prisma.tenant.findUnique({ where: { email } });
    if (emailTaken) throw new Error("An account with this email already exists.");
  }

  const password = await bcrypt.hash(input.password, 10);
  const business = (input.business || input.name || "My Business").trim();

  return prisma.tenant.create({
    data: {
      username,
      email,
      password,
      name: input.name.trim() || business,
      plan: "trial",
      planStatus: "active",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      businessProfile: {
        create: {
          name: business,
          type: input.type ?? "coaching",
          city: input.city ?? "",
          language: "English",
          tone: "Warm, friendly, professional",
          audience: "Local customers",
        },
      },
      brandKit: {
        create: { logoText: business.slice(0, 24), ...DEFAULT_KIT },
      },
    },
  });
}

export async function verifyLogin(username: string, password: string) {
  const id = username.trim().toLowerCase();
  // Accept a username OR (if the user set one) their email as the login id.
  const tenant = await prisma.tenant.findFirst({
    where: { OR: [{ username: id }, { email: id }] },
  });
  if (!tenant) return null;
  const ok = await bcrypt.compare(password, tenant.password);
  return ok ? tenant : null;
}
