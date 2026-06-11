-- AlterTable
ALTER TABLE "club_creation_requests" ADD COLUMN "reviews" JSONB NOT NULL DEFAULT '[]';
