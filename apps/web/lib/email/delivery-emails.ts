import type { Delivery } from "@/lib/deliveries/types"

import {
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
import { payUrlForDelivery } from "./payment-emails"
import { getResend, getResendFrom } from "./resend"

export const ORDERS_NOTIFY_EMAIL =
  process.env.ORDERS_NOTIFY_EMAIL?.trim() ||
  process.env.CONTACT_TO_EMAIL?.trim() ||
  "hrdiateldelivery@gmail.com"

function pickupLabel(delivery: Delivery) {
  return delivery.etaLabel
}

function pickupKind(delivery: Delivery) {
  return delivery.pickupWindow === "schedule" && delivery.scheduledAt
    ? "Scheduled for"
    : "ETA"
}

function liveTrackUrl(delivery: Delivery) {
  return delivery.tookanTrackingLink?.trim() || null
}

function sizeLabel(delivery: Delivery) {
  return delivery.size.charAt(0).toUpperCase() + delivery.size.slice(1)
}

/** Booking confirmation for the sender. */
export function buildSenderHtml(delivery: Delivery) {
  const recipient = firstName(delivery.recipientName)
  const paid = delivery.paymentStatus === "paid"
  const recipientPays = delivery.payer === "recipient"
  const intro = paid
    ? `Payment received — thank you. We’re dispatching a rider to your pickup now.`
    : recipientPays
      ? `We’ve emailed ${escapeHtml(recipient)} a secure link to pay <strong>GHS ${delivery.fareGhs}</strong>. A rider is being dispatched now — it doesn’t wait for payment.`
      : `A rider is being dispatched now. You can pay <strong>GHS ${delivery.fareGhs}</strong> with Mobile Money or card anytime — before or after the ride.`
  const url = trackUrl(delivery.trackingId)
  const live = liveTrackUrl(delivery)
  const payNow = !paid && !recipientPays

  return renderEmail({
    title: "Your delivery is booked",
    preheader: `${delivery.trackingId} · ${pickupKind(delivery)} ${pickupLabel(delivery)}`,
    blocks: [
      heroBlock({
        kicker: paid ? "Paid · Booking confirmed" : "Booking confirmed",
        tone: "green",
        heading: `Your delivery to ${recipient} is booked`,
        intro,
      }),
      trackingBlock({
        code: delivery.trackingId,
        metaLabel: pickupKind(delivery),
        metaValue: pickupLabel(delivery),
      }),
      routeBlock({
        pickup: displayAddress(delivery.pickup),
        dropoff: displayAddress(delivery.dropoff),
        dropoffNote: `${delivery.recipientName} · ${delivery.recipientPhone}`,
      }),
      factsBlock([
        { label: "Package", value: delivery.packageType, sub: sizeLabel(delivery) },
        { label: "Fare", value: `GHS ${delivery.fareGhs}`, sub: paid ? "Paid" : "Unpaid" },
        { label: "Paid by", value: recipientPays ? delivery.recipientName : "You" },
      ]),
      payNow
        ? buttonBlock({
            href: payUrlForDelivery(delivery.trackingId),
            label: `Pay GHS ${delivery.fareGhs}`,
            secondary: { href: url, label: "Track your delivery" },
          })
        : buttonBlock({
            href: url,
            label: "Track your delivery",
            secondary: live ? { href: live, label: "Open live rider map" } : undefined,
          }),
      linkFallbackBlock(url, "Tracking link:"),
    ],
    footerNote: "You’re receiving this because you booked a delivery with Diatel.",
  })
}

/** Heads-up for a recipient when the sender pays (recipient-paid orders get the pay request instead). */
export function buildRecipientHtml(delivery: Delivery, handoverCode?: string) {
  const sender = escapeHtml(delivery.senderName)
  const url = trackUrl(delivery.trackingId)
  const live = liveTrackUrl(delivery)
  return renderEmail({
    title: "A delivery is on its way to you",
    preheader: `${delivery.senderName} sent you a package · ${delivery.trackingId}`,
    blocks: [
      heroBlock({
        kicker: "On its way",
        tone: "navy",
        heading: `Hi ${firstName(delivery.recipientName)}, a delivery is coming your way`,
        intro: `${sender} booked a Diatel delivery to you. It’s already paid for — just track it and be ready at the drop-off.`,
      }),
      ...(handoverCode ? [handoverCodeBlock(handoverCode)] : []),
      trackingBlock({
        code: delivery.trackingId,
        metaLabel: pickupKind(delivery),
        metaValue: pickupLabel(delivery),
      }),
      routeBlock({
        pickup: displayAddress(delivery.pickup),
        pickupNote: `From ${delivery.senderName}`,
        dropoff: displayAddress(delivery.dropoff),
      }),
      factsBlock([
        { label: "Package", value: delivery.packageType, sub: sizeLabel(delivery) },
        { label: "Sender", value: delivery.senderName },
      ]),
      buttonBlock({
        href: url,
        label: "Track your delivery",
        secondary: live ? { href: live, label: "Open live rider map" } : undefined,
      }),
      linkFallbackBlock(url, "Tracking link:"),
    ],
    footerNote: `You’re receiving this because ${delivery.senderName} sent you a delivery.`,
  })
}

function buildText(params: {
  greeting: string
  intro: string
  delivery: Delivery
}) {
  const url = trackUrl(params.delivery.trackingId)
  const live = liveTrackUrl(params.delivery)
  return [
    params.greeting,
    "",
    params.intro,
    "",
    `Tracking code: ${params.delivery.trackingId}`,
    `${pickupKind(params.delivery)}: ${pickupLabel(params.delivery)}`,
    `Pickup: ${displayAddress(params.delivery.pickup)}`,
    `Drop-off: ${displayAddress(params.delivery.dropoff)}`,
    `Recipient: ${params.delivery.recipientName}`,
    `Package: ${params.delivery.packageType} · ${params.delivery.size}`,
    `Fare: GHS ${params.delivery.fareGhs}`,
    `Track: ${url}`,
    live ? `Live rider map: ${live}` : null,
    "",
    "Diatel Delivery",
  ]
    .filter((line) => line !== null)
    .join("\n")
}

async function sendOne(params: {
  to: string
  subject: string
  html: string
  text: string
  trackingId: string
  /** Same key → Resend delivers once, even if the booking is retried. */
  idempotencyKey: string
}) {
  const resend = getResend()
  const from = getResendFrom()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipped", params.to)
    return { ok: false as const, reason: "missing_key" }
  }

  console.log(
    `[email] sending ${params.trackingId} → ${params.to} from ${from}`,
  )

  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    headers: {
      "X-Entity-Ref-ID": params.trackingId,
    },
  }, { idempotencyKey: params.idempotencyKey })

  if (error) {
    console.error("[email] Resend failed", {
      to: params.to,
      trackingId: params.trackingId,
      from,
      error,
    })
    return { ok: false as const, reason: error.message }
  }

  console.log("[email] sent", {
    to: params.to,
    trackingId: params.trackingId,
    id: data?.id,
  })
  return { ok: true as const, id: data?.id }
}

