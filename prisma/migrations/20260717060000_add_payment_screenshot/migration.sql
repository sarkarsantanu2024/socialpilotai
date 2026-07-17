-- AlterTable
-- Additive + nullable: existing rows and older app versions keep working.
ALTER TABLE "PaymentRequest" ADD COLUMN "screenshot" TEXT;
