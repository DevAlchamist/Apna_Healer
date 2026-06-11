-- CreateTable
CREATE TABLE "daily_quotes" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "author" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_quotes_isActive_sortOrder_idx" ON "daily_quotes"("isActive", "sortOrder");

-- AlterTable
ALTER TABLE "daily_quotes" ALTER COLUMN "updatedAt" DROP DEFAULT;
