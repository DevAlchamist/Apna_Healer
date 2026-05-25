-- CreateEnum
CREATE TYPE "JournalEntryStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "JournalCardVariant" AS ENUM ('REFLECTION', 'IMAGE', 'QUOTE', 'LIST', 'DARK');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'JOURNAL_REMINDER';

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "journalDate" DATE NOT NULL,
    "title" TEXT,
    "contentHtml" TEXT NOT NULL,
    "contentPlain" TEXT,
    "mood" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coverImageUrl" TEXT,
    "cardVariant" "JournalCardVariant" NOT NULL DEFAULT 'REFLECTION',
    "status" "JournalEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "journal_entries_userId_status_journalDate_idx" ON "journal_entries"("userId", "status", "journalDate" DESC);

-- CreateIndex
CREATE INDEX "journal_entries_userId_journalDate_idx" ON "journal_entries"("userId", "journalDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_userId_journalDate_key" ON "journal_entries"("userId", "journalDate");

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
