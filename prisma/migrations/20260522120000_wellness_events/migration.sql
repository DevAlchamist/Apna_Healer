-- CreateEnum
CREATE TYPE "WellnessEventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WellnessEventMode" AS ENUM ('VIRTUAL', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "EventRegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_REGISTRATION_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_REGISTRATION_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_REGISTRATION_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_CANCELLED';

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'EVENT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'EVENT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'EVENT_REGISTRATION_CREATED';

-- CreateTable
CREATE TABLE "wellness_events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clubId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "organizedByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "category" TEXT,
    "heroImageUrl" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "venue" TEXT,
    "mode" "WellnessEventMode" NOT NULL DEFAULT 'IN_PERSON',
    "capacity" INTEGER NOT NULL,
    "seatsRemaining" INTEGER NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "memberPrice" DECIMAL(12,2),
    "guestPrice" DECIMAL(12,2),
    "membersPay" BOOLEAN NOT NULL DEFAULT true,
    "nonMembersPay" BOOLEAN NOT NULL DEFAULT true,
    "status" "WellnessEventStatus" NOT NULL DEFAULT 'DRAFT',
    "facilitatorName" TEXT,
    "facilitatorRole" TEXT,
    "facilitatorImage" TEXT,
    "facilitatorBio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wellness_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountCharged" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentMethod" "BookingPaymentMethod",
    "status" "EventRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "isClubMemberAtBooking" BOOLEAN NOT NULL DEFAULT false,
    "transactionId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wellness_events_slug_key" ON "wellness_events"("slug");

-- CreateIndex
CREATE INDEX "wellness_events_status_startsAt_idx" ON "wellness_events"("status", "startsAt");

-- CreateIndex
CREATE INDEX "wellness_events_clubId_status_idx" ON "wellness_events"("clubId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_eventId_userId_key" ON "event_registrations"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_registrations_eventId_status_idx" ON "event_registrations"("eventId", "status");

-- CreateIndex
CREATE INDEX "event_registrations_userId_status_idx" ON "event_registrations"("userId", "status");

-- AddForeignKey
ALTER TABLE "wellness_events" ADD CONSTRAINT "wellness_events_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wellness_events" ADD CONSTRAINT "wellness_events_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wellness_events" ADD CONSTRAINT "wellness_events_organizedByUserId_fkey" FOREIGN KEY ("organizedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "wellness_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
