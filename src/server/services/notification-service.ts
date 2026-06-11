import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import type { ApiNotification, ApiNotificationsListResponse } from "@/types/api";
import { renderNotificationEmail } from "@/server/emails/render-notification-email";
import { isEmailEligibleType, sendEmail } from "@/server/services/email-service";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  metadata?: Record<string, unknown> | null;
  skipEmail?: boolean;
};

function toApiNotification(row: {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  emailSentAt: Date | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): ApiNotification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.readAt?.toISOString() ?? null,
    emailSentAt: row.emailSentAt?.toISOString() ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function maybeSendEmail(
  notification: {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    href: string | null;
    metadata: Prisma.JsonValue | null;
    userId: string;
  },
  user: { email: string; name: string | null },
) {
  if (!isEmailEligibleType(notification.type)) {
    return;
  }

  const rendered = await renderNotificationEmail(notification.type, {
    userName: user.name,
    userEmail: user.email,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    metadata: (notification.metadata as Record<string, unknown> | null) ?? null,
  });

  const sent = await sendEmail({
    to: user.email,
    subject: rendered.subject,
    html: rendered.html,
    attachments: rendered.attachments,
  });

  if (sent) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { emailSentAt: new Date() },
    });
  }
}

export async function createNotification(input: CreateNotificationInput): Promise<ApiNotification> {
  const row = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });

  if (!input.skipEmail) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, name: true },
    });
    if (user?.email) {
      try {
        await maybeSendEmail(row, user);
      } catch (error) {
        console.error("[notification-service] Email delivery failed:", error);
      }
    }
  }

  const refreshed = await prisma.notification.findUniqueOrThrow({ where: { id: row.id } });
  return toApiNotification(refreshed);
}

export async function notifyUsers(
  userIds: string[],
  payload: Omit<CreateNotificationInput, "userId">,
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  const results: ApiNotification[] = [];
  for (const userId of unique) {
    results.push(await createNotification({ ...payload, userId }));
  }
  return results;
}

export async function listNotificationsForUser(
  userId: string,
  filters: { take?: number; cursor?: string; unreadOnly?: boolean },
): Promise<ApiNotificationsListResponse> {
  const take = Math.min(filters.take ?? 20, 50);

  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(filters.unreadOnly ? { readAt: null } : {}),
  };

  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(filters.cursor
        ? {
            cursor: { id: filters.cursor },
            skip: 1,
          }
        : {}),
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  const hasMore = rows.length > take;
  const slice = hasMore ? rows.slice(0, take) : rows;
  const items = slice.map(toApiNotification);

  return {
    items,
    meta: {
      unreadCount,
      take,
      cursor: filters.cursor ?? null,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    },
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const row = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!row) {
    throw new ApiError(404, "Notification was not found.", "NOTIFICATION_NOT_FOUND");
  }

  if (row.readAt) {
    return toApiNotification(row);
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  return toApiNotification(updated);
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

  return { success: true as const };
}
