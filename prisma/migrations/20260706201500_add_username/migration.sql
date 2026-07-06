-- Add username (required, unique) and make email optional.
-- Safe on an empty table; run before any tenants exist.
ALTER TABLE "Tenant" ADD COLUMN "username" TEXT NOT NULL;
ALTER TABLE "Tenant" ALTER COLUMN "email" DROP NOT NULL;

-- Unique index for username lookups at login.
CREATE UNIQUE INDEX "Tenant_username_key" ON "Tenant"("username");