export function buildAdminOrderHtml(delivery: Delivery) {
  const url = trackUrl(delivery.trackingId)
  const live = liveTrackUrl(delivery)
  const tookan = delivery.tookanJobId
    ? `Pickup #${delivery.tookanPickupJobId ?? "—"} · Delivery #${delivery.tookanDeliveryJobId ?? delivery.tookanJobId}`
    : "Not created yet"

  return renderEmail({
    title: `New order ${delivery.trackingId}`,
    preheader: `${displayAddress(delivery.pickup)} → ${displayAddress(delivery.dropoff)} · GHS ${delivery.fareGhs}`,
    blocks: [
      heroBlock({
        kicker: "New web order",
        tone: "navy",
        heading: `${delivery.trackingId} needs a rider`,
        intro: `${escapeHtml(delivery.senderName)} → ${escapeHtml(delivery.recipientName)} · ${escapeHtml(pickupKind(delivery))} ${escapeHtml(pickupLabel(delivery))}`,
      }),
      routeBlock({
        pickup: displayAddress(delivery.pickup),
        pickupNote: `${delivery.senderName} · ${delivery.senderPhone}`,
        dropoff: displayAddress(delivery.dropoff),
        dropoffNote: `${delivery.recipientName} · ${delivery.recipientPhone}`,
      }),
      factsBlock([
        { label: "Package", value: delivery.packageType, sub: sizeLabel(delivery) },
        {
          label: "Fare",
          value: `GHS ${delivery.fareGhs}`,
          sub: delivery.payer === "recipient" ? "Recipient pays" : "Sender pays",
        },
        { label: "Tookan", value: tookan },
      ]),
      buttonBlock({
        href: url,
        label: `Open ${delivery.trackingId}`,
        secondary: live ? { href: live, label: "Open Tookan map" } : undefined,
      }),
    ],
    footerNote: "Ops notification for a new website order.",
  })
}

