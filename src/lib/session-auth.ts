import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ApiError } from "@/lib/api-errors";

export async function requireSessionUser(allowedRoles?: Role[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new ApiError(401, "Authentication required.", "UNAUTHORIZED");
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new ApiError(403, "You do not have access to this resource.", "FORBIDDEN");
  }

  return session.user;
}
