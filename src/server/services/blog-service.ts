import {
  BlogCommentStatus,
  BlogReportStatus,
  BlogReportTargetType,
  BlogStatus,
  Role,
  type Prisma,
} from "@prisma/client";
import { assertBlogAuthorOrAdmin, assertCommentAuthorOrAdmin, isAdminRole } from "@/lib/authz";
import { computeReadingTime, generateExcerpt, slugifyBlogTag, type BlogBlockInput } from "@/lib/blog-blocks";
import { ApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import type {
  ApiBlogAuthorStats,
  ApiBlogDetail,
  ApiBlogListResponse,
  ApiBlogSummary,
} from "@/types/api";
import type { createBlogSchema, updateBlogSchema } from "@/lib/validators/blog";
import type { z } from "zod";
import { getBlogBlocks, replaceBlogBlocks } from "@/server/services/blog-block-service";
import { resolvePublishStatus, uniqueBlogSlug } from "@/server/services/blog-utils";
import { recordAuditLog } from "@/server/services/audit-log-service";

type CreateBlogInput = z.infer<typeof createBlogSchema>;
type UpdateBlogInput = z.infer<typeof updateBlogSchema>;

const DEFAULT_TAKE = 24;

const blogInclude = {
  author: { select: { id: true, name: true, image: true, role: true } },
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.BlogInclude;

type BlogRow = Prisma.BlogGetPayload<{ include: typeof blogInclude }>;

function mapCategory(row: BlogRow["categories"][number]) {
  return {
    id: row.category.id,
    slug: row.category.slug,
    name: row.category.name,
  };
}

function mapTag(row: BlogRow["tags"][number]) {
  return {
    id: row.tag.id,
    slug: row.tag.slug,
    name: row.tag.name,
  };
}

function mapSummary(blog: BlogRow): ApiBlogSummary {
  return {
    id: blog.id,
    slug: blog.slug,
    title: blog.title,
    subtitle: blog.subtitle,
    excerpt: blog.excerpt,
    coverImageUrl: blog.coverImageUrl,
    status: blog.status,
    isFeatured: blog.isFeatured,
    readingTimeMinutes: blog.readingTimeMinutes,
    viewCount: blog.viewCount,
    likeCount: blog.likeCount,
    commentCount: blog.commentCount,
    publishedAt: blog.publishedAt?.toISOString() ?? null,
    rejectedAt: blog.rejectedAt?.toISOString() ?? null,
    rejectionReason: blog.rejectionReason,
    createdAt: blog.createdAt.toISOString(),
    updatedAt: blog.updatedAt.toISOString(),
    author: {
      id: blog.author.id,
      name: blog.author.name,
      image: blog.author.image,
      role: blog.author.role,
    },
    categories: blog.categories.map(mapCategory),
    tags: blog.tags.map(mapTag),
  };
}

async function syncCategories(blogId: string, categoryIds: string[] | undefined) {
  if (!categoryIds) return;
  await prisma.blogCategoryOnBlog.deleteMany({ where: { blogId } });
  if (categoryIds.length === 0) return;
  await prisma.blogCategoryOnBlog.createMany({
    data: categoryIds.map((categoryId) => ({ blogId, categoryId })),
    skipDuplicates: true,
  });
}

async function syncTags(blogId: string, tagNames: string[] | undefined) {
  if (!tagNames) return;
  await prisma.blogTagOnBlog.deleteMany({ where: { blogId } });
  for (const name of tagNames) {
    const slug = slugifyBlogTag(name);
    const tag = await prisma.blogTag.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
    await prisma.blogTagOnBlog.create({
      data: { blogId, tagId: tag.id },
    });
  }
}

export async function createBlog(authorId: string, input: CreateBlogInput): Promise<ApiBlogDetail> {
  const slug = await uniqueBlogSlug(input.title, async (candidate) => {
    const existing = await prisma.blog.findUnique({ where: { slug: candidate } });
    return Boolean(existing);
  });

  const blocks = input.blocks ?? [];
  const blog = await prisma.blog.create({
    data: {
      slug,
      authorId,
      title: input.title,
      subtitle: input.subtitle ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
      excerpt: blocks.length ? generateExcerpt(blocks) : null,
      readingTimeMinutes: computeReadingTime(blocks),
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      seoKeywords: input.seoKeywords ?? [],
      status: BlogStatus.DRAFT,
    },
    include: blogInclude,
  });

  await syncCategories(blog.id, input.categoryIds);
  await syncTags(blog.id, input.tagNames);
  if (blocks.length) await replaceBlogBlocks(blog.id, blocks);

  const detail = await getBlogById(blog.id, authorId, Role.USER);
  await recordAuditLog({
    action: "BLOG_CREATED",
    actorId: authorId,
    targetType: "Blog",
    targetId: blog.id,
    summary: `Blog "${blog.title}" created.`,
  });
  return detail;
}

export async function updateBlog(
  blogId: string,
  actorId: string,
  actorRole: Role,
  input: UpdateBlogInput,
): Promise<ApiBlogDetail> {
  const existing = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!existing) throw new ApiError(404, "Blog not found.", "NOT_FOUND");
  assertBlogAuthorOrAdmin({ actorId, actorRole }, existing.authorId);

  let slug = existing.slug;
  if (input.title && input.title !== existing.title) {
    slug = await uniqueBlogSlug(input.title, async (candidate) => {
      if (candidate === existing.slug) return false;
      const found = await prisma.blog.findUnique({ where: { slug: candidate } });
      return Boolean(found);
    });
  }

  const blocks = input.blocks;
  const readingTimeMinutes = blocks ? computeReadingTime(blocks) : undefined;
  const excerpt = blocks ? generateExcerpt(blocks) : undefined;

  await prisma.blog.update({
    where: { id: blogId },
    data: {
      slug,
      title: input.title,
      subtitle: input.subtitle,
      coverImageUrl: input.coverImageUrl,
      excerpt,
      readingTimeMinutes,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      seoKeywords: input.seoKeywords,
    },
  });

  await syncCategories(blogId, input.categoryIds);
  await syncTags(blogId, input.tagNames);
  if (blocks) await replaceBlogBlocks(blogId, blocks);

  return getBlogById(blogId, actorId, actorRole);
}

export async function getBlogById(
  blogId: string,
  actorId: string,
  actorRole: Role,
  likedByMe = false,
): Promise<ApiBlogDetail> {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
    include: blogInclude,
  });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");
  if (!isAdminRole(actorRole) && blog.authorId !== actorId) {
    throw new ApiError(403, "You can only access your own blogs.", "FORBIDDEN");
  }

  const blocks = await getBlogBlocks(blogId);
  return {
    ...mapSummary(blog),
    seoTitle: blog.seoTitle,
    seoDescription: blog.seoDescription,
    seoKeywords: blog.seoKeywords,
    blocks,
    likedByMe,
  };
}

