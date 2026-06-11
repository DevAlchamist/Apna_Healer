import { BlogModerationActionType, BlogStatus } from "@prisma/client";
import { ApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { mapBlogSummary } from "@/server/services/blog-service";
import { recordAuditLog } from "@/server/services/audit-log-service";
import type { rejectBlogSchema } from "@/lib/validators/blog";
import type { z } from "zod";

type RejectInput = z.infer<typeof rejectBlogSchema>;

export async function approveBlog(blogId: string, adminId: string) {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
    include: {
      author: { select: { id: true, name: true, image: true, role: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");
  if (blog.status !== BlogStatus.PENDING_REVIEW) {
    throw new ApiError(400, "Only pending blogs can be approved.", "VALIDATION_ERROR");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.blog.update({
      where: { id: blogId },
      data: {
        status: BlogStatus.PUBLISHED,
        publishedAt: new Date(),
        moderatedById: adminId,
        rejectedAt: null,
        rejectionReason: null,
      },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
    await tx.blogModerationAction.create({
      data: {
        blogId,
        adminId,
        action: BlogModerationActionType.APPROVE,
      },
    });
    return row;
  });

  await recordAuditLog({
    action: "BLOG_APPROVED",
    actorId: adminId,
    targetType: "Blog",
    targetId: blogId,
    summary: `Blog "${updated.title}" approved.`,
  });

  return mapBlogSummary(updated);
}

export async function rejectBlog(blogId: string, adminId: string, input: RejectInput) {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
    include: {
      author: { select: { id: true, name: true, image: true, role: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.blog.update({
      where: { id: blogId },
      data: {
        status: BlogStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: input.reason,
        moderatedById: adminId,
        isFeatured: false,
      },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
    await tx.blogModerationAction.create({
      data: {
        blogId,
        adminId,
        action: BlogModerationActionType.REJECT,
        reason: input.reason,
      },
    });
    return row;
  });

  await recordAuditLog({
    action: "BLOG_REJECTED",
    actorId: adminId,
    targetType: "Blog",
    targetId: blogId,
    summary: `Blog "${updated.title}" rejected.`,
  });

  return mapBlogSummary(updated);
}

export async function adminUnpublishBlog(blogId: string, adminId: string, reason?: string) {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
    include: {
      author: { select: { id: true, name: true, image: true, role: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.blog.update({
      where: { id: blogId },
      data: {
        status: BlogStatus.UNPUBLISHED,
        isFeatured: false,
        moderatedById: adminId,
      },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
    await tx.blogModerationAction.create({
      data: {
        blogId,
        adminId,
        action: BlogModerationActionType.UNPUBLISH,
        reason: reason ?? null,
      },
    });
    return row;
  });

  await recordAuditLog({
    action: "BLOG_UNPUBLISHED",
    actorId: adminId,
    targetType: "Blog",
    targetId: blogId,
    summary: `Blog "${updated.title}" unpublished.`,
  });

  return mapBlogSummary(updated);
}

export async function featureBlog(blogId: string, adminId: string) {
  const blog = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");
  if (blog.status !== BlogStatus.PUBLISHED) {
    throw new ApiError(400, "Only published blogs can be featured.", "VALIDATION_ERROR");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.blog.updateMany({
      where: { isFeatured: true },
      data: { isFeatured: false },
    });
    const row = await tx.blog.update({
      where: { id: blogId },
      data: { isFeatured: true },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
    await tx.blogModerationAction.create({
      data: {
        blogId,
        adminId,
        action: BlogModerationActionType.FEATURE,
      },
    });
    return row;
  });

  await recordAuditLog({
    action: "BLOG_FEATURED",
    actorId: adminId,
    targetType: "Blog",
    targetId: blogId,
    summary: `Blog "${updated.title}" marked as featured.`,
  });

  return mapBlogSummary(updated);
}

export async function unfeatureBlog(blogId: string, adminId: string) {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
    include: {
      author: { select: { id: true, name: true, image: true, role: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.blog.update({
      where: { id: blogId },
      data: { isFeatured: false },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
    await tx.blogModerationAction.create({
      data: {
        blogId,
        adminId,
        action: BlogModerationActionType.UNFEATURE,
      },
    });
    return row;
  });

  return mapBlogSummary(updated);
}
