import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { getRoleTheme } from "@/server/services/role-theme-service";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const AUTH_ROLES = [Role.ADMIN, Role.USER, Role.THERAPIST, Role.LISTENER] as const;

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser([...AUTH_ROLES]);
    const { searchParams } = request.nextUrl;
    const roleParam = searchParams.get("role");
    
    let targetRole = user.role;
    if (roleParam && user.role === Role.ADMIN) {
      const parsedRole = roleParam.toUpperCase() as Role;
      if (Object.values(Role).includes(parsedRole)) {
        targetRole = parsedRole;
      }
    }

    const theme = await getRoleTheme(targetRole);
    return ok(theme, {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
