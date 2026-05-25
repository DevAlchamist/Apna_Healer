import { ApplicationType, ProfessionalApplicationStatus, Role } from "@prisma/client";
import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { professionalApplicationQuerySchema } from "@/lib/validators/professional-application";
import { listProfessionalApplications } from "@/server/services/professional-application-service";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireSessionUser([Role.ADMIN]);
    const filters = professionalApplicationQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const applications = await listProfessionalApplications(sessionUser.id, sessionUser.role, {
      status: filters.status as ProfessionalApplicationStatus | undefined,
      type: filters.type as ApplicationType | undefined,
      take: filters.take,
    });
    return ok(applications);
  } catch (error) {
    return handleApiError(error);
  }
}
