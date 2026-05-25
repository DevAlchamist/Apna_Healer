import { Role } from "@prisma/client";
import { handleApiError, created } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { eventRegisterSchema } from "@/lib/validators/event";
import { registerForEvent } from "@/server/services/event-registration-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireSessionUser([...MEMBER_ROLES]);
    const { slug } = await params;
    const body = eventRegisterSchema.parse(await request.json());
    const registration = await registerForEvent(user.id, slug, body);
    return created({
      id: registration.id,
      status: registration.status,
      amountCharged: registration.amountCharged.toString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
