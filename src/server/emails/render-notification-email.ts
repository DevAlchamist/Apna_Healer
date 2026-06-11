import { prisma } from "@/lib/prisma";
import { buildGoogleCalendarUrl, buildSessionCalendarAttachment } from "@/server/emails/calendar";
import type { EmailAttachment, EmailRenderContext, RenderedEmail } from "@/server/emails/types";
import { buildCommunityActivitySubject, renderCommunityActivityEmail } from "@/server/emails/templates/community-activity";
import { buildGenericSubject, renderGenericNotificationEmail } from "@/server/emails/templates/generic";
import { buildMonthlyRecapSubject, renderMonthlyRecapEmail } from "@/server/emails/templates/monthly-recap";
import { buildPaymentConfirmationSubject, renderPaymentConfirmationEmail } from "@/server/emails/templates/payment-confirmation";
import {
  buildSessionConfirmationSubject,
  renderSessionConfirmationEmail,
} from "@/server/emails/templates/session-confirmation";
import { buildSessionFeedbackSubject, renderSessionFeedbackEmail } from "@/server/emails/templates/session-feedback";
import { buildSessionReminderSubject, renderSessionReminderEmail } from "@/server/emails/templates/session-reminder";
import {
  buildSubscriptionUpdateSubject,
  renderSubscriptionUpdateEmail,
} from "@/server/emails/templates/subscription-update";
import { buildWelcomeSubject, renderWelcomeEmail } from "@/server/emails/templates/welcome";
import type { NotificationType } from "@prisma/client";

function metaString(metadata: Record<string, unknown> | null, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function metaNumber(metadata: Record<string, unknown> | null, key: string): number | null {
  const value = metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function displayName(name: string | null | undefined, email: string): string {
  return name?.trim() || email.split("@")[0] || "friend";
}

function formatSessionDateTime(startTime: Date, timezone: string | null | undefined) {
  const tz = timezone?.trim() || "Asia/Kolkata";
  const dateLabel = startTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: tz,
  });
  const timeLabel = startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
    timeZoneName: "short",
  });
  return { dateLabel, timeLabel, tz };
}

async function loadSessionBundle(sessionId: string) {
  return prisma.careSession.findUnique({
    where: { id: sessionId },
    include: {
      user: { select: { name: true, email: true, timezone: true } },
      provider: { select: { name: true, image: true, role: true } },
    },
  });
}

