import type { WelcomeEmailProps } from "@/server/emails/types";
import { BRAND, escapeHtml, primaryButton, secondaryLink, wrapEmailLayout } from "@/server/emails/render";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBtSHnEAICzvfm7dXLJbZavPz4bqUm1wP7qfRh9p7_w5Joqx6JyMMu4-45arUj21YeP2KfJVHjl4nNsDVJBKBsF9yy55T_A7mQtppupGpyrSTcfYHhRwFpfrx2fjnVot2srX0EPrNE9dRZQJ0crdWE50h-NT3RGwxsjApO28eGAYqzgQZ0oOTME1MfJTqkuWflA3qmFUiMOeo3TrnneYlK1qVfR3JnPQBlXZY05RNu_8gH6WKFg5pUkIYQqs4vmn1gHVsEroP5ggWE";

export function renderWelcomeEmail(props: WelcomeEmailProps): string {
  const greeting = props.isWelcomeBack
    ? `Welcome back, ${escapeHtml(props.userName)}.`
    : `Welcome to Apna Healer, ${escapeHtml(props.userName)}.`;

  const intro = props.isWelcomeBack
    ? "Your sanctuary remains exactly as you left it—quiet, supportive, and ready for your return."
    : "We're glad you're here. Your healing journey starts with small, intentional steps—and we're here for each one.";

  const body = `
<section style="padding:0 24px;">
<img src="${HERO_IMAGE}" alt="" width="552" style="width:100%;max-width:552px;height:auto;border-radius:12px;margin-bottom:24px;display:block;"/>
<div style="text-align:center;max-width:500px;margin:0 auto 32px;">
<h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:${BRAND.onSurface};line-height:1.2;">${greeting}</h1>
<p style="margin:0;font-size:16px;line-height:1.6;color:${BRAND.onSurfaceVariant};">${intro}</p>
</div>

<div style="background-color:${BRAND.secondaryContainer};border-radius:12px;padding:24px;margin-bottom:16px;">
<h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:${BRAND.onSecondaryContainer};">Write a blog</h2>
<p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:${BRAND.onSecondaryContainer};">Share your story and connect with others on their healing path.</p>
${primaryButton("Write a blog", props.writeBlogUrl)}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="48%" style="vertical-align:top;padding-right:8px;">
<div style="background-color:#f5f3f0;border:1px solid ${BRAND.outlineVariant};border-radius:12px;padding:20px;height:100%;">
<h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:${BRAND.onSurface};">Book a session</h3>
<p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${BRAND.onSurfaceVariant};">Connect with therapists and listeners tailored to your journey.</p>
${secondaryLink("Book a session", props.bookSessionUrl)}
</div>
</td>
<td width="48%" style="vertical-align:top;padding-left:8px;">
<div style="background-color:#f5f3f0;border:1px solid ${BRAND.outlineVariant};border-radius:12px;padding:20px;height:100%;">
<h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:${BRAND.onSurface};">Explore clubs</h3>
<p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${BRAND.onSurfaceVariant};">Find healing through shared stories in community circles.</p>
${secondaryLink("Explore clubs", props.exploreClubsUrl)}
</div>
</td>
</tr></table>

<div style="margin-top:32px;padding-top:24px;border-top:1px solid ${BRAND.outlineVariant};text-align:center;">
<p style="margin:0;font-size:14px;font-style:italic;color:${BRAND.onSurfaceVariant};">"Healing is not a destination, but a way of moving through the world."</p>
<p style="margin:16px 0 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.primary};">Warmly,<br/>The Apna Healer Team</p>
</div>
</section>`;

  return wrapEmailLayout(body);
}

export function buildWelcomeSubject(isWelcomeBack: boolean, userName: string): string {
  return isWelcomeBack
    ? `${userName}, welcome back to Apna Healer`
    : `Welcome to Apna Healer, ${userName}`;
}
