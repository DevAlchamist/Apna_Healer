import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { getProfessionalApplicationForActor } from "@/server/services/professional-application-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await requireSessionUser();
    const { id } = await params;
    const application = await getProfessionalApplicationForActor(id, sessionUser.id, sessionUser.role);
    return ok(application);
  } catch (error) {
    return handleApiError(error);
  }
}
