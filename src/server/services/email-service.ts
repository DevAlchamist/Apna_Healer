import type { NotificationType } from "@prisma/client";

const EMAIL_ELIGIBLE_TYPES = new Set<NotificationType>([
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

export function isEmailEligibleType(type: NotificationType): boolean {
  return EMAIL_ELIGIBLE_TYPES.has(type);
}

export async function sendNotificationEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[email-service] RESEND_API_KEY or EMAIL_FROM missing; skipping email.");
    }
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[email-service] Resend API error:", res.status, text);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[email-service] Failed to send email:", error);
    return false;
  }
}

export function buildNotificationEmailHtml(title: string, body: string, href?: string | null): string {
  const linkBlock = href
    ? `<p style="margin-top:16px"><a href="${escapeHtml(absoluteUrl(href))}" style="color:#2D5A4C;font-weight:600">View in Apna Healer</a></p>`
    : "";

  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;color:#1a1a1a">
      <h2 style="margin:0 0 12px;font-size:20px;color:#2D5A4C">${escapeHtml(title)}</h2>
      <p style="margin:0;line-height:1.5;color:#444">${escapeHtml(body)}</p>
      ${linkBlock}
      <p style="margin-top:24px;font-size:12px;color:#888">Apna Healer</p>
    </div>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteUrl(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}${href.startsWith("/") ? href : `/${href}`}`;
}