async function sendAdminOrderNotification(delivery: Delivery) {
  const pickup = displayAddress(delivery.pickup)
  const dropoff = displayAddress(delivery.dropoff)
  const live = liveTrackUrl(delivery)
  const text = [
    `New Diatel order ${delivery.trackingId}`,
    "",
    `Pickup: ${pickup}`,
    `Sender: ${delivery.senderName} · ${delivery.senderPhone}`,
    `Drop-off: ${dropoff}`,
    `Recipient: ${delivery.recipientName} · ${delivery.recipientPhone}`,
    `Package: ${delivery.packageType} · ${delivery.size}`,
    `Fare: GHS ${delivery.fareGhs}`,
    `${pickupKind(delivery)}: ${pickupLabel(delivery)}`,
    `Tookan: ${delivery.tookanJobId ?? "not created"}`,
    live ? `Live rider map: ${live}` : null,
    `Track: ${trackUrl(delivery.trackingId)}`,
  ]
    .filter((line) => line !== null)
    .join("\n")

  return sendOne({
    to: ORDERS_NOTIFY_EMAIL,
    trackingId: delivery.trackingId,
    idempotencyKey: `booking/${delivery.trackingId}/admin`,
    subject: `[New order] ${delivery.trackingId} · ${pickup} → ${dropoff}`,
    text,
    html: buildAdminOrderHtml(delivery),
  })
}

export async function sendDeliveryBookingEmails(
  delivery: Delivery,
  options: { handoverCode?: string } = {},
) {
  if (!delivery.trackingId) {
    console.error("[email] missing trackingId — refusing to send", delivery.id)
    return
  }

  const jobs: Promise<unknown>[] = [
    sendAdminOrderNotification(delivery),
  ]

  if (delivery.senderEmail) {
    const greeting = `Hi ${firstName(delivery.senderName)},`
    const intro = `Your package to ${delivery.recipientName} is booked.`
    jobs.push(
      sendOne({
        to: delivery.senderEmail,
        trackingId: delivery.trackingId,
        idempotencyKey: `booking/${delivery.trackingId}/sender`,
        subject: `Booked: your delivery to ${firstName(delivery.recipientName)} · ${delivery.trackingId}`,
        text: buildText({ greeting, intro, delivery }),
        html: buildSenderHtml(delivery),
      }),
    )
  }

  // Recipient-paid orders: the recipient's only email is the pay request
  // (sent separately by sendRecipientPayLinkEmail), so they don't get two.
  if (delivery.recipientEmail && delivery.payer !== "recipient") {
    const greeting = `Hi ${firstName(delivery.recipientName)},`
    const intro = `${delivery.senderName} booked a Diatel delivery for you.`
    jobs.push(
      sendOne({
        to: delivery.recipientEmail,
        trackingId: delivery.trackingId,
        idempotencyKey: `booking/${delivery.trackingId}/recipient`,
        subject: `${delivery.senderName} sent you a delivery · ${delivery.trackingId}`,
        text: [
          buildText({ greeting, intro, delivery }),
          options.handoverCode
            ? `\nYour handover code: ${options.handoverCode}\nGive it to the rider only once the package is in your hands.`
            : "",
        ].join(""),
        html: buildRecipientHtml(delivery, options.handoverCode),
      }),
    )
  }

  await Promise.allSettled(jobs)
}
