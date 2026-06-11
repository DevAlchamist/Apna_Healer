import type { CommunityActivityProps } from "@/server/emails/types";
import { BRAND, escapeHtml, primaryButton, wrapEmailLayout } from "@/server/emails/render";

const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBlBVL3LreGP9TXcZaRiEIAiFighHR47gGRyGoQz8IeUwodDRoh5j2gJHZJRZz8OmwtnmSkZqfzLNcZj1SxsYKpIbPlC5hZZAMDFIRrfkhAF-v45eQ64wZVw83PWgVM593M_yXNdLADR8nh_rqQYM2BvVZi9sL_fjfrmXjbUvDwtaDo1sZUexiFrHuhHB3_LrA1Eay1oht2Mk36uGgMi1p4wZMp-oEbZlsl44-s9mQmes-wXgq74Tn4z3VAjPTIKb1NubcVyX450cM";

export function renderCommunityActivityEmail(props: CommunityActivityProps): string {
  const avatar = props.actorImageUrl ?? DEFAULT_AVATAR;

  const clubTeasersHtml =
    props.clubTeasers.length > 0
      ? `<p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND.primary};text-align:center;">Also new in your clubs</p>
${props.clubTeasers
  .map(
    (club) => `<div style="background-color:rgba(205,233,220,0.35);border-radius:12px;padding:16px;margin-bottom:8px;">
<p style="margin:0 0 4px;font-size:15px;font-weight:600;color:${BRAND.onSurface};">${escapeHtml(club.title)}</p>
<p style="margin:0;font-size:13px;color:${BRAND.onSurfaceVariant};">${escapeHtml(club.subtitle)}</p>
</div>`,
  )
  .join("")}`
      : "";

  const body = `
<section style="padding:0 24px;text-align:center;">
<div style="width:64px;height:64px;border-radius:50%;background-color:${BRAND.secondaryContainer};margin:0 auto 20px;line-height:64px;font-size:28px;">🎉</div>
<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${BRAND.onSurface};">${escapeHtml(props.headline)}</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:${BRAND.onSurfaceVariant};max-width:480px;margin-left:auto;margin-right:auto;">${escapeHtml(props.subheadline)}</p>

<div style="background-color:#f5f3f0;border-radius:12px;padding:16px;border:1px solid ${BRAND.outlineVariant};text-align:left;margin-bottom:24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="48" style="vertical-align:top;padding-right:12px;">
<img src="${escapeHtml(avatar)}" alt="" width="48" height="48" style="width:48px;height:48px;border-radius:50%;object-fit:cover;"/>
</td>
<td>
<p style="margin:0 0 8px;font-size:14px;font-weight:700;color:${BRAND.onSurface};">${escapeHtml(props.activityTitle)} <span style="font-size:10px;font-weight:700;color:#717974;float:right;">${escapeHtml(props.timeLabel)}</span></p>
<div style="background:rgba(255,255,255,0.7);border-radius:12px;border-top-left-radius:0;padding:16px;border:1px solid rgba(205,233,220,0.5);">
<p style="margin:0;font-size:15px;line-height:1.6;color:${BRAND.onSurface};font-style:italic;">"${escapeHtml(props.activityExcerpt)}"</p>
</div>
</td>
</tr>
</table>
</div>

${clubTeasersHtml}
${primaryButton(props.ctaLabel, props.ctaUrl)}
<p style="margin:16px 0 0;font-size:14px;color:${BRAND.onSurfaceVariant};">Connecting with others is a vital part of the healing process.</p>
</section>`;

  return wrapEmailLayout(body);
}

export function buildCommunityActivitySubject(headline: string): string {
  return headline;
}
