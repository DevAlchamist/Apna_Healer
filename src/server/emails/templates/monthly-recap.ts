import type { MonthlyRecapProps } from "@/server/emails/types";
import { BRAND, escapeHtml, primaryButton, wrapEmailLayout } from "@/server/emails/render";

export function renderMonthlyRecapEmail(props: MonthlyRecapProps): string {
  const eventsHtml =
    props.upcomingEvents.length > 0
      ? props.upcomingEvents
          .map(
            (e) => `<p style="margin:0 0 8px;font-size:14px;color:${BRAND.onSurfaceVariant};">• ${escapeHtml(e.title)} — ${escapeHtml(e.dateLabel)}</p>`,
          )
          .join("")
      : `<p style="margin:0;font-size:14px;color:${BRAND.onSurfaceVariant};">No upcoming events registered yet.</p>`;

  const clubsHtml = props.suggestedClubs
    .map(
      (club) => `<div style="border:1px solid ${BRAND.outlineVariant};border-radius:12px;padding:16px;margin-bottom:12px;">
<p style="margin:0 0 4px;font-size:15px;font-weight:700;color:${BRAND.onSurface};">${escapeHtml(club.title)}</p>
<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${BRAND.onSurfaceVariant};">${escapeHtml(club.description)}</p>
<p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;color:${BRAND.onSurfaceVariant};">${club.memberCount} members</p>
</div>`,
    )
    .join("");

  const body = `
<section style="padding:0 24px;">
<p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${BRAND.onSecondaryContainer};text-align:center;">Monthly wellness recap</p>
<h2 style="margin:0 0 12px;font-size:26px;font-weight:800;color:${BRAND.onSurface};text-align:center;">Your path to healing</h2>
<p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:${BRAND.onSurfaceVariant};text-align:center;max-width:480px;margin-left:auto;margin-right:auto;">
Take a deep breath, ${escapeHtml(props.userName)}. In ${escapeHtml(props.monthLabel)}, you dedicated intentional time to your emotional sanctuary.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
<tr><td style="background-color:${BRAND.secondaryContainer};border-radius:12px;padding:24px;">
<p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;color:${BRAND.onSecondaryContainer};">Minutes of stillness</p>
<p style="margin:0;font-size:42px;font-weight:800;color:${BRAND.onPrimaryContainer};line-height:1;">${props.sessionMinutes} <span style="font-size:16px;font-weight:400;">min</span></p>
</td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="48%" style="padding-right:8px;vertical-align:top;">
<div style="background-color:#f5f3f0;border:1px solid ${BRAND.outlineVariant};border-radius:12px;padding:20px;">
<p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;color:${BRAND.onSurfaceVariant};">Journal entries</p>
<p style="margin:0;font-size:24px;font-weight:700;color:${BRAND.onSurface};">${props.journalCount}</p>
</div>
</td>
<td width="48%" style="padding-left:8px;vertical-align:top;">
<div style="background-color:#f5f3f0;border:1px solid ${BRAND.outlineVariant};border-radius:12px;padding:20px;">
<p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;color:${BRAND.onSurfaceVariant};">Sessions completed</p>
<p style="margin:0;font-size:24px;font-weight:700;color:${BRAND.onSurface};">${props.sessionCount}</p>
</div>
</td>
</tr></table>

<div style="background-color:#efeeeb;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
<p style="margin:0;font-size:16px;font-style:italic;line-height:1.6;color:${BRAND.onSurfaceVariant};">"Healing is not a linear process, but a series of quiet, persistent choices to return to yourself."</p>
</div>

<h3 style="margin:0 0 12px;font-size:18px;font-weight:700;color:${BRAND.onSurface};">Upcoming events</h3>
${eventsHtml}

<h3 style="margin:24px 0 12px;font-size:18px;font-weight:700;color:${BRAND.onSurface};">Circles you might like</h3>
${clubsHtml}

${primaryButton("View full dashboard", props.dashboardUrl)}
</section>`;

  return wrapEmailLayout(body);
}

export function buildMonthlyRecapSubject(monthLabel: string): string {
  return `Your ${monthLabel} wellness recap`;
}
