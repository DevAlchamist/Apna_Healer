import { Role } from "@prisma/client";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { cancelRegistration } from "@/server/services/event-registration-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

const cancelBodySchema = z.object({
  userId: z.string().cuid().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const { slug } = await params;
    const body = cancelBodySchema.safeParse(
      await request.json().catch(() => ({})),
    );
    const targetUserId = body.success ? body.data.userId : undefined;
    const result = await cancelRegistration(slug, user.id, user.role, {
      registrationUserId: targetUserId,
      asOrganizer: Boolean(targetUserId && targetUserId !== user.id),
    });
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
