import { z } from "zod";

export const sessionQuerySchema = z.object({
  scope: z.enum(["participant", "provider", "all", "both"]).optional(),
  status: z
    .enum(["UPCOMING", "ONGOING", "COMPLETED", "MISSED", "CANCELLED"])
    .optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
});

export const updateSessionSchema = z
  .object({
    status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "MISSED", "CANCELLED"]).optional(),
    meetingLink: z.union([z.string().url(), z.literal("")]).optional(),
    description: z.union([z.string().trim().max(500), z.literal("")]).optional(),
    notes: z.union([z.string().trim().max(2000), z.literal("")]).optional(),
    /** When completing a listener-flow session, actual end time (ISO-8601). Defaults to now. */
    endedAt: z.string().datetime().optional(),
    /** Reschedule an upcoming session to a new start time (ISO-8601). */
    startTime: z.string().datetime().optional(),
  })
  .refine(
    (body) =>
      body.status !== undefined ||
      body.meetingLink !== undefined ||
      body.description !== undefined ||
      body.notes !== undefined ||
      body.endedAt !== undefined ||
      body.startTime !== undefined,
    { message: "Provide at least one field to update.", path: ["status"] },
  )
  .refine(
    (body) =>
      !body.endedAt ||
      body.status === undefined ||
      body.status === "COMPLETED",
    {
      message: "endedAt is only allowed when completing the session.",
      path: ["endedAt"],
    },
  )
  .refine(
    (body) =>
      !body.startTime ||
      body.status === undefined ||
      body.status === "UPCOMING",
    {
      message: "startTime can only be sent on its own or while keeping status upcoming.",
      path: ["startTime"],
    },
  );
