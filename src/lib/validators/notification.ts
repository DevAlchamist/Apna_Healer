import { z } from "zod";

export const notificationsQuerySchema = z.object({
  take: z.coerce.number().int().positive().max(50).optional(),
  cursor: z.string().trim().min(1).optional(),
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export const markNotificationReadSchema = z.object({
  read: z.literal(true),
});
