import type { SubscriptionUpdateProps } from "@/server/emails/types";
import { BRAND, escapeHtml, primaryButton, wrapEmailLayout } from "@/server/emails/render";

const VARIANT_COPY = {
  charged: {
    heading: "Club subscription paid",
    icon: "✓",
    message: (club: string, amount: string) =>
      `Your subscription payment of ${amount} for "${club}" was processed successfully.`,
  },
  failed: {
    heading: "Club payment failed",
    icon: "!",
    message: (club: string, amount: string) =>
      `We couldn't charge ${amount} for "${club}". Please top up your wallet to keep your membership active.`,
  },
  overdue: {
    heading: "Membership payment overdue",
    icon: "⚠",
    message: (club: string) =>
      `A member payment for "${club}" is overdue. Review membership status in your club dashboard.`,
  },
} as const;

export function renderSubscriptionUpdateEmail(props: SubscriptionUpdateProps): string {
  let message: string;
  if (props.variant === "overdue") {
    message = VARIANT_COPY.overdue.message(props.clubTitle);
  } else if (props.variant === "charged") {
    message = VARIANT_COPY.charged.message(props.clubTitle, props.amount);
  } else {
    message = VARIANT_COPY.failed.message(props.clubTitle, props.amount);
  }

  const body = `
<section style="padding:0 24px;text-align:center;">
<div style="width:64px;height:64px;border-radius:50%;background-color:${BRAND.secondaryContainer};margin:0 auto 20px;line-height:64px;font-size:28px;">${VARIANT_COPY[props.variant].icon}</div>
<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:${BRAND.onSurface};">${VARIANT_COPY[props.variant].heading}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:${BRAND.onSurfaceVariant};max-width:480px;margin-left:auto;margin-right:auto;">
Hi ${escapeHtml(props.userName)}, ${message}
</p>
${primaryButton("View details", props.actionUrl)}
</section>`;

  return wrapEmailLayout(body);
}

export function buildSubscriptionUpdateSubject(variant: SubscriptionUpdateProps["variant"], clubTitle: string): string {
  if (variant === "charged") return `Subscription paid for ${clubTitle}`;
  if (variant === "failed") return `Payment failed for ${clubTitle}`;
  return `Overdue payment for ${clubTitle}`;
}
