import { z } from "zod";

function optionalLandingString(max: number) {
  return z
    .union([z.string().trim().max(max), z.literal("")])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));
}

export const clubLandingFeatureSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
  icon: z.enum(["wind", "leaf"]).optional().default("wind"),
});

export const clubLandingRitualSchema = z.object({
  label: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  imageUrl: z.string().url().max(2048).optional().nullable(),
  cta: z.string().trim().max(80).optional().nullable(),
});

export const clubLandingFieldsSchema = z.object({
  heroTagline: optionalLandingString(120),
  pulseQuote: optionalLandingString(500),
  ritualsIntro: optionalLandingString(1000),
  voicesQuote: optionalLandingString(500),
  finalCtaText: optionalLandingString(1000),
  landingFeatures: z.array(clubLandingFeatureSchema).max(4).optional().default([]),
  landingRituals: z.array(clubLandingRitualSchema).max(4).optional().default([]),
});

export type ClubLandingFeature = z.infer<typeof clubLandingFeatureSchema>;
export type ClubLandingRitual = z.infer<typeof clubLandingRitualSchema>;
export type ClubLandingFieldsInput = z.infer<typeof clubLandingFieldsSchema>;
