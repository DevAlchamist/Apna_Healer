import { z } from "zod";

function optionalLandingString(max: number) {
  return z
    .union([z.string().trim().max(max), z.literal("")])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));
}

export const therapistLandingFieldsSchema = z.object({
  profileDescription: optionalLandingString(1000),
  philosophyQuote: optionalLandingString(500),
  experienceDescription: optionalLandingString(2000),
  testimonialQuote: optionalLandingString(1000),
  testimonialAuthor: optionalLandingString(120),
  retentionRate: optionalLandingString(20),
});

export type TherapistLandingFieldsInput = z.infer<typeof therapistLandingFieldsSchema>;
