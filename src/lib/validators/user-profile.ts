import { z } from "zod";
import {
  listenerProfilePatchSchema,
  therapistProfilePatchSchema,
} from "@/lib/validators/provider-profile";

export const patchUserProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  bio: z.union([z.string().max(2000), z.literal("")]).optional(),
  phone: z.union([z.string().trim().max(32), z.literal("")]).optional(),
  city: z.union([z.string().trim().max(120), z.literal("")]).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  primaryFocus: z.union([z.string().trim().max(160), z.literal("")]).optional(),
  interestTags: z.array(z.string().trim().min(1).max(40)).max(16).optional(),
  therapistProfile: therapistProfilePatchSchema.optional(),
  listenerProfile: listenerProfilePatchSchema.optional(),
});

export type PatchUserProfileInput = z.infer<typeof patchUserProfileSchema>;
