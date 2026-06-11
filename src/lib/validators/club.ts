import { z } from "zod";
import { clubLandingFieldsSchema } from "@/lib/validators/club-landing-fields";

export const clubOnboardingQuestionSchema = z.object({
  question: z.string().trim().min(1).max(500),
  required: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional(),
  type: z.enum(["TEXT", "CHOICE"]).optional().default("TEXT"),
  options: z.array(z.string().trim().min(1).max(120)).max(24).optional().default([]),
  allowMultiple: z.boolean().optional().default(false),
});

export const clubOnboardingStepSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  questions: z.array(clubOnboardingQuestionSchema).min(1).max(20),
});

export const clubReviewSchema = z.object({
  authorLabel: z.string().trim().min(1).max(120),
  quote: z.string().trim().min(1).max(2000),
  memberSince: z.string().trim().max(40).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createClubSchema = clubLandingFieldsSchema.extend({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().min(1).max(500),
  description: z.string().trim().max(5000).optional().nullable(),
  purpose: z.string().trim().max(2000).optional().nullable(),
  heroImageUrl: z.string().url().max(2048).optional().nullable(),
  galleryUrls: z.array(z.string().url().max(2048)).max(12).optional().default([]),
  monthlyFee: z.coerce.number().positive().max(100_000),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional().default("PUBLIC"),
  ownerUserId: z.string().cuid().optional().nullable(),
  onboardingSteps: z.array(clubOnboardingStepSchema).max(15).optional().default([]),
  reviews: z.array(clubReviewSchema).max(30).optional().default([]),
});

export const updateClubSchema = createClubSchema.partial().extend({
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
});

export const clubCreationRequestSchema = createClubSchema;

export const clubOnboardingAnswerStepSchema = z.object({
  stepTitle: z.string().trim().min(1).max(120),
  stepDescription: z.string().trim().max(2000).optional().nullable(),
  questions: z
    .array(
      z.object({
        questionId: z.string().trim().min(1).max(64),
        question: z.string().trim().min(1).max(500),
        answer: z.union([
          z.string().trim().min(1).max(2000),
          z.array(z.string().trim().min(1).max(120)).min(1).max(24),
        ]),
      }),
    )
    .min(1),
});

export const clubJoinRequestSchema = z.object({
  clubId: z.string().cuid(),
  message: z.string().trim().max(2000).optional(),
  onboardingAnswers: z.array(clubOnboardingAnswerStepSchema).optional(),
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

/** Owner/moderator PATCH — all create fields except ownerUserId */
export const ownerUpdateClubSchema = createClubSchema.omit({ ownerUserId: true }).partial();
