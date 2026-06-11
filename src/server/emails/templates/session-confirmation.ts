import type { SessionConfirmationProps } from "@/server/emails/types";
import { BRAND, escapeHtml, primaryButton, secondaryLink, wrapEmailLayout } from "@/server/emails/render";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD_8c3Jcb1-dsfZcIPyQOHWjaZ8wNe1StCKYqG5ivKcGo5eDm5Du5Q0ajO4k2McT3owmisctk_5Ird3uDJe2Rw1moRR6nsrozKe3OEdyL20GfSq6uIQfuE1Jy6KWFwx3xpm135-9Mavx0smkDZv9eJwbIlTLA8rLYtO5gI58ITMJ8hRvx5vYmAEHvgXdMmne0FFF9v70kpK3mnLTCcAwdCWC-IPXsybc90c1C5lm4fGBhiQ8i-pnbG8Xq0bb0bAo78laQ0wNHSyDQ8";

export function renderSessionConfirmationEmail(props: SessionConfirmationProps): string {
  const body = `
<section style="padding:0 24px;">
<p style="margin:0 0 8px;font-size:14px;color:${BRAND.onSurfaceVariant};text-align:center;">Finding your breath, ${escapeHtml(props.userName)}</p>
<img src="${HERO_IMAGE}" alt="" width="552" style="width:100%;max-width:552px;height:auto;border-radius:12px;margin:16px 0 24px;display:block;"/>
<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND.onSurface};">Your healing journey awaits</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:${BRAND.onSurfaceVariant};">We've confirmed your session. Take a moment to acknowledge this commitment to your well-being.</p>

<div style="background-color:rgba(205,233,220,0.45);border-radius:12px;padding:20px;margin-bottom:24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
<tr>
<td width="48" style="vertical-align:top;padding-right:12px;">
<div style="width:40px;height:40px;border-radius:50%;background:#fff;text-align:center;line-height:40px;font-size:18px;">📅</div>
</td>
<td>
<p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.onSecondaryContainer};">Date &amp; Time</p>
<p style="margin:0;font-size:16px;font-weight:600;color:${BRAND.onSurface};">${escapeHtml(props.sessionDateLabel)} • ${escapeHtml(props.sessionTimeLabel)}</p>
</td>
</tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="48" style="vertical-align:top;padding-right:12px;">
<div style="width:40px;height:40px;border-radius:50%;background:#fff;text-align:center;line-height:40px;font-size:18px;">🧘</div>
</td>
<td>
<p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.onSecondaryContainer};">Healer</p>
<p style="margin:0;font-size:16px;font-weight:600;color:${BRAND.onSurface};">${escapeHtml(props.providerName)}</p>
<p style="margin:4px 0 0;font-size:13px;color:${BRAND.onSurfaceVariant};">${props.durationMinutes} minutes</p>
</td>
</tr>
</table>
</div>

${primaryButton("Add to Google Calendar", props.googleCalendarUrl)}

<div style="background-color:#fff;border-radius:12px;padding:20px;margin-top:24px;">
<h3 style="margin:0 0 16px;font-size:16px;font-weight:700;color:${BRAND.onSurface};">While you wait…</h3>
<p style="margin:0 0 8px;">${secondaryLink("Write a reflection", "/dashboard/journal/write")}</p>
<p style="margin:0 0 8px;">${secondaryLink("Join a club", "/clubs")}</p>
${props.meetingLink ? `<p style="margin:16px 0 0;">${secondaryLink("Open meeting link", props.meetingLink)}</p>` : ""}
</div>
</section>`;

  return wrapEmailLayout(body);
}

export function buildSessionConfirmationSubject(providerName: string): string {
  return `Session confirmed with ${providerName}`;
}
