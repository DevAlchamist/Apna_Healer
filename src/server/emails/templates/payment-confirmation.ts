import type { PaymentConfirmationProps } from "@/server/emails/types";
import { BRAND, escapeHtml, primaryButton, wrapEmailLayout } from "@/server/emails/render";

export function renderPaymentConfirmationEmail(props: PaymentConfirmationProps): string {
  const heading = props.isCredit ? "Payment received" : "Payment processed";
  const icon = props.isCredit ? "✓" : "→";

  const body = `
<section style="padding:0 24px;text-align:center;">
<div style="width:64px;height:64px;border-radius:50%;background-color:${BRAND.secondaryContainer};margin:0 auto 20px;line-height:64px;font-size:28px;color:${BRAND.primary};">${icon}</div>
<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:${BRAND.onSurface};">${heading}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:${BRAND.onSurfaceVariant};">
Hi ${escapeHtml(props.userName)}, we've ${props.isCredit ? "credited" : "debited"} <strong>${escapeHtml(props.amount)}</strong> to your wallet.
</p>
<div style="background-color:#f5f3f0;border-radius:12px;padding:20px;text-align:left;margin-bottom:24px;">
<p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;color:${BRAND.onSurfaceVariant};">Purpose</p>
<p style="margin:0;font-size:15px;color:${BRAND.onSurface};">${escapeHtml(props.purpose)}</p>
</div>
${primaryButton("View wallet", props.walletUrl)}
</section>`;

  return wrapEmailLayout(body);
}

export function buildPaymentConfirmationSubject(isCredit: boolean, amount: string): string {
  return isCredit ? `Wallet credited: ${amount}` : `Wallet debited: ${amount}`;
}
