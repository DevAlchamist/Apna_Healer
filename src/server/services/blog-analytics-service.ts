import { BlogStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiBlogAnalyticsOverview, ApiPublicBlogSummary } from "@/types/api";

const publicBlogInclude = {
  author: { select: { id: true, name: true, image: true, role: true } },
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.BlogInclude;

function mapPublicSummary(
  blog: Prisma.BlogGetPayload<{ include: typeof publicBlogInclude }>,
): ApiPublicBlogSummary {
  return {
    id: blog.id,
    slug: blog.slug,
    title: blog.title,
    subtitle: blog.subtitle,
    excerpt: blog.excerpt,
    coverImageUrl: blog.coverImageUrl,
    isFeatured: blog.isFeatured,
    readingTimeMinutes: blog.readingTimeMinutes,
    viewCount: blog.viewCount,
    likeCount: blog.likeCount,
    commentCount: blog.commentCount,
    publishedAt: blog.publishedAt?.toISOString() ?? null,
    author: {
      id: blog.author.id,
      name: blog.author.name,
      image: blog.author.image,
      role: blog.author.role,
    },
    categories: blog.categories.map((row) => ({
      id: row.category.id,
      slug: row.category.slug,
      name: row.category.name,
    })),
    tags: blog.tags.map((row) => ({
      id: row.tag.id,
      slug: row.tag.slug,
      name: row.tag.name,
    })),
  };
}

export async function getBlogAnalyticsOverview(): Promise<ApiBlogAnalyticsOverview> {
  const [totals, topPosts, trendRows] = await Promise.all([
    prisma.blog.aggregate({
      _count: { _all: true },
      _sum: { viewCount: true, likeCount: true, commentCount: true },
    }),
    prisma.blog.findMany({
      where: { status: BlogStatus.PUBLISHED },
      include: publicBlogInclude,
      orderBy: [{ viewCount: "desc" }, { likeCount: "desc" }],
      take: 5,
    }),
    prisma.blogAnalyticsDaily.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  const [publishedBlogs, pendingReview] = await Promise.all([
    prisma.blog.count({ where: { status: BlogStatus.PUBLISHED } }),
    prisma.blog.count({ where: { status: BlogStatus.PENDING_REVIEW } }),
  ]);

  const viewsByDate = new Map<string, number>();
  for (const row of trendRows) {
    const key = row.date.toISOString().slice(0, 10);
    viewsByDate.set(key, (viewsByDate.get(key) ?? 0) + row.views);
  }

  return {
    totalBlogs: totals._count._all,
    publishedBlogs,
    pendingReview,
    totalViews: totals._sum.viewCount ?? 0,
    totalLikes: totals._sum.likeCount ?? 0,
    totalComments: totals._sum.commentCount ?? 0,
    topPosts: topPosts.map(mapPublicSummary),
    viewsTrend: Array.from(viewsByDate.entries()).map(([date, views]) => ({ date, views })),
  };
}

export async function listBlogCategories() {
  const categories = await prisma.blogCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          blogs: {
            where: { blog: { status: BlogStatus.PUBLISHED } },
          },
        },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    blogCount: category._count.blogs,
  }));
}

export async function listBlogTags() {
  const tags = await prisma.blogTag.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          blogs: {
            where: { blog: { status: BlogStatus.PUBLISHED } },
          },
        },
      },
    },
    take: 100,
  });

  return tags.map((tag) => ({
    id: tag.id,
    slug: tag.slug,
    name: tag.name,
    blogCount: tag._count.blogs,
  }));
}

export { mapPublicSummary };
