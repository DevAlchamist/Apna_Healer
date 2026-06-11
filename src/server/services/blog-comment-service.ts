import { BlogCommentStatus, BlogStatus, Role, type Prisma } from "@prisma/client";
import { assertCommentAuthorOrAdmin, isAdminRole } from "@/lib/authz";
import { ApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import type { ApiBlogComment } from "@/types/api";
import type { blogCommentSchema, updateBlogCommentSchema } from "@/lib/validators/blog";
import type { z } from "zod";
import { createNotification } from "@/server/services/notification-service";
import { truncateText } from "@/server/emails/render";

type CreateCommentInput = z.infer<typeof blogCommentSchema>;
type UpdateCommentInput = z.infer<typeof updateBlogCommentSchema>;

const commentInclude = {
  user: { select: { id: true, name: true, image: true, role: true } },
} satisfies Prisma.BlogCommentInclude;

function mapComment(comment: Prisma.BlogCommentGetPayload<{ include: typeof commentInclude }>): ApiBlogComment {
  return {
    id: comment.id,
    blogId: comment.blogId,
    content: comment.content,
    status: comment.status,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    parentId: comment.parentId,
    user: {
      id: comment.user.id,
      name: comment.user.name,
      image: comment.user.image,
      role: comment.user.role,
    },
  };
}

async function getPublishedBlogBySlug(slug: string) {
  const blog = await prisma.blog.findFirst({
    where: { slug, status: BlogStatus.PUBLISHED },
  });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");
  return blog;
}

export async function listBlogComments(slug: string): Promise<ApiBlogComment[]> {
  const blog = await getPublishedBlogBySlug(slug);
  const comments = await prisma.blogComment.findMany({
    where: { blogId: blog.id, status: BlogCommentStatus.ACTIVE, parentId: null },
    include: {
      ...commentInclude,
      replies: {
        where: { status: BlogCommentStatus.ACTIVE },
        include: commentInclude,
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return comments.map((comment) => ({
    ...mapComment(comment),
    replies: comment.replies.map(mapComment),
  }));
}

export async function createBlogComment(
  slug: string,
  userId: string,
  input: CreateCommentInput,
): Promise<ApiBlogComment> {
  const blog = await getPublishedBlogBySlug(slug);

  if (input.parentId) {
    const parent = await prisma.blogComment.findFirst({
      where: { id: input.parentId, blogId: blog.id, status: BlogCommentStatus.ACTIVE },
    });
    if (!parent) throw new ApiError(404, "Parent comment not found.", "NOT_FOUND");
  }

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.blogComment.create({
      data: {
        blogId: blog.id,
        userId,
        parentId: input.parentId ?? null,
        content: input.content,
      },
      include: commentInclude,
    });
    await tx.blog.update({
      where: { id: blog.id },
      data: { commentCount: { increment: 1 } },
    });
    return created;
  });

  if (blog.authorId !== userId) {
    const author = await prisma.user.findUnique({
      where: { id: blog.authorId },
      select: { id: true },
    });
    if (author) {
      void createNotification({
        userId: blog.authorId,
        type: "BLOG_COMMENT_RECEIVED",
        title: "New comment on your blog",
        body: `${comment.user.name ?? "Someone"} commented on "${blog.title}".`,
        href: `/blog/${blog.slug}`,
        metadata: {
          actorName: comment.user.name ?? "Someone",
          actorImageUrl: comment.user.image,
          blogTitle: blog.title,
          blogSlug: blog.slug,
          commentExcerpt: truncateText(comment.content, 200),
        },
      }).catch((err) => console.error("[blog-comment] notification failed:", err));
    }
  }

  return mapComment(comment);
}

export async function updateBlogComment(
  slug: string,
  commentId: string,
  actorId: string,
  actorRole: Role,
  input: UpdateCommentInput,
): Promise<ApiBlogComment> {
  const blog = await getPublishedBlogBySlug(slug);
  const comment = await prisma.blogComment.findFirst({
    where: { id: commentId, blogId: blog.id },
    include: commentInclude,
  });
  if (!comment) throw new ApiError(404, "Comment not found.", "NOT_FOUND");
  assertCommentAuthorOrAdmin({ actorId, actorRole }, comment.userId);

  const updated = await prisma.blogComment.update({
    where: { id: commentId },
    data: { content: input.content },
    include: commentInclude,
  });
  return mapComment(updated);
}

export async function deleteBlogComment(
  slug: string,
  commentId: string,
  actorId: string,
  actorRole: Role,
) {
  const blog = await getPublishedBlogBySlug(slug);
  const comment = await prisma.blogComment.findFirst({
    where: { id: commentId, blogId: blog.id },
  });
  if (!comment) throw new ApiError(404, "Comment not found.", "NOT_FOUND");
  assertCommentAuthorOrAdmin({ actorId, actorRole }, comment.userId);

  await prisma.$transaction(async (tx) => {
    await tx.blogComment.update({
      where: { id: commentId },
      data: { status: BlogCommentStatus.DELETED, content: "[deleted]" },
    });
    if (comment.status === BlogCommentStatus.ACTIVE) {
      await tx.blog.update({
        where: { id: blog.id },
        data: { commentCount: { decrement: 1 } },
      });
    }
  });
}

export async function listCommentsForAdmin(filters: {
  status?: BlogCommentStatus;
  take?: number;
}) {
  const take = filters.take ?? 50;
  const comments = await prisma.blogComment.findMany({
    where: filters.status ? { status: filters.status } : undefined,
    include: {
      ...commentInclude,
      blog: { select: { id: true, slug: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return comments.map((comment) => ({
    ...mapComment(comment),
    blog: comment.blog,
  }));
}

export async function moderateComment(
  commentId: string,
  adminId: string,
  status: BlogCommentStatus,
) {
  const comment = await prisma.blogComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new ApiError(404, "Comment not found.", "NOT_FOUND");

  const updated = await prisma.blogComment.update({
    where: { id: commentId },
    data: { status },
    include: commentInclude,
  });

  if (!isAdminRole(Role.ADMIN)) {
    // noop - admin only route
  }

  await prisma.blogModerationAction.create({
    data: {
      commentId,
      blogId: comment.blogId,
      adminId,
      action: status === BlogCommentStatus.HIDDEN ? "COMMENT_HIDE" : "COMMENT_DELETE",
    },
  });

  return mapComment(updated);
}

export async function adminDeleteComment(commentId: string, adminId: string) {
  return moderateComment(commentId, adminId, BlogCommentStatus.DELETED);
}
