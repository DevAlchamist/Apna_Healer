import { z } from "zod";

export const createSessionReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional().default([]),
});

export type CreateSessionReviewInput = z.infer<typeof createSessionReviewSchema>;
