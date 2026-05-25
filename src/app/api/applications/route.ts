import { ApplicationType, ProfessionalApplicationStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { professionalApplicationQuerySchema } from "@/lib/validators/professional-application";
import {
  createProfessionalApplication,
  listProfessionalApplications,
} from "@/server/services/professional-application-service";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireSessionUser();
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

export async function POST(request: Request) {
  try {
    const sessionUser = await requireSessionUser();
    const raw: unknown = await request.json();
    const application = await createProfessionalApplication(
      { id: sessionUser.id, role: sessionUser.role },
      raw,
    );
    return created(application);
  } catch (error) {
    return handleApiError(error);
  }
}
