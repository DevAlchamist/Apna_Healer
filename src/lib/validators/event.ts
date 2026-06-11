import { z } from "zod";
import { eventLandingFieldsSchema } from "@/lib/validators/event-landing-fields";

export const createEventSchema = eventLandingFieldsSchema.extend({
  clubId: z.string().cuid().optional().nullable(),
  title: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().max(8000).optional().nullable(),
  category: z.string().trim().max(80).optional().nullable(),
  heroImageUrl: z.string().url().max(2048).optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional().nullable(),
  venue: z.string().trim().max(300).optional().nullable(),
  mode: z.enum(["VIRTUAL", "IN_PERSON"]).optional().default("IN_PERSON"),
  capacity: z.coerce.number().int().positive().max(10_000),
  basePrice: z.coerce.number().min(0).max(100_000).optional().default(0),
  memberPrice: z.coerce.number().min(0).max(100_000).optional().nullable(),
  guestPrice: z.coerce.number().min(0).max(100_000).optional().nullable(),
  membersPay: z.boolean().optional().default(true),
  nonMembersPay: z.boolean().optional().default(true),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]).optional(),
  organizedByUserId: z.string().cuid().optional(),
  facilitatorName: z.string().trim().max(120).optional().nullable(),
  facilitatorRole: z.string().trim().max(120).optional().nullable(),
  facilitatorImage: z.string().url().max(2048).optional().nullable(),
  facilitatorBio: z.string().trim().max(2000).optional().nullable(),
});

export const updateEventSchema = createEventSchema.partial();

export const eventRegisterSchema = z.object({
  paymentMethod: z.enum(["WALLET", "QR", "CARD"]).optional(),
  note: z.string().trim().max(1000).optional().nullable(),
});

export const eventListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  clubId: z.string().cuid().optional(),
  take: z.coerce.number().int().positive().max(50).optional(),
  cursor: z.string().cuid().optional(),
});
