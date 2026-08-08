import { z } from "zod";

const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const createListenerBookingRequestSchema = z.object({
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "preferredDate must be YYYY-MM-DD"),
  preferredTime: z.string().regex(TIME_REGEX, "preferredTime must be HH:mm"),
  duration: z.number().int().min(15).max(120).optional().default(30),
  emotionalTags: z.array(z.string().min(1).max(80)).max(20).default([]),
  preferredTone: z.string().min(1).max(120).optional().nullable(),
  preferredLanguage: z.string().min(1).max(80).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
});

export const adminListenerRequestPatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("assign"),
    listenerId: z.string().min(1),
  }),
  z.object({
    action: z.literal("approve"),
    meetingLink: z.string().trim().max(2048).optional(),
    notes: z.string().max(2000).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
  }),
  z.object({
    action: z.literal("decline"),
  }),
  z.object({
    action: z.literal("update"),
    preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    preferredTime: z.string().regex(TIME_REGEX).optional(),
    duration: z.number().int().min(15).max(120).optional(),
    emotionalTags: z.array(z.string().min(1).max(80)).max(20).optional(),
    preferredTone: z.string().min(1).max(120).optional().nullable(),
    preferredLanguage: z.string().min(1).max(80).optional().nullable(),
    note: z.string().max(2000).optional().nullable(),
  }),
]);

export const listenerResponseSchema = z.object({
  decision: z.enum(["accept", "decline"]),
  meetingLink: z.union([z.string().url(), z.literal("")]).optional(),
  notes: z.union([z.string().trim().max(2000), z.literal("")]).optional(),
  description: z.union([z.string().trim().max(500), z.literal("")]).optional(),
});

export type CreateListenerBookingRequestInput = z.infer<typeof createListenerBookingRequestSchema>;
export type AdminListenerRequestPatchInput = z.infer<typeof adminListenerRequestPatchSchema>;
