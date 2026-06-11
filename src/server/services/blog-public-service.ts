import { BlogStatus, type Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import type { ApiBlogDetail, ApiPublicBlogListResponse, ApiPublicBlogSummary } from "@/types/api";
import { getBlogBlocks } from "@/server/services/blog-block-service";
import { mapPublicSummary } from "@/server/services/blog-analytics-service";
import { getUserLikedBlog } from "@/server/services/blog-reaction-service";

const DEFAULT_TAKE = 12;

const publicBlogInclude = {
  author: { select: { id: true, name: true, image: true, role: true } },
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.BlogInclude;

export async function getPublicBlogs(filters: {
  q?: string;
  category?: string;
  tag?: string;
  sort?: "newest" | "popular" | "reading_time";
  take?: number;
  cursor?: string;
}): Promise<ApiPublicBlogListResponse> {
  const take = filters.take ?? DEFAULT_TAKE;
  const orderBy: Prisma.BlogOrderByWithRelationInput =
    filters.sort === "popular"
      ? { likeCount: "desc" }
      : filters.sort === "reading_time"
        ? { readingTimeMinutes: "asc" }
        : { publishedAt: "desc" };

  const where: Prisma.BlogWhereInput = {
    status: BlogStatus.PUBLISHED,
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { subtitle: { contains: filters.q, mode: "insensitive" } },
            { excerpt: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.category
      ? { categories: { some: { category: { slug: filters.category } } } }
      : {}),
    ...(filters.tag ? { tags: { some: { tag: { slug: filters.tag } } } } : {}),
  };

  const [featured, rows, total] = await Promise.all([
    prisma.blog.findFirst({
      where: { status: BlogStatus.PUBLISHED, isFeatured: true },
      include: publicBlogInclude,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.blog.findMany({
      where,
      include: publicBlogInclude,
      orderBy,
      take: take + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    }),
    prisma.blog.count({ where }),
  ]);

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;

  return {
    featured: featured ? mapPublicSummary(featured) : null,
    items: items.map(mapPublicSummary),
    meta: {
      total,
      take,
      cursor: filters.cursor ?? null,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    },
  };
}

export async function getPublicBlogBySlug(
  slug: string,
  viewerId?: string | null,
): Promise<ApiBlogDetail> {
  const blog = await prisma.blog.findFirst({
    where: { slug, status: BlogStatus.PUBLISHED },
    include: publicBlogInclude,
  });
  if (!blog) throw new ApiError(404, "Blog not found.", "NOT_FOUND");

  const [blocks, related, likedByMe] = await Promise.all([
    getBlogBlocks(blog.id),
    getRelatedArticles(blog.id, blog.categories.map((c) => c.categoryId)),
    viewerId ? getUserLikedBlog(slug, viewerId) : Promise.resolve(false),
  ]);

  return {
    ...mapPublicSummary(blog),
    status: blog.status,
    rejectedAt: blog.rejectedAt?.toISOString() ?? null,
    rejectionReason: blog.rejectionReason,
    createdAt: blog.createdAt.toISOString(),
    updatedAt: blog.updatedAt.toISOString(),
    seoTitle: blog.seoTitle,
    seoDescription: blog.seoDescription,
    seoKeywords: blog.seoKeywords,
    blocks,
    likedByMe,
    related,
  };
}

async function getRelatedArticles(blogId: string, categoryIds: string[]): Promise<ApiPublicBlogSummary[]> {
  if (categoryIds.length === 0) {
    const rows = await prisma.blog.findMany({
      where: { status: BlogStatus.PUBLISHED, id: { not: blogId } },
      include: publicBlogInclude,
      orderBy: { publishedAt: "desc" },
      take: 3,
    });
    return rows.map(mapPublicSummary);
  }

  const rows = await prisma.blog.findMany({
    where: {
      status: BlogStatus.PUBLISHED,
      id: { not: blogId },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    include: publicBlogInclude,
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  if (rows.length >= 3) return rows.map(mapPublicSummary);

  const filler = await prisma.blog.findMany({
    where: {
      status: BlogStatus.PUBLISHED,
      id: { notIn: [blogId, ...rows.map((row) => row.id)] },
    },
    include: publicBlogInclude,
    orderBy: { viewCount: "desc" },
    take: 3 - rows.length,
  });

  return [...rows, ...filler].map(mapPublicSummary);
}

export async function getFeaturedBlog(): Promise<ApiPublicBlogSummary | null> {
  const blog = await prisma.blog.findFirst({
    where: { status: BlogStatus.PUBLISHED, isFeatured: true },
    include: publicBlogInclude,
    orderBy: { publishedAt: "desc" },
  });
  return blog ? mapPublicSummary(blog) : null;
}
