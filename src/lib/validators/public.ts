import { z } from "zod";

export const publicProvidersQuerySchema = z.object({
  role: z.enum(["THERAPIST", "LISTENER"]).optional(),
  take: z.coerce.number().int().positive().max(24).optional(),
  query: z.string().trim().max(100).optional(),
});

export const publicEventsQuerySchema = z.object({
  take: z.coerce.number().int().positive().max(50).optional(),
  category: z.string().trim().max(64).optional(),
  filter: z.string().trim().max(64).optional(),
});

export const publicClubsQuerySchema = z.object({
  take: z.coerce.number().int().positive().max(24).optional(),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export const contactInquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(10).max(5000),
});