export async function renderNotificationEmail(
  type: NotificationType,
  ctx: EmailRenderContext,
): Promise<RenderedEmail> {
  const metadata = ctx.metadata;
  const userName = displayName(ctx.userName, ctx.userEmail);

  switch (type) {
    case "WELCOME":
    case "WELCOME_BACK": {
      const isWelcomeBack = type === "WELCOME_BACK";
      return {
        subject: buildWelcomeSubject(isWelcomeBack, userName),
        html: renderWelcomeEmail({
          userName,
          isWelcomeBack,
          writeBlogUrl: "/dashboard/blog",
          bookSessionUrl: "/dashboard",
          exploreClubsUrl: "/clubs",
        }),
      };
    }

    case "BOOKING_ACCEPTED":
    case "LISTENER_REQUEST_APPROVED": {
      const sessionId = metaString(metadata, "sessionId");
      const session = sessionId ? await loadSessionBundle(sessionId) : null;
      const providerName =
        metaString(metadata, "providerName") ?? session?.provider.name ?? "Your healer";
      const startTime = session?.startTime ?? (metaString(metadata, "startTimeIso") ? new Date(metaString(metadata, "startTimeIso")!) : null);
      const durationMinutes = metaNumber(metadata, "durationMinutes") ?? session?.duration ?? 60;
      const timezone = metaString(metadata, "timezone") ?? session?.user.timezone;
      const meetingLink = metaString(metadata, "meetingLink") ?? session?.meetingLink ?? null;

      if (startTime) {
        const { dateLabel, timeLabel } = formatSessionDateTime(startTime, timezone);
        const title = `Apna Healer session with ${providerName}`;
        const googleCalendarUrl = buildGoogleCalendarUrl({
          title,
          startTime,
          durationMinutes,
          description: "Your confirmed healing session on Apna Healer.",
          meetingLink,
        });
        const attachment = sessionId
          ? buildSessionCalendarAttachment({
              sessionId,
              title,
              description: "Your confirmed healing session on Apna Healer.",
              startTime,
              durationMinutes,
              meetingLink,
            })
          : undefined;

        return {
          subject: buildSessionConfirmationSubject(providerName),
          html: renderSessionConfirmationEmail({
            userName,
            providerName,
            providerImageUrl: metaString(metadata, "providerImageUrl") ?? session?.provider.image ?? null,
            sessionDateLabel: dateLabel,
            sessionTimeLabel: timeLabel,
            durationMinutes,
            meetingLink,
            dashboardUrl: "/dashboard",
            googleCalendarUrl,
          }),
          attachments: attachment ? [attachment] : undefined,
        };
      }

      return fallback(ctx);
    }

    case "SESSION_REMINDER_24H":
    case "SESSION_REMINDER_1H": {
      const sessionId = metaString(metadata, "sessionId");
      if (!sessionId) return fallback(ctx);
      const session = await loadSessionBundle(sessionId);
      if (!session) return fallback(ctx);

      const { dateLabel, timeLabel } = formatSessionDateTime(session.startTime, session.user.timezone);
      const endTime = session.endTime ?? new Date(session.startTime.getTime() + session.duration * 60_000);
      const endLabel = endTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: session.user.timezone ?? "Asia/Kolkata",
        timeZoneName: "short",
      });
      const reminderLabel = type === "SESSION_REMINDER_24H" ? "Upcoming session — tomorrow" : "Upcoming session — in 1 hour";

      return {
        subject: buildSessionReminderSubject(reminderLabel, session.provider.name ?? "your healer"),
        html: renderSessionReminderEmail({
          userName,
          providerName: session.provider.name ?? "Your healer",
          providerImageUrl: session.provider.image,
          providerRole: session.provider.role === "THERAPIST" ? "Therapist" : "Listener",
          sessionDateLabel: dateLabel,
          sessionTimeLabel: `${timeLabel} — ${endLabel}`,
          joinUrl: session.meetingLink ?? "/dashboard",
          manageUrl: "/dashboard",
          reminderLabel,
        }),
      };
    }

    case "SESSION_FEEDBACK_REQUEST": {
      const sessionId = metaString(metadata, "sessionId");
      const session = sessionId ? await loadSessionBundle(sessionId) : null;
      const providerName = session?.provider.name ?? metaString(metadata, "providerName") ?? "your healer";
      const startTime = session?.startTime;
      const dateLabel = startTime
        ? formatSessionDateTime(startTime, session?.user.timezone).dateLabel
        : metaString(metadata, "sessionDateLabel") ?? "recently";

      return {
        subject: buildSessionFeedbackSubject(providerName),
        html: renderSessionFeedbackEmail({
          userName,
          providerName,
          sessionDateLabel: dateLabel,
          reviewUrl: ctx.href ?? `/dashboard?reviewSession=${sessionId ?? ""}`,
        }),
      };
    }

    case "BLOG_COMMENT_RECEIVED": {
      const actorName = metaString(metadata, "actorName") ?? "Someone";
      const blogTitle = metaString(metadata, "blogTitle") ?? "your blog";
      const excerpt = metaString(metadata, "commentExcerpt") ?? ctx.body;
      return {
        subject: buildCommunityActivitySubject(`${actorName} commented on "${blogTitle}"`),
        html: renderCommunityActivityEmail({
          userName,
          headline: "New activity on your blog",
          subheadline: "Someone felt moved by your story. Your vulnerability is creating ripples of healing.",
          actorName,
          actorImageUrl: metaString(metadata, "actorImageUrl"),
          activityTitle: `${actorName} commented on "${blogTitle}"`,
          activityExcerpt: excerpt,
          timeLabel: "Just now",
          ctaLabel: "View comment",
          ctaUrl: ctx.href ?? "/dashboard/blog",
          clubTeasers: [],
        }),
      };
    }

    case "CLUB_JOIN_APPROVED":
    case "EVENT_REGISTRATION_CONFIRMED":
    case "CLUB_ACTIVITY_DIGEST": {
      const clubTitle = metaString(metadata, "clubTitle");
      const teasersRaw = metadata?.clubTeasers;
      const clubTeasers = Array.isArray(teasersRaw)
        ? teasersRaw
            .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
            .map((t) => ({
              title: String(t.title ?? ""),
              subtitle: String(t.subtitle ?? ""),
              url: String(t.url ?? "/clubs"),
            }))
            .filter((t) => t.title)
        : [];

      return {
        subject: buildCommunityActivitySubject(ctx.title),
        html: renderCommunityActivityEmail({
          userName,
          headline: ctx.title,
          subheadline: ctx.body,
          actorName: metaString(metadata, "actorName") ?? "Apna Healer",
          actorImageUrl: metaString(metadata, "actorImageUrl"),
          activityTitle: clubTitle ? `Update in ${clubTitle}` : ctx.title,
          activityExcerpt: ctx.body,
          timeLabel: "Today",
          ctaLabel: "View in Apna Healer",
          ctaUrl: ctx.href ?? "/dashboard",
          clubTeasers,
        }),
      };
    }

    case "MONTHLY_RECAP": {
      const monthLabel = metaString(metadata, "monthLabel") ?? "last month";
      const suggestedClubsRaw = metadata?.suggestedClubs;
      const suggestedClubs = Array.isArray(suggestedClubsRaw)
        ? suggestedClubsRaw
            .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
            .map((c) => ({
              title: String(c.title ?? ""),
              description: String(c.description ?? ""),
              memberCount: Number(c.memberCount ?? 0),
              url: String(c.url ?? "/clubs"),
              imageUrl: typeof c.imageUrl === "string" ? c.imageUrl : null,
            }))
            .filter((c) => c.title)
        : [];
      const upcomingEventsRaw = metadata?.upcomingEvents;
      const upcomingEvents = Array.isArray(upcomingEventsRaw)
        ? upcomingEventsRaw
            .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
            .map((e) => ({
              title: String(e.title ?? ""),
              dateLabel: String(e.dateLabel ?? ""),
              url: String(e.url ?? "/dashboard/events"),
            }))
            .filter((e) => e.title)
        : [];

      return {
        subject: buildMonthlyRecapSubject(monthLabel),
        html: renderMonthlyRecapEmail({
          userName,
          monthLabel,
          sessionCount: metaNumber(metadata, "sessionCount") ?? 0,
          sessionMinutes: metaNumber(metadata, "sessionMinutes") ?? 0,
          journalCount: metaNumber(metadata, "journalCount") ?? 0,
          upcomingEvents,
          suggestedClubs,
          dashboardUrl: "/dashboard",
        }),
      };
    }

    case "WALLET_CREDIT":
    case "WALLET_DEBIT": {
      const isCredit = type === "WALLET_CREDIT";
      const amount = metaString(metadata, "amount") ?? ctx.body;
      const purpose = metaString(metadata, "purpose") ?? ctx.body;
      return {
        subject: buildPaymentConfirmationSubject(isCredit, amount),
        html: renderPaymentConfirmationEmail({
          userName,
          isCredit,
          amount,
          purpose,
          walletUrl: "/dashboard/wallet",
        }),
      };
    }

    case "CLUB_SUBSCRIPTION_CHARGED":
    case "CLUB_SUBSCRIPTION_FAILED":
    case "CLUB_MEMBER_PAYMENT_OVERDUE": {
      const variant =
        type === "CLUB_SUBSCRIPTION_CHARGED"
          ? "charged"
          : type === "CLUB_SUBSCRIPTION_FAILED"
            ? "failed"
            : "overdue";
      const clubTitle = metaString(metadata, "clubTitle") ?? "your club";
      const amount = metaString(metadata, "amount") ?? "";
      return {
        subject: buildSubscriptionUpdateSubject(variant, clubTitle),
        html: renderSubscriptionUpdateEmail({
          userName,
          variant,
          clubTitle,
          amount,
          actionUrl: ctx.href ?? "/dashboard/wallet",
        }),
      };
    }

    default:
      return fallback(ctx);
  }
}

