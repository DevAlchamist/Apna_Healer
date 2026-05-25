import { z, type ZodError } from "zod";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const weeklyAvailabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(TIME_RE, "Use HH:mm (24h)."),
  endTime: z.string().regex(TIME_RE, "Use HH:mm (24h)."),
  timezone: z.string().min(1).max(64).optional(),
});

export const weeklyAvailabilitySchema = z
  .array(weeklyAvailabilityWindowSchema)
  .min(1, "Add at least one weekly availability window.")
  .max(42);

export const listenerApplicationPayloadSchema = z.object({
  bio: z.string().trim().min(20, "Bio should be at least 20 characters.").max(8000),
  whyHelp: z.string().trim().min(20, "Please share a bit more detail.").max(8000),
  languages: z.array(z.string().trim().min(1)).min(1, "Add at least one language."),
  emotionalStrengths: z.array(z.string().trim().min(1)).min(1, "Add at least one strength."),
  weeklyAvailability: weeklyAvailabilitySchema,
  optionalExperience: z.string().trim().max(8000).optional(),
  optionalNote: z.string().trim().max(8000).optional(),
});

export const therapistApplicationPayloadSchema = z.object({
  bio: z.string().trim().min(20, "Bio should be at least 20 characters.").max(8000),
  specialization: z.string().trim().min(2, "Specialization is required.").max(2000),
  certifications: z.array(z.string().trim().min(1)).min(1, "List at least one certification."),
  yearsOfExperience: z.number().int().min(0).max(60),
  pricing: z.number().positive().max(1_000_000),
  weeklyAvailability: weeklyAvailabilitySchema,
  documents: z.array(z.string().url()).max(12).optional().default([]),
  whyJoin: z.string().trim().min(20, "Please share a bit more detail.").max(8000),
  optionalLinks: z.array(z.string().url()).max(12).optional(),
});

export const createProfessionalApplicationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("LISTENER"),
    applicationData: listenerApplicationPayloadSchema,
  }),
  z.object({
    type: z.literal("THERAPIST"),
    applicationData: therapistApplicationPayloadSchema,
  }),
]);

export const professionalApplicationQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  type: z.enum(["LISTENER", "THERAPIST"]).optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
});

export const reviewProfessionalApplicationSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]).optional(),
    adminNote: z.string().max(8000).optional(),
  })
  .superRefine((data, ctx) => {
    const trimmedNote = data.adminNote?.trim();
    if (data.status === undefined && !trimmedNote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a status change and/or an admin note.",
      });
    }
  });

export function parseListenerApplicationData(value: unknown) {
  return listenerApplicationPayloadSchema.parse(value);
}

export function parseTherapistApplicationData(value: unknown) {
  return therapistApplicationPayloadSchema.parse(value);
}

/** Map Zod issues to dot-path keys (e.g. `weeklyAvailability.0.startTime`) for inline form errors. */
export function zodIssuesToFieldErrorMap(error: ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : "_form";
    if (!(key in map)) {
      map[key] = issue.message;
    }
  }
  return map;
}

export function safeParseListenerApplicationPayload(data: unknown) {
  return listenerApplicationPayloadSchema.safeParse(data);
}

export function safeParseTherapistApplicationPayload(data: unknown) {
  return therapistApplicationPayloadSchema.safeParse(data);
}

export function firstMatchingFieldError(errors: Record<string, string>, prefix: string): string | undefined {
  const entry = Object.entries(errors).find(
    ([key]) => key === prefix || key.startsWith(`${prefix}.`),
  );
  return entry?.[1];
}
