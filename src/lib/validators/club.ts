import { z } from "zod";

export const clubOnboardingStepSchema = z.object({
  question: z.string().trim().min(1).max(500),
  required: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional(),
});

export const clubReviewSchema = z.object({
  authorLabel: z.string().trim().min(1).max(120),
  quote: z.string().trim().min(1).max(2000),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createClubSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().min(1).max(500),
  description: z.string().trim().max(5000).optional().nullable(),
  purpose: z.string().trim().max(2000).optional().nullable(),
  heroImageUrl: z.string().url().max(2048).optional().nullable(),
  galleryUrls: z.array(z.string().url().max(2048)).max(12).optional().default([]),
  monthlyFee: z.coerce.number().positive().max(100_000),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional().default("PUBLIC"),
  ownerUserId: z.string().cuid().optional().nullable(),
  onboardingSteps: z.array(clubOnboardingStepSchema).max(20).optional().default([]),
  reviews: z.array(clubReviewSchema).max(30).optional().default([]),
});

export const updateClubSchema = createClubSchema.partial().extend({
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
});

export const clubCreationRequestSchema = createClubSchema;

export const clubJoinRequestSchema = z.object({
  clubId: z.string().cuid(),
  message: z.string().trim().min(10).max(2000),
});

export const reviewJoinRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().trim().max(2000).optional().nullable(),
});

export const reviewCreationRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().trim().max(2000).optional().nullable(),
  club: updateClubSchema.optional(),
});

export const assignClubMemberSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["OWNER", "MODERATOR", "MEMBER"]).optional().default("MEMBER"),
  skipBilling: z.boolean().optional().default(false),
});

export const clubListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  take: z.coerce.number().int().positive().max(50).optional(),
  cursor: z.string().cuid().optional(),
});
