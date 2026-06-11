-- AlterTable
ALTER TABLE "clubs" ADD COLUMN "heroTagline" TEXT,
ADD COLUMN "pulseQuote" TEXT,
ADD COLUMN "ritualsIntro" TEXT,
ADD COLUMN "voicesQuote" TEXT,
ADD COLUMN "finalCtaText" TEXT,
ADD COLUMN "landingFeatures" JSONB,
ADD COLUMN "landingRituals" JSONB;

-- AlterTable
ALTER TABLE "club_reviews" ADD COLUMN "memberSince" TEXT;

-- AlterTable
ALTER TABLE "club_creation_requests" ADD COLUMN "landingPageData" JSONB;
