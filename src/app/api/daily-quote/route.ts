import { handleApiError, ok } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/session-auth";
import { Role } from "@prisma/client";
import {
  calendarDateKeyAsiaKolkata,
  getDailyQuoteForCalendarDay,
} from "@/server/services/daily-quote-service";

export async function GET() {
  try {
    await requireSessionUser([Role.USER, Role.THERAPIST, Role.LISTENER, Role.ADMIN]);
    const dateKey = calendarDateKeyAsiaKolkata();
    const quote = await getDailyQuoteForCalendarDay(dateKey);
    return ok(quote);
  } catch (error) {
    return handleApiError(error);
  }
}
