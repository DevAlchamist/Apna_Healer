import { handleApiError, ok } from "@/lib/api-response";
import { ApiError } from "@/lib/api-errors";
import { emitJournalReminder } from "@/server/services/platform-events";
import {
  hasJournalReminderForDate,
  listUsersNeedingJournalReminder,
} from "@/server/services/journal-service";

function authorizeCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new ApiError(503, "Cron is not configured.", "CRON_NOT_CONFIGURED");
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    throw new ApiError(401, "Unauthorized.", "UNAUTHORIZED");
  }
}

export async function POST(request: Request) {
  try {
    authorizeCron(request);
    const needing = await listUsersNeedingJournalReminder();
    let sent = 0;
    let skipped = 0;

    for (const { userId, dateKey } of needing) {
      const already = await hasJournalReminderForDate(userId, dateKey);
      if (already) {
        skipped += 1;
        continue;
      }
      await emitJournalReminder({ userId, journalDateKey: dateKey });
      sent += 1;
    }

    return ok({ sent, skipped, checked: needing.length });
  } catch (error) {
    return handleApiError(error);
  }
}
