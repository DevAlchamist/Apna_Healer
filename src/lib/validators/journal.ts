import { z } from "zod";

export const journalAutosaveSchema = z.object({
  title: z.string().trim().max(200).optional().nullable(),
  contentHtml: z.string().max(100_000),
  mood: z.string().trim().max(64).optional().nullable(),
  coverImageUrl: z.string().url().max(2048).optional().nullable(),
  journalDateKey: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const journalListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  take: z.coerce.number().int().positive().max(50).optional(),
  cursor: z.string().cuid().optional(),
});
