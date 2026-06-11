-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'WELCOME';
ALTER TYPE "NotificationType" ADD VALUE 'WELCOME_BACK';
ALTER TYPE "NotificationType" ADD VALUE 'SESSION_REMINDER_24H';
ALTER TYPE "NotificationType" ADD VALUE 'SESSION_REMINDER_1H';
ALTER TYPE "NotificationType" ADD VALUE 'SESSION_FEEDBACK_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'BLOG_COMMENT_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_ACTIVITY_DIGEST';
ALTER TYPE "NotificationType" ADD VALUE 'MONTHLY_RECAP';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "email_delivery_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_delivery_logs_userId_sentAt_idx" ON "email_delivery_logs"("userId", "sentAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "email_delivery_logs_kind_dedupeKey_key" ON "email_delivery_logs"("kind", "dedupeKey");

-- AddForeignKey
ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
