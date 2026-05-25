import { Role } from "@prisma/client";
import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { adminUsersQuerySchema } from "@/lib/validators/user";
import { listUsersForAdmin } from "@/server/services/user-service";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const filters = adminUsersQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const users = await listUsersForAdmin({
      role: filters.role as Role | undefined,
      query: filters.query,
      take: filters.take,
    });
    return ok(users);
  } catch (error) {
    return handleApiError(error);
  }
}
