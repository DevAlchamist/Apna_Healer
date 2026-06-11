import type { NotificationType } from "@prisma/client";

export type EmailAttachment = {
  filename: string;
  content: string;
  contentType?: string;
};

export type EmailRenderContext = {
  userName: string | null;
  userEmail: string;
  title: string;
  body: string;
  href: string | null;
  metadata: Record<string, unknown> | null;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
};

export type EmailTemplateEntry = {
  buildSubject: (ctx: EmailRenderContext) => string;
  renderHtml: (ctx: EmailRenderContext) => string;
  buildAttachments?: (ctx: EmailRenderContext) => EmailAttachment[] | undefined;
};

export type WelcomeEmailProps = {
  userName: string;
  isWelcomeBack: boolean;
  writeBlogUrl: string;
  bookSessionUrl: string;
  exploreClubsUrl: string;
};

export type SessionConfirmationProps = {
  userName: string;
  providerName: string;
  providerImageUrl: string | null;
  sessionDateLabel: string;
  sessionTimeLabel: string;
  durationMinutes: number;
  meetingLink: string | null;
  dashboardUrl: string;
  googleCalendarUrl: string;
};

export type SessionReminderProps = {
  userName: string;
  providerName: string;
  providerImageUrl: string | null;
  providerRole: string;
  sessionDateLabel: string;
  sessionTimeLabel: string;
  joinUrl: string;
  manageUrl: string;
  reminderLabel: string;
};

export type SessionFeedbackProps = {
  userName: string;
  providerName: string;
  sessionDateLabel: string;
  reviewUrl: string;
};

export type CommunityActivityProps = {
  userName: string;
  headline: string;
  subheadline: string;
  actorName: string;
  actorImageUrl: string | null;
  activityTitle: string;
  activityExcerpt: string;
  timeLabel: string;
  ctaLabel: string;
  ctaUrl: string;
  clubTeasers: Array<{ title: string; subtitle: string; url: string }>;
};

export type MonthlyRecapProps = {
  userName: string;
  monthLabel: string;
  sessionCount: number;
  sessionMinutes: number;
  journalCount: number;
  upcomingEvents: Array<{ title: string; dateLabel: string; url: string }>;
  suggestedClubs: Array<{ title: string; description: string; memberCount: number; url: string; imageUrl: string | null }>;
  dashboardUrl: string;
};

export type PaymentConfirmationProps = {
  userName: string;
  isCredit: boolean;
  amount: string;
  purpose: string;
  walletUrl: string;
};

export type SubscriptionUpdateProps = {
  userName: string;
  variant: "charged" | "failed" | "overdue";
  clubTitle: string;
  amount: string;
  actionUrl: string;
};

/** Notification types that always send email (registry or generic fallback). */
export const LEGACY_EMAIL_TYPES = new Set<NotificationType>([
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
]);
