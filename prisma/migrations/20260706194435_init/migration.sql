-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "planStatus" TEXT NOT NULL DEFAULT 'active',
    "planRenewsAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "audience" TEXT NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandKit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoText" TEXT NOT NULL,
    "primary" TEXT NOT NULL,
    "secondary" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "font" TEXT NOT NULL,

    CONSTRAINT "BrandKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectedPage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "pageToken" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ConnectedPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "token" TEXT NOT NULL,
    "fundingOk" BOOLEAN NOT NULL DEFAULT false,
    "isSandbox" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AdAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "hashtags" TEXT[],
    "music" TEXT,
    "assetUrl" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "fbPostId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'studio',

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostAnalytics" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reactions" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "videoViews" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentCalendar" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "postId" TEXT,

    CONSTRAINT "ContentCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdRecommendation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "audience" JSONB NOT NULL,
    "budget" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "rationale" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "AdRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fbCampaignId" TEXT NOT NULL,
    "adsetId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAUSED',
    "isSandbox" BOOLEAN NOT NULL DEFAULT true,
    "dailyBudget" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "results" INTEGER NOT NULL DEFAULT 0,
    "costPerResult" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "interest" TEXT,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_email_key" ON "Tenant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_tenantId_key" ON "BusinessProfile"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandKit_tenantId_key" ON "BrandKit"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PostAnalytics_postId_key" ON "PostAnalytics"("postId");

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandKit" ADD CONSTRAINT "BrandKit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedPage" ADD CONSTRAINT "ConnectedPage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdAccount" ADD CONSTRAINT "AdAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAnalytics" ADD CONSTRAINT "PostAnalytics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCalendar" ADD CONSTRAINT "ContentCalendar_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdRecommendation" ADD CONSTRAINT "AdRecommendation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
