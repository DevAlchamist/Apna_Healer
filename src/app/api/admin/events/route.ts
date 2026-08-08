import type { NextRequest } from "next/server";
import { Role, EventStatus } from "@prisma/client";
import { handleApiError, ok, created } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { createEventSchema } from "@/lib/validators/event";
import { createEvent, listEventsAdmin } from "@/server/services/event-service";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser([Role.ADMIN]);
    const statusParam = request.nextUrl.searchParams.get("status");
    const status =
      statusParam && Object.values(EventStatus).includes(statusParam as EventStatus)
        ? (statusParam as EventStatus)
        : undefined;
    const events = await listEventsAdmin({ status });
    return ok(events);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser([Role.ADMIN]);
    const body = createEventSchema.parse(await request.json());
    const event = await createEvent(user.id, user.role, body);
    return created(event);
  } catch (error) {
    return handleApiError(error);
  }
}
