import { ProfessionalApplicationStatus, Role } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { reviewProfessionalApplicationSchema } from "@/lib/validators/professional-application";
import { reviewProfessionalApplication } from "@/server/services/professional-application-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await requireSessionUser([Role.ADMIN]);
    const { id } = await params;
    const input = reviewProfessionalApplicationSchema.parse(await request.json());
    const application = await reviewProfessionalApplication({
      applicationId: id,
      reviewerId: sessionUser.id,
      status:
        input.status === "APPROVED"
          ? ProfessionalApplicationStatus.APPROVED
          : input.status === "REJECTED"
            ? ProfessionalApplicationStatus.REJECTED
            : undefined,
      adminNote: input.adminNote,
    });

    return ok(application);
  } catch (error) {
    return handleApiError(error);
  }
}
