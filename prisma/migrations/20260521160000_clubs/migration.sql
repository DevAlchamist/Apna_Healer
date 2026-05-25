-- CreateEnum
CREATE TYPE "ClubStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ClubVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ClubRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClubMembershipRole" AS ENUM ('OWNER', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "ClubMembershipStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "ClubBillingAttemptStatus" AS ENUM ('SUCCESS', 'FAILED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_CREATION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_CREATION_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_JOIN_REQUEST_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_JOIN_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_JOIN_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_SUBSCRIPTION_CHARGED';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_SUBSCRIPTION_FAILED';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_MEMBER_PAYMENT_OVERDUE';

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CLUB_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CLUB_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CLUB_CREATION_REVIEWED';
ALTER TYPE "AuditAction" ADD VALUE 'CLUB_JOIN_REVIEWED';
ALTER TYPE "AuditAction" ADD VALUE 'CLUB_MEMBERSHIP_BILLING';

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT,
    "purpose" TEXT,
    "heroImageUrl" TEXT,
    "galleryUrls" JSONB NOT NULL DEFAULT '[]',
    "monthlyFee" DECIMAL(12,2) NOT NULL,
    "status" "ClubStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "ClubVisibility" NOT NULL DEFAULT 'PUBLIC',
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_onboarding_steps" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "question" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "club_onboarding_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_reviews" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "authorLabel" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "rating" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_creation_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ClubRequestStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT,
    "purpose" TEXT,
    "heroImageUrl" TEXT,
    "galleryUrls" JSONB NOT NULL DEFAULT '[]',
    "monthlyFee" DECIMAL(12,2) NOT NULL,
    "onboardingSteps" JSONB NOT NULL DEFAULT '[]',
    "adminNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdClubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_creation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_join_requests" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ClubRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_memberships" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClubMembershipRole" NOT NULL DEFAULT 'MEMBER',
    "status" "ClubMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextBillingAt" TIMESTAMP(3),
    "lastPaidAt" TIMESTAMP(3),
    "lastTransactionId" TEXT,
    "billingFailCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_billing_attempts" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "ClubBillingAttemptStatus" NOT NULL,
    "transactionId" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_billing_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clubs_slug_key" ON "clubs"("slug");

-- CreateIndex
CREATE INDEX "clubs_status_visibility_idx" ON "clubs"("status", "visibility");

-- CreateIndex
CREATE INDEX "clubs_ownerUserId_idx" ON "clubs"("ownerUserId");

-- CreateIndex
CREATE INDEX "club_onboarding_steps_clubId_sortOrder_idx" ON "club_onboarding_steps"("clubId", "sortOrder");

-- CreateIndex
CREATE INDEX "club_reviews_clubId_sortOrder_idx" ON "club_reviews"("clubId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "club_creation_requests_createdClubId_key" ON "club_creation_requests"("createdClubId");

-- CreateIndex
CREATE INDEX "club_creation_requests_status_createdAt_idx" ON "club_creation_requests"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "club_creation_requests_userId_idx" ON "club_creation_requests"("userId");

-- CreateIndex
CREATE INDEX "club_join_requests_clubId_status_idx" ON "club_join_requests"("clubId", "status");

-- CreateIndex
CREATE INDEX "club_join_requests_userId_status_idx" ON "club_join_requests"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "club_memberships_clubId_userId_key" ON "club_memberships"("clubId", "userId");

-- CreateIndex
CREATE INDEX "club_memberships_userId_status_idx" ON "club_memberships"("userId", "status");

-- CreateIndex
CREATE INDEX "club_memberships_clubId_status_idx" ON "club_memberships"("clubId", "status");

-- CreateIndex
CREATE INDEX "club_memberships_status_nextBillingAt_idx" ON "club_memberships"("status", "nextBillingAt");

-- CreateIndex
CREATE INDEX "club_billing_attempts_membershipId_createdAt_idx" ON "club_billing_attempts"("membershipId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_onboarding_steps" ADD CONSTRAINT "club_onboarding_steps_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_reviews" ADD CONSTRAINT "club_reviews_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_creation_requests" ADD CONSTRAINT "club_creation_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_creation_requests" ADD CONSTRAINT "club_creation_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_creation_requests" ADD CONSTRAINT "club_creation_requests_createdClubId_fkey" FOREIGN KEY ("createdClubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_join_requests" ADD CONSTRAINT "club_join_requests_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_join_requests" ADD CONSTRAINT "club_join_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_join_requests" ADD CONSTRAINT "club_join_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_billing_attempts" ADD CONSTRAINT "club_billing_attempts_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "club_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
