-- Opt-in flag: auto-generate & schedule weekly posts for this center.
ALTER TABLE "Tenant" ADD COLUMN "autoPost" BOOLEAN NOT NULL DEFAULT false;
