import { z } from "zod";

function optionalLandingString(max: number) {
  return z
    .union([z.string().trim().max(max), z.literal("")])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));
}

export const eventLandingFieldsSchema = z.object({
  journeyPoints: z.array(z.string().trim().min(1).max(200)).max(8).optional().default([]),
  audienceText: optionalLandingString(1000),
  testimonialQuote: optionalLandingString(1000),
  testimonialAuthor: optionalLandingString(120),
});

export type EventLandingFieldsInput = z.infer<typeof eventLandingFieldsSchema>;

export const DEFAULT_JOURNEY_POINTS = [
  "Opening and grounding",
  "Guided practice",
  "Closing reflection",
] as const;

export const DEFAULT_AUDIENCE_TEXT =
  "Open to all members and guests. No prior experience required.";
