import type { Delivery } from "@/lib/deliveries/types"
import { parseCoordsFromAddress } from "@/lib/deliveries/tookan"

import { getAppUrl, getLogoUrl, getResend, getResendFrom } from "./resend"

export function payUrlForDelivery(trackingId: string) {
  return `${getAppUrl()}/pay?id=${encodeURIComponent(trackingId)}`
}

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName
}

function displayAddress(address: string) {
  return parseCoordsFromAddress(address).label || address.trim()
}

export async function sendRecipientPayLinkEmail(delivery: Delivery) {
  const resend = getResend()
  const to = delivery.recipientEmail?.trim()
  if (!resend || !to) {
    console.warn(
      `[email] skip pay link for ${delivery.trackingId}: missing Resend or recipient email`,
    )
    return { skipped: true as const }
  }

  const payUrl = payUrlForDelivery(delivery.trackingId)
  const logo = getLogoUrl()
  const home = getAppUrl()
  const code = escapeHtml(delivery.trackingId)
  const pickup = escapeHtml(displayAddress(delivery.pickup))
  const dropoff = escapeHtml(displayAddress(delivery.dropoff))
  const fare = delivery.fareGhs
  const name = escapeHtml(firstName(delivery.recipientName))

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Pay for delivery ${code}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f6;${FONT};color:#0a2540;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f6;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e6ebf1;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:22px 24px 8px;text-align:center;">
              <a href="${escapeHtml(home)}" style="text-decoration:none;">
                <img src="${escapeHtml(logo)}" alt="Diatel" height="28" style="display:inline-block;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;text-align:center;">
              <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#697386;">Payment needed</p>
              <h1 style="margin:8px 0 0;font-size:24px;letter-spacing:-0.03em;">Hi ${name}, pay for your delivery</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#425466;">
                ${escapeHtml(delivery.senderName)} booked a Diatel delivery to you.
                Pay <strong>GHS ${fare}</strong> with MoMo, card, or bank to release the rider.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;">
              <table role="presentation" width="100%" style="background:#f6f9fc;border:1px solid #e6ebf1;border-radius:10px;">
                <tr>
                  <td style="padding:14px 16px;font-size:13px;line-height:1.5;color:#425466;">
                    <div><strong style="color:#0a2540;">Tracking</strong> · ${code}</div>
                    <div style="margin-top:6px;"><strong style="color:#0a2540;">From</strong> · ${pickup}</div>
                    <div style="margin-top:6px;"><strong style="color:#0a2540;">To</strong> · ${dropoff}</div>
                    <div style="margin-top:6px;"><strong style="color:#0a2540;">Fare</strong> · GHS ${fare}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <a href="${escapeHtml(payUrl)}"
                style="display:inline-block;background:#fe5200;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;">
                Pay GHS ${fare}
              </a>
              <p style="margin:14px 0 0;font-size:12px;color:#697386;line-height:1.45;">
                You can pay anytime — delivery can proceed while this is pending.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const result = await resend.emails.send({
    from: getResendFrom(),
    to,
    subject: `Pay GHS ${fare} for Diatel delivery ${delivery.trackingId}`,
    html,
  })

  console.log(`[email] pay link sent for ${delivery.trackingId}`, result)
  return result
}
