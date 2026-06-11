import { BlogReportStatus, BlogReportTargetType, BlogStatus } from "@prisma/client";
import { ApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import type { ApiBlogReport } from "@/types/api";
import type { blogReportSchema, reviewBlogReportSchema } from "@/lib/validators/blog";
import type { z } from "zod";
import { recordAuditLog } from "@/server/services/audit-log-service";

type ReportInput = z.infer<typeof blogReportSchema>;
type ReviewReportInput = z.infer<typeof reviewBlogReportSchema>;

async function getPublishedBlogBySlug(slug: string) {
  const blog = await prisma.blog.findFirst({
    where: { slug, status: BlogStatus.PUBLISHED },
  });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");
  return blog;
}

export async function toggleBlogLike(slug: string, userId: string) {
  const blog = await getPublishedBlogBySlug(slug);
  const existing = await prisma.blogLike.findUnique({
    where: { blogId_userId: { blogId: blog.id, userId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.blogLike.delete({ where: { id: existing.id } }),
      prisma.blog.update({
        where: { id: blog.id },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
    return { liked: false, likeCount: Math.max(0, blog.likeCount - 1) };
  }

  await prisma.$transaction([
    prisma.blogLike.create({ data: { blogId: blog.id, userId } }),
    prisma.blog.update({
      where: { id: blog.id },
      data: { likeCount: { increment: 1 } },
    }),
  ]);
  return { liked: true, likeCount: blog.likeCount + 1 };
}

export async function recordBlogView(
  slug: string,
  sessionHash: string,
  viewerId?: string | null,
) {
  const blog = await getPublishedBlogBySlug(slug);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.blogView.findFirst({
    where: {
      blogId: blog.id,
      sessionHash,
      createdAt: { gte: since },
    },
  });
  if (recent) {
    return { viewCount: blog.viewCount, counted: false };
  }

  await prisma.$transaction(async (tx) => {
    await tx.blogView.create({
      data: {
        blogId: blog.id,
        sessionHash,
        viewerId: viewerId ?? null,
      },
    });
    await tx.blog.update({
      where: { id: blog.id },
      data: { viewCount: { increment: 1 } },
    });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await tx.blogAnalyticsDaily.upsert({
      where: { blogId_date: { blogId: blog.id, date: today } },
      update: { views: { increment: 1 } },
      create: { blogId: blog.id, date: today, views: 1 },
    });
  });

  return { viewCount: blog.viewCount + 1, counted: true };
}

export async function reportBlog(slug: string, reporterId: string, input: ReportInput) {
  const blog = await getPublishedBlogBySlug(slug);
  const report = await prisma.blogReport.create({
    data: {
      targetType: BlogReportTargetType.BLOG,
      targetId: blog.id,
      blogId: blog.id,
      reporterId,
      reason: input.reason,
    },
    include: {
      reporter: { select: { id: true, name: true, image: true, role: true } },
    },
  });

  return {
    id: report.id,
    targetType: report.targetType,
    targetId: report.targetId,
    blogId: report.blogId,
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    reviewedAt: null,
    reviewNote: null,
    reporter: {
      id: report.reporter.id,
      name: report.reporter.name,
      image: report.reporter.image,
      role: report.reporter.role,
    },
  } satisfies ApiBlogReport;
}

export async function reportComment(
  slug: string,
  commentId: string,
  reporterId: string,
  input: ReportInput,
) {
  const blog = await getPublishedBlogBySlug(slug);
  const comment = await prisma.blogComment.findFirst({
    where: { id: commentId, blogId: blog.id },
  });
  if (!comment) throw new ApiError(404, "Comment not found.", "NOT_FOUND");

  const report = await prisma.blogReport.create({
    data: {
      targetType: BlogReportTargetType.COMMENT,
      targetId: commentId,
      blogId: blog.id,
      reporterId,
      reason: input.reason,
    },
    include: {
      reporter: { select: { id: true, name: true, image: true, role: true } },
    },
  });

  return {
    id: report.id,
    targetType: report.targetType,
    targetId: report.targetId,
    blogId: report.blogId,
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    reviewedAt: null,
    reviewNote: null,
    reporter: {
      id: report.reporter.id,
      name: report.reporter.name,
      image: report.reporter.image,
      role: report.reporter.role,
    },
  } satisfies ApiBlogReport;
}

export async function getUserLikedBlog(slug: string, userId: string) {
  const blog = await getPublishedBlogBySlug(slug);
  const like = await prisma.blogLike.findUnique({
    where: { blogId_userId: { blogId: blog.id, userId } },
  });
  return Boolean(like);
}

export async function listBlogReports(status?: BlogReportStatus) {
  const reports = await prisma.blogReport.findMany({
    where: status ? { status } : undefined,
    include: {
      reporter: { select: { id: true, name: true, image: true, role: true } },
      blog: { select: { id: true, slug: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return reports.map((report) => ({
    id: report.id,
    targetType: report.targetType,
    targetId: report.targetId,
    blogId: report.blogId,
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    reviewedAt: report.reviewedAt?.toISOString() ?? null,
    reviewNote: report.reviewNote,
    reporter: {
      id: report.reporter.id,
      name: report.reporter.name,
      image: report.reporter.image,
      role: report.reporter.role,
    },
    blog: report.blog,
  })) satisfies ApiBlogReport[];
}

export async function reviewBlogReport(
  reportId: string,
  adminId: string,
  input: ReviewReportInput,
) {
  const report = await prisma.blogReport.update({
    where: { id: reportId },
    data: {
      status: input.status,
      reviewedById: adminId,
      reviewedAt: new Date(),
      reviewNote: input.reviewNote ?? null,
    },
    include: {
      reporter: { select: { id: true, name: true, image: true, role: true } },
      blog: { select: { id: true, slug: true, title: true } },
    },
  });

  await recordAuditLog({
    action: "BLOG_REPORT_REVIEWED",
    actorId: adminId,
    targetType: "BlogReport",
    targetId: reportId,
    summary: `Blog report marked ${input.status.toLowerCase()}.`,
  });

  return {
    id: report.id,
    targetType: report.targetType,
    targetId: report.targetId,
    blogId: report.blogId,
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    reviewedAt: report.reviewedAt?.toISOString() ?? null,
    reviewNote: report.reviewNote,
    reporter: {
      id: report.reporter.id,
      name: report.reporter.name,
      image: report.reporter.image,
      role: report.reporter.role,
    },
    blog: report.blog,
  } satisfies ApiBlogReport;
}
