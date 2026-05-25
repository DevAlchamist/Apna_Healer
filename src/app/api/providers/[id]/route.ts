import { Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { getProviderById } from "@/server/services/provider-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSessionUser([Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN]);
    const { id } = await params;
    const provider = await getProviderById(id);
    return ok(provider);
  } catch (error) {
    return handleApiError(error);
  }
}
