import { z } from "zod";
import { blogBlockInputSchema } from "@/lib/blog-blocks";

export const createBlogSchema = z.object({
  title: z.string().trim().min(2).max(200),
  subtitle: z.string().trim().max(500).optional().nullable(),
  coverImageUrl: z.string().trim().max(2048).optional().nullable(),
  categoryIds: z.array(z.string().cuid()).max(5).optional(),
  tagNames: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  seoTitle: z.string().trim().max(120).optional().nullable(),
  seoDescription: z.string().trim().max(320).optional().nullable(),
  seoKeywords: z.array(z.string().trim().max(40)).max(15).optional(),
  blocks: z.array(blogBlockInputSchema).max(200).optional(),
});

export const updateBlogSchema = createBlogSchema.partial();

export const blogListQuerySchema = z.object({
  status: z
    .enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "UNPUBLISHED"])
    .optional(),
  q: z.string().trim().max(200).optional(),
  take: z.coerce.number().int().positive().max(50).optional(),
  cursor: z.string().cuid().optional(),
});

export const adminBlogListQuerySchema = blogListQuerySchema.extend({
  authorId: z.string().cuid().optional(),
  category: z.string().trim().max(80).optional(),
  tag: z.string().trim().max(80).optional(),
  sort: z.enum(["newest", "oldest", "popular", "views"]).optional(),
});

export const publicBlogListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z.string().trim().max(80).optional(),
  tag: z.string().trim().max(80).optional(),
  sort: z.enum(["newest", "popular", "reading_time"]).optional(),
  take: z.coerce.number().int().positive().max(24).optional(),
  cursor: z.string().cuid().optional(),
});

export const rejectBlogSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

export const blogCommentSchema = z.object({
  content: z.string().trim().min(1).max(3000),
  parentId: z.string().cuid().optional().nullable(),
});

export const updateBlogCommentSchema = z.object({
  content: z.string().trim().min(1).max(3000),
});

export const blogReportSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

export const reviewBlogReportSchema = z.object({
  status: z.enum(["REVIEWED", "DISMISSED"]),
  reviewNote: z.string().trim().max(1000).optional().nullable(),
});

export const blogViewSchema = z.object({
  sessionHash: z.string().trim().min(8).max(128),
});
