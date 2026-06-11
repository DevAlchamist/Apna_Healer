-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "BlogBlockType" AS ENUM ('HEADING', 'PARAGRAPH', 'LIST', 'QUOTE', 'CODE', 'DIVIDER', 'HIGHLIGHT', 'IMAGE', 'IMAGE_GALLERY', 'VIDEO_EMBED', 'BANNER');

-- CreateEnum
CREATE TYPE "BlogCommentStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "BlogModerationActionType" AS ENUM ('APPROVE', 'REJECT', 'UNPUBLISH', 'DELETE', 'FEATURE', 'UNFEATURE', 'COMMENT_HIDE', 'COMMENT_DELETE');

-- CreateEnum
CREATE TYPE "BlogReportTargetType" AS ENUM ('BLOG', 'COMMENT');

-- CreateEnum
CREATE TYPE "BlogReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'BLOG_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'BLOG_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'BLOG_PUBLISHED';
ALTER TYPE "AuditAction" ADD VALUE 'BLOG_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'BLOG_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'BLOG_UNPUBLISHED';
ALTER TYPE "AuditAction" ADD VALUE 'BLOG_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'BLOG_FEATURED';
ALTER TYPE "AuditAction" ADD VALUE 'BLOG_COMMENT_MODERATED';
ALTER TYPE "AuditAction" ADD VALUE 'BLOG_REPORT_REVIEWED';

-- CreateTable
CREATE TABLE "blogs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "coverImageUrl" TEXT,
    "excerpt" TEXT,
    "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "readingTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "moderatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_blocks" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "type" "BlogBlockType" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_category_on_blog" (
    "blogId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "blog_category_on_blog_pkey" PRIMARY KEY ("blogId","categoryId")
);

-- CreateTable
CREATE TABLE "blog_tags" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_tag_on_blog" (
    "blogId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "blog_tag_on_blog_pkey" PRIMARY KEY ("blogId","tagId")
);

-- CreateTable
CREATE TABLE "blog_comments" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "status" "BlogCommentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_likes" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_views" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "viewerId" TEXT,
    "sessionHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_reports" (
    "id" TEXT NOT NULL,
    "targetType" "BlogReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "blogId" TEXT,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "BlogReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_moderation_actions" (
    "id" TEXT NOT NULL,
    "blogId" TEXT,
    "commentId" TEXT,
    "adminId" TEXT NOT NULL,
    "action" "BlogModerationActionType" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_analytics_daily" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_analytics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blogs_slug_key" ON "blogs"("slug");

-- CreateIndex
CREATE INDEX "blogs_authorId_status_updatedAt_idx" ON "blogs"("authorId", "status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "blogs_status_publishedAt_idx" ON "blogs"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "blogs_isFeatured_status_idx" ON "blogs"("isFeatured", "status");

-- CreateIndex
CREATE INDEX "blog_blocks_blogId_sortOrder_idx" ON "blog_blocks"("blogId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "blog_blocks_blogId_sortOrder_key" ON "blog_blocks"("blogId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tags_slug_key" ON "blog_tags"("slug");

-- CreateIndex
CREATE INDEX "blog_comments_blogId_status_createdAt_idx" ON "blog_comments"("blogId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "blog_comments_userId_createdAt_idx" ON "blog_comments"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "blog_likes_blogId_idx" ON "blog_likes"("blogId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_likes_blogId_userId_key" ON "blog_likes"("blogId", "userId");

-- CreateIndex
CREATE INDEX "blog_views_blogId_sessionHash_createdAt_idx" ON "blog_views"("blogId", "sessionHash", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "blog_views_blogId_createdAt_idx" ON "blog_views"("blogId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "blog_reports_status_createdAt_idx" ON "blog_reports"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "blog_reports_targetType_targetId_idx" ON "blog_reports"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "blog_moderation_actions_blogId_createdAt_idx" ON "blog_moderation_actions"("blogId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "blog_moderation_actions_adminId_createdAt_idx" ON "blog_moderation_actions"("adminId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "blog_analytics_daily_blogId_date_key" ON "blog_analytics_daily"("blogId", "date");

-- CreateIndex
CREATE INDEX "blog_analytics_daily_date_idx" ON "blog_analytics_daily"("date");

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_blocks" ADD CONSTRAINT "blog_blocks_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_category_on_blog" ADD CONSTRAINT "blog_category_on_blog_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_category_on_blog" ADD CONSTRAINT "blog_category_on_blog_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_tag_on_blog" ADD CONSTRAINT "blog_tag_on_blog_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_tag_on_blog" ADD CONSTRAINT "blog_tag_on_blog_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "blog_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "blog_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_likes" ADD CONSTRAINT "blog_likes_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_likes" ADD CONSTRAINT "blog_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_views" ADD CONSTRAINT "blog_views_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_views" ADD CONSTRAINT "blog_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_reports" ADD CONSTRAINT "blog_reports_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_reports" ADD CONSTRAINT "blog_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_reports" ADD CONSTRAINT "blog_reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_moderation_actions" ADD CONSTRAINT "blog_moderation_actions_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_moderation_actions" ADD CONSTRAINT "blog_moderation_actions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_analytics_daily" ADD CONSTRAINT "blog_analytics_daily_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