export async function listAuthorBlogs(
  authorId: string,
  filters: { status?: BlogStatus; q?: string; take?: number; cursor?: string },
): Promise<ApiBlogListResponse> {
  const take = filters.take ?? DEFAULT_TAKE;
  const where: Prisma.BlogWhereInput = {
    authorId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { subtitle: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.blog.findMany({
    where,
    include: blogInclude,
    orderBy: { updatedAt: "desc" },
    take: take + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  const total = await prisma.blog.count({ where });

  return {
    items: items.map(mapSummary),
    meta: {
      total,
      take,
      cursor: filters.cursor ?? null,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    },
  };
}

export async function publishBlog(blogId: string, actorId: string, actorRole: Role) {
  const blog = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");
  assertBlogAuthorOrAdmin({ actorId, actorRole }, blog.authorId);

  const nextStatusName = resolvePublishStatus(actorRole);
  const nextStatus = nextStatusName === "PUBLISHED" ? BlogStatus.PUBLISHED : BlogStatus.PENDING_REVIEW;
  const updated = await prisma.blog.update({
    where: { id: blogId },
    data: {
      status: nextStatus,
      publishedAt: nextStatus === BlogStatus.PUBLISHED ? new Date() : null,
      rejectedAt: null,
      rejectionReason: null,
    },
    include: blogInclude,
  });

  await recordAuditLog({
    action: nextStatus === BlogStatus.PUBLISHED ? "BLOG_PUBLISHED" : "BLOG_UPDATED",
    actorId,
    targetType: "Blog",
    targetId: blogId,
    summary:
      nextStatus === BlogStatus.PUBLISHED
        ? `Blog "${updated.title}" published.`
        : `Blog "${updated.title}" submitted for review.`,
  });

  return mapSummary(updated);
}

export async function unpublishBlog(blogId: string, actorId: string, actorRole: Role) {
  const blog = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");
  assertBlogAuthorOrAdmin({ actorId, actorRole }, blog.authorId);

  const updated = await prisma.blog.update({
    where: { id: blogId },
    data: {
      status: BlogStatus.DRAFT,
      isFeatured: false,
    },
    include: blogInclude,
  });

  return mapSummary(updated);
}

export async function deleteBlog(blogId: string, actorId: string, actorRole: Role) {
  const blog = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");
  assertBlogAuthorOrAdmin({ actorId, actorRole }, blog.authorId);

  if (!isAdminRole(actorRole) && !["DRAFT", "REJECTED"].includes(blog.status)) {
    throw new ApiError(400, "Only drafts or rejected blogs can be deleted.", "VALIDATION_ERROR");
  }

  await prisma.blog.delete({ where: { id: blogId } });
  await recordAuditLog({
    action: "BLOG_DELETED",
    actorId,
    targetType: "Blog",
    targetId: blogId,
    summary: `Blog "${blog.title}" deleted.`,
  });
}

export async function getAuthorStats(authorId: string): Promise<ApiBlogAuthorStats> {
  const [aggregates, statusCounts] = await Promise.all([
    prisma.blog.aggregate({
      where: { authorId },
      _sum: { viewCount: true, likeCount: true, commentCount: true },
    }),
    prisma.blog.groupBy({
      by: ["status"],
      where: { authorId },
      _count: { _all: true },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    statusCounts.map((row) => [row.status, row._count._all]),
  ) as Partial<Record<BlogStatus, number>>;

  return {
    totalViews: aggregates._sum.viewCount ?? 0,
    totalLikes: aggregates._sum.likeCount ?? 0,
    totalComments: aggregates._sum.commentCount ?? 0,
    publishedCount: countByStatus.PUBLISHED ?? 0,
    draftCount: countByStatus.DRAFT ?? 0,
    pendingCount: countByStatus.PENDING_REVIEW ?? 0,
  };
}

export async function getBlogPreview(blogId: string, actorId: string, actorRole: Role) {
  return getBlogById(blogId, actorId, actorRole);
}

export async function listAllBlogsForAdmin(
  filters: {
    status?: BlogStatus;
    q?: string;
    authorId?: string;
    category?: string;
    tag?: string;
    sort?: "newest" | "oldest" | "popular" | "views";
    take?: number;
    cursor?: string;
  },
): Promise<ApiBlogListResponse> {
  const take = filters.take ?? DEFAULT_TAKE;
  const orderBy: Prisma.BlogOrderByWithRelationInput =
    filters.sort === "oldest"
      ? { createdAt: "asc" }
      : filters.sort === "popular"
        ? { likeCount: "desc" }
        : filters.sort === "views"
          ? { viewCount: "desc" }
          : { updatedAt: "desc" };

  const where: Prisma.BlogWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.authorId ? { authorId: filters.authorId } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { subtitle: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.category
      ? { categories: { some: { category: { slug: filters.category } } } }
      : {}),
    ...(filters.tag ? { tags: { some: { tag: { slug: filters.tag } } } } : {}),
  };

  const rows = await prisma.blog.findMany({
    where,
    include: blogInclude,
    orderBy,
    take: take + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  const total = await prisma.blog.count({ where });

  return {
    items: items.map(mapSummary),
    meta: {
      total,
      take,
      cursor: filters.cursor ?? null,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    },
  };
}

export async function adminUpdateBlog(
  blogId: string,
  adminId: string,
  input: UpdateBlogInput,
): Promise<ApiBlogDetail> {
  return updateBlog(blogId, adminId, Role.ADMIN, input);
}

export async function adminGetBlogById(blogId: string): Promise<ApiBlogDetail> {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
    include: blogInclude,
  });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");
  const blocks = await getBlogBlocks(blogId);
  return {
    ...mapSummary(blog),
    seoTitle: blog.seoTitle,
    seoDescription: blog.seoDescription,
    seoKeywords: blog.seoKeywords,
    blocks,
  };
}

export async function adminDeleteBlog(blogId: string, adminId: string) {
  const blog = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");
  await prisma.blog.delete({ where: { id: blogId } });
  await recordAuditLog({
    action: "BLOG_DELETED",
    actorId: adminId,
    targetType: "Blog",
    targetId: blogId,
    summary: `Admin deleted blog "${blog.title}".`,
  });
}

export { mapSummary as mapBlogSummary };
