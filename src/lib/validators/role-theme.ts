import { Role } from "@prisma/client";
import { z } from "zod";
import { updateRoleThemeSchema } from "@/lib/theme/schema";

export const adminRoleParamSchema = z.object({
  role: z.nativeEnum(Role),
});

export { updateRoleThemeSchema };
