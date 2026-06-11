import type { SessionFeedbackProps } from "@/server/emails/types";
import { BRAND, escapeHtml, primaryButton, wrapEmailLayout } from "@/server/emails/render";

export function renderSessionFeedbackEmail(props: SessionFeedbackProps): string {
  const body = `
<section style="padding:0 24px;text-align:center;">
<div style="width:64px;height:64px;border-radius:50%;background-color:${BRAND.secondaryContainer};margin:0 auto 20px;line-height:64px;font-size:28px;">⭐</div>
<h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:${BRAND.onSurface};">How was your session?</h1>
<p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:${BRAND.onSurfaceVariant};max-width:480px;margin-left:auto;margin-right:auto;">
Hi ${escapeHtml(props.userName)}, your session with ${escapeHtml(props.providerName)} on ${escapeHtml(props.sessionDateLabel)} is complete.
</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:${BRAND.onSurfaceVariant};max-width:480px;margin-left:auto;margin-right:auto;">
Your feedback helps us improve and supports others finding the right healer. It only takes a minute.
</p>
${primaryButton("Rate your experience", props.reviewUrl)}
</section>`;

  return wrapEmailLayout(body);
}

export function buildSessionFeedbackSubject(providerName: string): string {
  return `Share feedback on your session with ${providerName}`;
}
