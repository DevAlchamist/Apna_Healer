import type { SessionReminderProps } from "@/server/emails/types";
import { BRAND, escapeHtml, primaryButton, secondaryLink, wrapEmailLayout } from "@/server/emails/render";

const DEFAULT_PROVIDER_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuABl_ZakqbEMvNWRu26bqSAXrHtm5HMts6GtzQ2IlwfaCbOYYZ-G6NedRfCQUCvu_uiOuixtdQeRCI-WKYJl3SCFfpDAWLTcgUi1B3jzx-KocLzcMRoNZiO4RNg-ADpyiaEoYQ8Vx1t9dJXZ95dFJ11m1tU6Rzb79VTVWBF3JCxo_CqXxDmBJa1DeKU48xsTF2QmuBtYt04Iwe9AKZtjeIpPEbu8mBctycC0vN0ddMJhqb_KzpNZUbki3BTCZoV8FPFNsX_hsbR6LU";

export function renderSessionReminderEmail(props: SessionReminderProps): string {
  const avatar = props.providerImageUrl ?? DEFAULT_PROVIDER_IMAGE;

  const body = `
<section style="padding:0 24px;">
<p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${BRAND.primary};text-align:center;">${escapeHtml(props.reminderLabel)}</p>
<h1 style="margin:0 0 24px;font-size:26px;font-weight:800;color:${BRAND.onSurface};text-align:center;">A moment for yourself.</h1>

<div style="background-color:${BRAND.secondaryContainer};border-radius:12px;padding:20px;border:1px solid ${BRAND.outlineVariant};margin-bottom:32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
<tr>
<td width="64" style="vertical-align:top;padding-right:12px;">
<img src="${escapeHtml(avatar)}" alt="" width="64" height="64" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #fff;"/>
</td>
<td>
<h2 style="margin:0;font-size:18px;font-weight:700;color:${BRAND.onSecondaryContainer};">${escapeHtml(props.providerName)}</h2>
<p style="margin:4px 0 0;font-size:14px;color:${BRAND.onSecondaryContainer};opacity:0.85;">${escapeHtml(props.providerRole)}</p>
</td>
</tr>
</table>
<div style="border-top:1px solid rgba(81,106,95,0.15);border-bottom:1px solid rgba(81,106,95,0.15);padding:16px 0;margin-bottom:16px;">
<p style="margin:0 0 8px;font-size:15px;color:${BRAND.onSecondaryContainer};">📅 ${escapeHtml(props.sessionDateLabel)}</p>
<p style="margin:0;font-size:15px;color:${BRAND.onSecondaryContainer};">🕐 ${escapeHtml(props.sessionTimeLabel)}</p>
</div>
${primaryButton("Join session", props.joinUrl)}
</div>

<h3 style="margin:0 0 16px;font-size:18px;font-weight:700;color:${BRAND.onSurface};">Preparation guide</h3>
<div style="background-color:#efeeeb;border-radius:12px;padding:16px;margin-bottom:12px;">
<p style="margin:0 0 4px;font-size:15px;font-weight:700;color:${BRAND.onSurface};">Find your sanctuary</p>
<p style="margin:0;font-size:14px;line-height:1.5;color:${BRAND.onSurfaceVariant};">Choose a quiet, private space where you won't be interrupted.</p>
</div>
<div style="background-color:#efeeeb;border-radius:12px;padding:16px;margin-bottom:12px;">
<p style="margin:0 0 4px;font-size:15px;font-weight:700;color:${BRAND.onSurface};">Grounding breath</p>
<p style="margin:0;font-size:14px;line-height:1.5;color:${BRAND.onSurfaceVariant};">Arrive 5 minutes early. Practice three deep breaths to transition into this healing space.</p>
</div>

<div style="text-align:center;padding:24px 0;border-top:1px solid ${BRAND.outlineVariant};margin-top:24px;">
<p style="margin:0 0 12px;font-size:14px;color:${BRAND.onSurfaceVariant};">Need to reschedule or have questions?</p>
${secondaryLink("Manage booking", props.manageUrl)}
</div>
</section>`;

  return wrapEmailLayout(body);
}

export function buildSessionReminderSubject(reminderLabel: string, providerName: string): string {
  return `${reminderLabel}: Session with ${providerName}`;
}
