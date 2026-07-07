-- AlterTable
ALTER TABLE "ConnectedPage" ADD COLUMN     "city" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "picture" TEXT;

-- CreateTable
CREATE TABLE "FbConnection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userName" TEXT,
    "userToken" TEXT,
    "adAccountId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FbConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FbConnection_tenantId_key" ON "FbConnection"("tenantId");

-- AddForeignKey
ALTER TABLE "FbConnection" ADD CONSTRAINT "FbConnection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