function fallback(ctx: EmailRenderContext): RenderedEmail {
  return {
    subject: buildGenericSubject(ctx),
    html: renderGenericNotificationEmail(ctx),
  };
}

export function isRichEmailType(type: NotificationType): boolean {
  const richTypes: NotificationType[] = [
    "WELCOME",
    "WELCOME_BACK",
    "BOOKING_ACCEPTED",
    "LISTENER_REQUEST_APPROVED",
    "SESSION_REMINDER_24H",
    "SESSION_REMINDER_1H",
    "SESSION_FEEDBACK_REQUEST",
    "BLOG_COMMENT_RECEIVED",
    "CLUB_JOIN_APPROVED",
    "EVENT_REGISTRATION_CONFIRMED",
    "CLUB_ACTIVITY_DIGEST",
    "MONTHLY_RECAP",
    "WALLET_CREDIT",
    "WALLET_DEBIT",
    "CLUB_SUBSCRIPTION_CHARGED",
    "CLUB_SUBSCRIPTION_FAILED",
    "CLUB_MEMBER_PAYMENT_OVERDUE",
  ];
  return richTypes.includes(type);
}

export function shouldSendEmailForType(type: NotificationType): boolean {
  const alwaysEmail: NotificationType[] = [
    "APPLICATION_APPROVED",
    "APPLICATION_REJECTED",
    "BOOKING_ACCEPTED",
    "BOOKING_REJECTED",
    "BOOKING_CANCELLED",
    "LISTENER_REQUEST_ASSIGNED",
    "LISTENER_REQUEST_APPROVED",
    "LISTENER_REQUEST_DECLINED",
    "SESSION_CANCELLED",
    "SESSION_MISSED",
    "ADMIN_USER_UPDATED",
    "WELCOME",
    "WELCOME_BACK",
    "SESSION_REMINDER_24H",
    "SESSION_REMINDER_1H",
    "SESSION_FEEDBACK_REQUEST",
    "BLOG_COMMENT_RECEIVED",
    "CLUB_JOIN_APPROVED",
    "EVENT_REGISTRATION_CONFIRMED",
    "CLUB_ACTIVITY_DIGEST",
    "MONTHLY_RECAP",
    "WALLET_CREDIT",
    "WALLET_DEBIT",
    "CLUB_SUBSCRIPTION_CHARGED",
    "CLUB_SUBSCRIPTION_FAILED",
    "CLUB_MEMBER_PAYMENT_OVERDUE",
  ];
  return alwaysEmail.includes(type);
}

export type { EmailAttachment };
