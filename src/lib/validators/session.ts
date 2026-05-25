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
  })
  .refine(
    (body) =>
      body.status !== undefined ||
      body.meetingLink !== undefined ||
      body.description !== undefined ||
      body.notes !== undefined ||
      body.endedAt !== undefined,
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
  );
