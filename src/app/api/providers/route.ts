import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { providerQuerySchema } from "@/lib/validators/provider";
import { listProviders } from "@/server/services/provider-service";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser([Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN]);
    const filters = providerQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const providers = await listProviders({
      role: filters.role,
      query: filters.query,
      specialization: filters.specialization,
      take: filters.take,
    });
    return ok(providers);
  } catch (error) {
    return handleApiError(error);
  }
}
