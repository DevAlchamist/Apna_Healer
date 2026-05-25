import { z } from "zod";
import {
  listenerProfilePatchSchema,
  therapistProfilePatchSchema,
} from "@/lib/validators/provider-profile";

export const adminUsersQuerySchema = z.object({
  role: z.enum(["ADMIN", "USER", "THERAPIST", "LISTENER"]).optional(),
  query: z.string().trim().max(100).optional(),
  take: z.coerce.number().int().positive().max(200).optional(),
});

const adminRoleSchema = z.enum(["ADMIN", "USER", "THERAPIST", "LISTENER"]);

export const adminPatchUserSchema = z
  .object({
    name: z.union([z.string().trim().min(1).max(120), z.literal("")]).optional(),
    email: z.string().trim().toLowerCase().email().max(320).optional(),
    role: adminRoleSchema.optional(),
    isVerified: z.boolean().optional(),
    bio: z.union([z.string().max(2000), z.literal("")]).optional(),
    phone: z.union([z.string().trim().max(32), z.literal("")]).optional(),
    city: z.union([z.string().trim().max(120), z.literal("")]).optional(),
    timezone: z.string().trim().min(1).max(80).optional(),
    primaryFocus: z.union([z.string().trim().max(160), z.literal("")]).optional(),
    interestTags: z.array(z.string().trim().min(1).max(40)).max(16).optional(),
    therapistProfile: therapistProfilePatchSchema.optional(),
    listenerProfile: listenerProfilePatchSchema.optional(),
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.email !== undefined ||
      body.role !== undefined ||
      body.isVerified !== undefined ||
      body.bio !== undefined ||
      body.phone !== undefined ||
      body.city !== undefined ||
      body.timezone !== undefined ||
      body.primaryFocus !== undefined ||
      body.interestTags !== undefined ||
      body.therapistProfile !== undefined ||
      body.listenerProfile !== undefined,
    { message: "At least one field is required.", path: ["_root"] },
  );

export type AdminPatchUserInput = z.infer<typeof adminPatchUserSchema>;
