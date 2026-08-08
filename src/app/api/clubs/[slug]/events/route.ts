import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError, ok, created } from "@/lib/api-response";
import { ApiError } from "@/lib/api-errors";
import { requireSessionUser } from "@/lib/session-auth";
import { createEventSchema } from "@/lib/validators/event";
import { createEvent, listEventsForClub } from "@/server/services/event-service";

const MEMBER_ROLES = [Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN] as const;

async function clubIdFromSlug(slug: string) {
  const club = await prisma.club.findUnique({ where: { slug }, select: { id: true } });
  if (!club) {
    throw new ApiError(404, "Club was not found.", "CLUB_NOT_FOUND");
  }
  return club.id;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await requireSessionUser([...MEMBER_ROLES]);
    const { slug } = await params;
    const clubId = await clubIdFromSlug(slug);
    const events = await listEventsForClub(clubId);
    return ok(events);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const { slug } = await params;
    const clubId = await clubIdFromSlug(slug);
    const body = createEventSchema.parse(await request.json());
    const event = await createEvent(user.id, user.role, { ...body, clubId });
    return created(event);
  } catch (error) {
    return handleApiError(error);
  }
}
