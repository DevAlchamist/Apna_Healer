import type { EmailRenderContext } from "@/server/emails/types";
import { absoluteUrl, escapeHtml, wrapEmailLayout } from "@/server/emails/render";

export function renderGenericNotificationEmail(ctx: EmailRenderContext): string {
  const linkBlock = ctx.href
    ? `<p style="margin-top:20px;"><a href="${escapeHtml(absoluteUrl(ctx.href))}" style="color:#396755;font-weight:700;text-decoration:none;">View in Apna Healer →</a></p>`
    : "";

  const body = `
<section style="padding:0 24px;">
<h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#396755;">${escapeHtml(ctx.title)}</h2>
<p style="margin:0;font-size:15px;line-height:1.6;color:#414944;">${escapeHtml(ctx.body)}</p>
${linkBlock}
</section>`;

  return wrapEmailLayout(body);
}

export function buildGenericSubject(ctx: EmailRenderContext): string {
  return ctx.title;
}
