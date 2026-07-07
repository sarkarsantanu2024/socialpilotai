-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'approved',
ADD COLUMN     "pushId" TEXT;

-- CreateTable
CREATE TABLE "ContentPush" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "title" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "hashtags" TEXT[],
    "type" TEXT NOT NULL DEFAULT 'image',
    "assetUrl" TEXT,
    "suggestedAt" TIMESTAMP(3),
    "targetCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentPush_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContentPush" ADD CONSTRAINT "ContentPush_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
