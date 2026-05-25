import { z } from "zod";
import { weeklyAvailabilitySchema } from "@/lib/validators/professional-application";

export const therapistProfilePatchSchema = z.object({
  bio: z.string().trim().min(20, "Bio should be at least 20 characters.").max(8000),
  specialization: z.string().trim().min(2, "Specialization is required.").max(2000),
  certifications: z.array(z.string().trim().min(1)).min(1, "Add at least one education or credential."),
  experienceYears: z.number().int().min(0).max(60),
  hourlyRate: z.number().positive().max(1_000_000),
  weeklyAvailability: weeklyAvailabilitySchema,
});

export const listenerProfilePatchSchema = z.object({
  bio: z.string().trim().min(20, "Bio should be at least 20 characters.").max(8000),
  languages: z.array(z.string().trim().min(1)).min(1, "Add at least one language."),
  emotionalStrengths: z.array(z.string().trim().min(1)).min(1, "Add at least one interest or strength."),
  weeklyAvailability: weeklyAvailabilitySchema,
});

export type TherapistProfilePatchInput = z.infer<typeof therapistProfilePatchSchema>;
export type ListenerProfilePatchInput = z.infer<typeof listenerProfilePatchSchema>;
