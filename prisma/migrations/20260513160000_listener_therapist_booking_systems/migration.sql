-- CreateEnum
CREATE TYPE "ListenerRequestStatus" AS ENUM ('PENDING', 'ASSIGNED', 'APPROVED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ListenerConfirmation" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "SessionLogEvent" AS ENUM ('BOOKED', 'ASSIGNED', 'APPROVED', 'STARTED', 'ENDED', 'CANCELLED', 'REVIEW_SUBMITTED');

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_bookingId_fkey";

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "bookingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "listenerRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sessions_listenerRequestId_key" ON "sessions"("listenerRequestId");

-- CreateTable
CREATE TABLE "listener_availability" (
    "id" TEXT NOT NULL,
    "listenerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listener_availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listener_availability_listenerId_dayOfWeek_isActive_idx" ON "listener_availability"("listenerId", "dayOfWeek", "isActive");

-- CreateTable
CREATE TABLE "therapist_availability" (
    "id" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 60,
    "breakDuration" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapist_availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "therapist_availability_therapistId_dayOfWeek_isActive_idx" ON "therapist_availability"("therapistId", "dayOfWeek", "isActive");

-- CreateTable
CREATE TABLE "listener_booking_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "emotionalTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredTone" TEXT,
    "preferredLanguage" TEXT,
    "note" TEXT,
    "assignedListenerId" TEXT,
    "status" "ListenerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "listenerConfirmation" "ListenerConfirmation" NOT NULL DEFAULT 'PENDING',
    "amountHeld" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "holdTransactionId" TEXT,
    "captureTransactionId" TEXT,
    "releaseTransactionId" TEXT,
    "metadata" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listener_booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listener_booking_requests_userId_createdAt_idx" ON "listener_booking_requests"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "listener_booking_requests_status_createdAt_idx" ON "listener_booking_requests"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "listener_booking_requests_assignedListenerId_listenerConfir_idx" ON "listener_booking_requests"("assignedListenerId", "listenerConfirmation", "createdAt" DESC);

-- CreateTable
CREATE TABLE "session_logs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "event" "SessionLogEvent" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_logs_sessionId_createdAt_idx" ON "session_logs"("sessionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "session_logs_event_createdAt_idx" ON "session_logs"("event", "createdAt" DESC);

-- CreateTable
CREATE TABLE "session_reviews" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_reviews_sessionId_reviewerId_key" ON "session_reviews"("sessionId", "reviewerId");

-- CreateIndex
CREATE INDEX "session_reviews_revieweeId_createdAt_idx" ON "session_reviews"("revieweeId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_listenerRequestId_fkey" FOREIGN KEY ("listenerRequestId") REFERENCES "listener_booking_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listener_availability" ADD CONSTRAINT "listener_availability_listenerId_fkey" FOREIGN KEY ("listenerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_availability" ADD CONSTRAINT "therapist_availability_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listener_booking_requests" ADD CONSTRAINT "listener_booking_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listener_booking_requests" ADD CONSTRAINT "listener_booking_requests_assignedListenerId_fkey" FOREIGN KEY ("assignedListenerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_reviews" ADD CONSTRAINT "session_reviews_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_reviews" ADD CONSTRAINT "session_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_reviews" ADD CONSTRAINT "session_reviews_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
