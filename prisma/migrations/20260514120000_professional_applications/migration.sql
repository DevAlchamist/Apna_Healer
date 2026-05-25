-- CreateEnum
CREATE TYPE "ProfessionalApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "professional_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ApplicationType" NOT NULL,
    "status" "ProfessionalApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "applicationData" JSONB NOT NULL,
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "professional_applications_userId_createdAt_idx" ON "professional_applications"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "professional_applications_status_type_createdAt_idx" ON "professional_applications"("status", "type", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "professional_applications" ADD CONSTRAINT "professional_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy applications (REVIEWING -> PENDING)
INSERT INTO "professional_applications" ("id", "userId", "type", "status", "applicationData", "adminNote", "reviewedBy", "reviewedAt", "createdAt", "updatedAt")
SELECT
    a."id",
    a."userId",
    a."type",
    CASE a."status"::text
        WHEN 'REVIEWING' THEN 'PENDING'::"ProfessionalApplicationStatus"
        WHEN 'PENDING' THEN 'PENDING'::"ProfessionalApplicationStatus"
        WHEN 'APPROVED' THEN 'APPROVED'::"ProfessionalApplicationStatus"
        WHEN 'REJECTED' THEN 'REJECTED'::"ProfessionalApplicationStatus"
        ELSE 'PENDING'::"ProfessionalApplicationStatus"
    END,
    COALESCE(a."metadata", '{}'::jsonb) || jsonb_build_object(
        'bio', NULLIF(a."headline", ''),
        'summary', NULLIF(a."experience", ''),
        'migratedFromLegacyApplications', true
    ),
    NULLIF(TRIM(COALESCE(a."metadata"::jsonb->>'reviewNote', '')), ''),
    a."reviewedBy",
    a."reviewedAt",
    a."createdAt",
    a."updatedAt"
FROM "applications" a;

-- DropTable
DROP TABLE "applications";

-- DropEnum
DROP TYPE "ApplicationStatus";

-- AlterTable
ALTER TABLE "listener_profiles" ADD COLUMN "emotionalStrengths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "listener_profiles" ADD COLUMN "availability" JSONB;

-- AlterTable
ALTER TABLE "listener_profiles" ADD COLUMN "rating" DECIMAL(3,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "listener_profiles" ADD COLUMN "totalSessions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "therapist_profiles" ADD COLUMN "certifications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "therapist_profiles" ADD COLUMN "experienceYears" INTEGER;

-- AlterTable
ALTER TABLE "therapist_profiles" ADD COLUMN "availability" JSONB;

-- AlterTable
ALTER TABLE "therapist_profiles" ADD COLUMN "links" JSONB;

-- AlterTable
ALTER TABLE "therapist_profiles" ADD COLUMN "rating" DECIMAL(3,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "therapist_profiles" ADD COLUMN "totalSessions" INTEGER NOT NULL DEFAULT 0;
