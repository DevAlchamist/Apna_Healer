const BRAND = {
  primary: "#396755",
  surface: "#fbf9f6",
  onSurface: "#1b1c1a",
  onSurfaceVariant: "#414944",
  secondaryContainer: "#cde9dc",
  onSecondaryContainer: "#516a5f",
  primaryContainer: "#7faf9a",
  onPrimaryContainer: "#124332",
  outlineVariant: "#c0c8c3",
  error: "#ba1a1a",
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function absoluteUrl(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}${href.startsWith("/") ? href : `/${href}`}`;
}

export function truncateText(text: string, maxLen: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

export function wrapEmailLayout(bodyHtml: string): string {
  const prefsUrl = absoluteUrl("/dashboard/profile");
  const privacyUrl = absoluteUrl("/privacy");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Apna Healer</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.surface};font-family:Manrope,Inter,system-ui,sans-serif;color:${BRAND.onSurface};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.surface};">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td align="center" style="padding:16px 0 24px;">
<span style="font-size:22px;font-weight:800;color:${BRAND.primary};letter-spacing:-0.02em;">Apna Healer</span>
</td></tr>
<tr><td>${bodyHtml}</td></tr>
<tr><td style="padding:32px 24px 24px;background-color:#eae8e5;border-radius:12px 12px 0 0;margin-top:32px;">
<p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.onSurface};text-align:center;">Apna Healer Mission</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:${BRAND.onSurfaceVariant};font-style:italic;text-align:center;">"Creating a sanctuary within the digital noise, empowering your healing journey one breath at a time."</p>
<p style="margin:0 0 16px;font-size:12px;font-weight:700;color:${BRAND.error};text-align:center;">Crisis Resources: <a href="tel:988" style="color:${BRAND.error};">988</a> (National Suicide &amp; Crisis Lifeline)</p>
<p style="margin:0 0 8px;font-size:12px;text-align:center;">
<a href="${escapeHtml(prefsUrl)}" style="color:${BRAND.onSurfaceVariant};margin:0 8px;">Preferences</a>
<a href="${escapeHtml(privacyUrl)}" style="color:${BRAND.onSurfaceVariant};margin:0 8px;">Privacy Policy</a>
</p>
<p style="margin:16px 0 0;font-size:11px;color:${BRAND.onSurfaceVariant};text-align:center;">© ${new Date().getFullYear()} Apna Healer. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function primaryButton(label: string, href: string): string {
  const url = absoluteUrl(href);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px auto;">
<tr><td align="center" style="border-radius:999px;background-color:${BRAND.primaryContainer};">
<a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:${BRAND.onPrimaryContainer};text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
</td></tr>
</table>`;
}

export function secondaryLink(label: string, href: string): string {
  const url = absoluteUrl(href);
  return `<a href="${escapeHtml(url)}" style="color:${BRAND.primary};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;text-decoration:none;">${escapeHtml(label)} →</a>`;
}

export { BRAND };
