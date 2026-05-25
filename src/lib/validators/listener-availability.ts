import { z } from "zod";

const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const listenerWeeklyWindowSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(TIME_REGEX, "startTime must be HH:mm"),
    endTime: z.string().regex(TIME_REGEX, "endTime must be HH:mm"),
    timezone: z.string().min(1).max(80).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((window) => window.startTime < window.endTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

export const replaceListenerScheduleSchema = z.object({
  windows: z.array(listenerWeeklyWindowSchema).max(60),
});

export const listenerSlotsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

export type ReplaceListenerScheduleInput = z.infer<typeof replaceListenerScheduleSchema>;
export type ListenerWeeklyWindowInput = z.infer<typeof listenerWeeklyWindowSchema>;
