import type { Delivery } from "@/lib/deliveries/types"

import {
  amountBlock,
  buttonBlock,
  displayAddress,
  handoverCodeBlock,
  escapeHtml,
  factsBlock,
  firstName,
  heroBlock,
  linkFallbackBlock,
  renderEmail,
  routeBlock,
  trackingBlock,
  trackUrl,
} from "./layout"
import { getAppUrl, getResend, getResendFrom } from "./resend"

export function payUrlForDelivery(trackingId: string) {
  return `${getAppUrl()}/pay?id=${encodeURIComponent(trackingId)}`
}

export type PayLinkEmailResult =
  | { ok: true; to: string; id?: string }
  | { ok: false; reason: string }

export function buildPayRequestHtml(delivery: Delivery, handoverCode?: string) {
  const payUrl = payUrlForDelivery(delivery.trackingId)
  const sender = escapeHtml(delivery.senderName)
  const amount = `GHS ${delivery.fareGhs}`

  return renderEmail({
    title: `Pay ${amount} for your delivery`,
    preheader: `${delivery.senderName} sent you a delivery — pay ${amount} with MoMo or card.`,
    blocks: [
      heroBlock({
        kicker: "Payment requested",
        tone: "orange",
        heading: `Hi ${firstName(delivery.recipientName)}, ${firstName(delivery.senderName)} sent you a delivery`,
        intro: `${sender} booked a Diatel delivery to you and asked you to pay for it. The rider is already being dispatched — pay now or anytime before it arrives.`,
      }),
      amountBlock({
        label: "Amount due",
        amount: `${amount}.00`,
        note: "Secure checkout by Paystack · Mobile Money, card or bank",
      }),
      buttonBlock({
        href: payUrl,
        label: `Pay ${amount}`,
        secondary: { href: trackUrl(delivery.trackingId), label: "Track the delivery" },
      }),
      ...(handoverCode ? [handoverCodeBlock(handoverCode)] : []),
      trackingBlock({
        code: delivery.trackingId,
        metaLabel: delivery.pickupWindow === "schedule" ? "Scheduled for" : "ETA",
        metaValue: delivery.etaLabel,
      }),
      routeBlock({
        pickup: displayAddress(delivery.pickup),
        pickupNote: `From ${delivery.senderName}`,
        dropoff: displayAddress(delivery.dropoff),
        dropoffNote: "Delivered to you",
      }),
      factsBlock([
        { label: "Package", value: delivery.packageType },
        { label: "Size", value: delivery.size.charAt(0).toUpperCase() + delivery.size.slice(1) },
      ]),
      linkFallbackBlock(payUrl),
    ],
    footerNote: `You’re receiving this because ${delivery.senderName} sent you a delivery and chose “Recipient pays”.`,
  })
}

/**
 * Emails the recipient their pay link through Resend. Resend reports failures
 * in its response (it doesn't throw), so the result says whether it really went.
 */
export async function sendRecipientPayLinkEmail(
  delivery: Delivery,
  options: { idempotencyKey?: string; handoverCode?: string } = {},
): Promise<PayLinkEmailResult> {
  const resend = getResend()
  const to = delivery.recipientEmail?.trim()
  if (!resend) {
    console.warn(`[email] pay link for ${delivery.trackingId}: RESEND_API_KEY missing`)
    return { ok: false, reason: "Email isn’t configured" }
  }
  if (!to) {
    return { ok: false, reason: "No recipient email on this order" }
  }

  const amount = `GHS ${delivery.fareGhs}`
  const payUrl = payUrlForDelivery(delivery.trackingId)
  const { data, error } = await resend.emails.send({
    from: getResendFrom(),
    to,
    subject: `${firstName(delivery.senderName)} sent you a delivery — pay ${amount}`,
    html: buildPayRequestHtml(delivery, options.handoverCode),
    text: [
      `Hi ${firstName(delivery.recipientName)},`,
      "",
      `${delivery.senderName} booked a Diatel delivery to you. Pay ${amount} with Mobile Money or card:`,
      payUrl,
      "",
      ...(options.handoverCode
        ? [
            `Your handover code: ${options.handoverCode} — give it to the rider only once the package is in your hands.`,
            "",
          ]
        : []),
      `Tracking: ${delivery.trackingId}`,
      `Pickup: ${displayAddress(delivery.pickup)}`,
      `Drop-off: ${displayAddress(delivery.dropoff)}`,
      `Track: ${trackUrl(delivery.trackingId)}`,
      "",
      "Diatel Delivery",
    ].join("\n"),
    headers: { "X-Entity-Ref-ID": `${delivery.trackingId}-pay` },
  }, { idempotencyKey: options.idempotencyKey })

  if (error) {
    console.error(`[email] pay link failed for ${delivery.trackingId}`, error)
    return { ok: false, reason: error.message || "Email provider rejected the message" }
  }

  console.log(`[email] pay link sent for ${delivery.trackingId}`, { to, id: data?.id })
  return { ok: true, to, id: data?.id }
}
