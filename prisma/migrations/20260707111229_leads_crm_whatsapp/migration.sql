-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "whatsapp" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "assignedToUserId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'new';

-- CreateIndex
CREATE INDEX "Lead_tenantId_status_idx" ON "Lead"("tenantId", "status");
