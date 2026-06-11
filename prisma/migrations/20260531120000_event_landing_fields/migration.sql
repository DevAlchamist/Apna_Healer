-- AlterTable
ALTER TABLE "wellness_events" ADD COLUMN "journeyPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "audienceText" TEXT,
ADD COLUMN "testimonialQuote" TEXT,
ADD COLUMN "testimonialAuthor" TEXT;
