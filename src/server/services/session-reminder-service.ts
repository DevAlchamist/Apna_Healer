import { CareSessionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/server/services/notification-service";
import {
  hasEmailBeenSent,
  recordEmailDelivery,
} from "@/server/services/email-delivery-log-service";
import { getReminderWindow } from "@/server/services/session-reminder-windows";

export { getReminderWindow } from "@/server/services/session-reminder-windows";

export async function processSessionReminders() {
  const now = Date.now();
  const windows = [
    { kind: "SESSION_REMINDER_24H" as const, dedupeSuffix: "24h", ...getReminderWindow("24h", now) },
    { kind: "SESSION_REMINDER_1H" as const, dedupeSuffix: "1h", ...getReminderWindow("1h", now) },
  ];

  let sent = 0;
  let skipped = 0;

  for (const window of windows) {
    const sessions = await prisma.careSession.findMany({
      where: {
        status: CareSessionStatus.UPCOMING,
        startTime: { gte: window.startGte, lt: window.startLt },
      },
      select: { id: true, userId: true, providerId: true },
    });

    for (const session of sessions) {
      const dedupeKey = `${session.id}:${window.dedupeSuffix}`;
      const already = await hasEmailBeenSent(window.kind, dedupeKey);
      if (already) {
        skipped += 1;
        continue;
      }

      const title =
        window.kind === "SESSION_REMINDER_24H"
          ? "Your session is tomorrow"
          : "Your session starts in 1 hour";
      const body =
        window.kind === "SESSION_REMINDER_24H"
          ? "Take a moment to prepare—a quiet space and a few deep breaths can help you arrive fully."
          : "Your healing session is about to begin. Join when you're ready.";

      for (const userId of [session.userId, session.providerId]) {
        await createNotification({
          userId,
          type: window.kind,
          title,
          body,
          href: "/dashboard",
          metadata: { sessionId: session.id },
        });
      }

      await recordEmailDelivery({
        userId: session.userId,
        kind: window.kind,
        dedupeKey,
      });
      sent += 1;
    }
  }

  return { sent, skipped };
}
