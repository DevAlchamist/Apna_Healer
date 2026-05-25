import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { adminListenerRequestPatchSchema } from "@/lib/validators/listener-booking-request";
import { adminPatchListenerRequest } from "@/server/services/listener-booking-request-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await requireSessionUser();
    const { id } = await context.params;
    const body = adminListenerRequestPatchSchema.parse(await request.json());

    const updated = await adminPatchListenerRequest({
      requestId: id,
      adminId: sessionUser.id,
      adminRole: sessionUser.role,
      action: body.action,
      listenerId: body.action === "assign" ? body.listenerId : undefined,
      approve:
        body.action === "approve"
          ? {
              meetingLink: body.meetingLink,
              notes: body.notes,
              description: body.description,
            }
          : undefined,
      update:
        body.action === "update"
          ? {
              preferredDate: body.preferredDate,
              preferredTime: body.preferredTime,
              duration: body.duration,
              emotionalTags: body.emotionalTags,
              preferredTone: body.preferredTone,
              preferredLanguage: body.preferredLanguage,
              note: body.note,
            }
          : undefined,
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
