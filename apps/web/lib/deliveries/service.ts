import {
  formatEtaLabel,
  quoteDeliveryFare,
  resolveAddressCoords,
} from "./fare"
import {
  createId,
  createTrackingId,
  getDeliveryByPaymentReference,
  getDeliveryByTrackingId,
  insertDelivery,
  listDeliveries,
  updateDelivery,
} from "./store"
import type {
  CreateDeliveryInput,
  Delivery,
  DeliveryEvent,
  DeliveryStatus,
  GuideRecommendation,
} from "./types"
import { sendDeliveryBookingEmails } from "@/lib/email/delivery-emails"
import {
  payUrlForDelivery,
  sendRecipientPayLinkEmail,
} from "@/lib/email/payment-emails"
import { getAppUrl } from "@/lib/email/resend"
import {
  buildPaymentReference,
  fareToPesewas,
  initializePaystackPayment,
  verifyPaystackPayment,
} from "@/lib/payments/paystack"
import {
  assignTookanTask,
  createTookanTask,
  listTookanAgents,
  toTookanStamp,
  type TookanAgent,
  type TookanTaskResult,
} from "./tookan"

function nowIso() {
  return new Date().toISOString()
}

function makeEvent(
  title: string,
  detail: string,
  place: string | null = null,
  at = nowIso()
): DeliveryEvent {
  return {
    id: createId(),
    title,
    detail,
    place,
    at,
  }
}

export class DeliveryBookingError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "DeliveryBookingError"
    this.status = status
  }
}

export async function createDelivery(input: CreateDeliveryInput) {
  const createdAt = nowIso()
  const quote = quoteDeliveryFare(input.pickup, input.dropoff, input.size)

  if (!quote.covered) {
    throw new DeliveryBookingError(
      "Diatel currently delivers in Ghana only. Pick pickup and drop-off points in Ghana.",
    )
  }

  if (input.pickupWindow === "schedule" && !input.scheduledAt) {
    throw new DeliveryBookingError("Pick a date and time for scheduled pickup.")
  }

  const fareGhs = quote.fareGhs
  const etaMinutes =
    input.pickupWindow === "schedule" ? 0 : quote.etaMinutes
  const etaLabel = formatEtaLabel(
    input.pickupWindow,
    input.scheduledAt ?? null,
    etaMinutes
  )

  let trackingId = createTrackingId()
  for (let i = 0; i < 8; i++) {
    const existing = await getDeliveryByTrackingId(trackingId)
    if (!existing) break
    trackingId = createTrackingId(Date.now() + i * 9973)
  }

  const pickupCoords =
    input.pickupLatitude != null && input.pickupLongitude != null
      ? { lat: input.pickupLatitude, lng: input.pickupLongitude }
      : resolveAddressCoords(input.pickup)
  const dropoffCoords =
    input.dropoffLatitude != null && input.dropoffLongitude != null
      ? { lat: input.dropoffLatitude, lng: input.dropoffLongitude }
      : resolveAddressCoords(input.dropoff)

  if (!pickupCoords || !dropoffCoords) {
    throw new DeliveryBookingError(
      "We couldn’t place that address on the map. Use Locate me or pin it on the map.",
    )
  }

  const awaitCopy =
    input.payer === "recipient"
      ? `Waiting for ${input.recipientName} to pay GHS ${fareGhs} before a rider is assigned`
      : `Waiting for sender payment of GHS ${fareGhs} before dispatch`

  const initialEvents: DeliveryEvent[] = [
    makeEvent(
      "Order placed",
      "Delivery request received by Diatel",
      input.pickup,
      createdAt,
    ),
    makeEvent("Awaiting payment", awaitCopy, null, createdAt),
  ]

  const delivery: Delivery = {
    id: createId(),
    trackingId,
    status: "requested",
    senderName: input.senderName,
    senderPhone: input.senderPhone,
    senderEmail: input.senderEmail || "",
    pickup: input.pickup,
    dropoff: input.dropoff,
    packageType: input.packageType,
    size: input.size,
    notes: input.notes || "",
    fragile: Boolean(input.fragile),
    perishable: Boolean(input.perishable),
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    recipientEmail: input.recipientEmail || "",
    payer: input.payer,
    estimatedValue: input.estimatedValue || "",
    photoName: input.photoName || null,
    pickupWindow: input.pickupWindow,
    scheduledAt: input.scheduledAt ?? null,
    fareGhs,
    etaMinutes,
    etaLabel,
    riderName: null,
    progressStep: 0,
    paymentStatus: "unpaid",
    paymentReference: null,
    paidAt: null,
    paidBy: null,
    paymentChannel: null,
    tookanJobId: null,
    tookanPickupJobId: null,
    tookanDeliveryJobId: null,
    tookanTrackingLink: null,
    events: initialEvents,
    createdAt,
    updatedAt: createdAt,
  }

  const saved = await insertDelivery(delivery)

  console.log(
    `[delivery] created ${saved.trackingId} payment=unpaid payer=${saved.payer} sender=${saved.senderEmail || "n/a"} recipient=${saved.recipientEmail || "n/a"}`,
  )

  try {
    await sendDeliveryBookingEmails(saved)
  } catch (error) {
    console.error(`[email] booking emails failed for ${saved.trackingId}`, error)
  }

  if (saved.payer === "recipient") {
    try {
      await sendRecipientPayLinkEmail(saved)
    } catch (error) {
      console.error(`[email] pay link failed for ${saved.trackingId}`, error)
    }
  }

  return saved
}

function buildTookanPayload(delivery: Delivery) {
  const pickupAt =
    delivery.pickupWindow === "schedule" && delivery.scheduledAt
      ? new Date(delivery.scheduledAt)
      : new Date(Date.now() + 3 * 60 * 1000)
  const dropBufferMinutes =
    delivery.pickupWindow === "schedule"
      ? 120
      : Math.max(45, delivery.etaMinutes + 20)
  const deliveryAt = new Date(
    pickupAt.getTime() + dropBufferMinutes * 60 * 1000,
  )

  const pickupCoords = resolveAddressCoords(delivery.pickup)
  const dropoffCoords = resolveAddressCoords(delivery.dropoff)
  if (!pickupCoords || !dropoffCoords) {
    throw new DeliveryBookingError(
      "We couldn’t place that address on the map for dispatch.",
      400,
    )
  }

  return {
    trackingId: delivery.trackingId,
    senderName: delivery.senderName,
    senderPhone: delivery.senderPhone,
    senderEmail: delivery.senderEmail || undefined,
    pickupAddress: delivery.pickup,
    pickupLatitude: pickupCoords.lat,
    pickupLongitude: pickupCoords.lng,
    recipientName: delivery.recipientName,
    recipientPhone: delivery.recipientPhone,
    recipientEmail: delivery.recipientEmail || undefined,
    deliveryAddress: delivery.dropoff,
    deliveryLatitude: dropoffCoords.lat,
    deliveryLongitude: dropoffCoords.lng,
    jobDescription: [
      `Tracking: ${delivery.trackingId}`,
      `${delivery.packageType} (${delivery.size})`,
      delivery.notes ? `Notes: ${delivery.notes}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    jobPickupDatetime: toTookanStamp(pickupAt),
    jobDeliveryDatetime: toTookanStamp(deliveryAt),
  }
}

/** Create Tookan jobs only after Paystack marks the fare paid. */
export async function dispatchDeliveryAfterPayment(trackingId: string) {
  const current = await getDeliveryByTrackingId(trackingId)
  if (!current) {
    throw new DeliveryBookingError("Delivery not found", 404)
  }
  if (current.paymentStatus !== "paid") {
    throw new DeliveryBookingError("Delivery is not paid yet", 400)
  }
  if (current.tookanJobId || current.tookanPickupJobId) {
    return current
  }

  const payload = buildTookanPayload(current)
  let tookan: TookanTaskResult | null = await createTookanTask(payload)
  if (!tookan?.jobId) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    tookan = await createTookanTask(payload)
  }

  const updatedAt = nowIso()
  const updated = await updateDelivery(trackingId, (row) => {
    const events = [...row.events]
    if (tookan?.jobId) {
      events.push(
        makeEvent(
          "Unassigned",
          `Tookan pickup #${tookan.pickupJobId ?? tookan.jobId}` +
            (tookan.deliveryJobId
              ? ` · delivery #${tookan.deliveryJobId}`
              : "") +
            " — waiting for rider assignment",
          null,
          updatedAt,
        ),
      )
    } else {
      events.push(
        makeEvent(
          "Dispatch pending",
          "Payment received, but Tookan did not accept the task yet. Support will retry.",
          null,
          updatedAt,
        ),
      )
    }

    return {
      ...row,
      status: tookan?.jobId ? "unassigned" : "requested",
      progressStep: tookan?.jobId ? 1 : 0,
      tookanJobId: tookan?.jobId ?? null,
      tookanPickupJobId: tookan?.pickupJobId ?? null,
      tookanDeliveryJobId: tookan?.deliveryJobId ?? null,
      tookanTrackingLink: tookan?.trackingLink ?? null,
      updatedAt,
      events,
    }
  })

  if (!updated) {
    throw new DeliveryBookingError("Delivery not found after dispatch", 404)
  }
  return updated
}

export async function initializeDeliveryPayment(trackingId: string) {
  const delivery = await getDeliveryByTrackingId(trackingId)
  if (!delivery) {
    throw new DeliveryBookingError("Delivery not found", 404)
  }
  if (delivery.paymentStatus === "paid") {
    throw new DeliveryBookingError("This delivery is already paid", 400)
  }

  const email =
    delivery.payer === "recipient"
      ? delivery.recipientEmail || delivery.senderEmail
      : delivery.senderEmail || delivery.recipientEmail
  if (!email) {
    throw new DeliveryBookingError(
      "Add an email for the payer so Paystack can open checkout.",
      400,
    )
  }

  const reference = buildPaymentReference(delivery.trackingId)
  const callbackUrl = `${getAppUrl()}/pay/return?reference=${encodeURIComponent(reference)}`
  const initialized = await initializePaystackPayment({
    email,
    amountPesewas: fareToPesewas(delivery.fareGhs),
    reference,
    callbackUrl,
    metadata: {
      trackingId: delivery.trackingId,
      payer: delivery.payer,
      custom_fields: [
        {
          display_name: "Tracking ID",
          variable_name: "tracking_id",
          value: delivery.trackingId,
        },
      ],
    },
  })

  const updatedAt = nowIso()
  const updated = await updateDelivery(trackingId, (row) => ({
    ...row,
    paymentStatus: "pending",
    paymentReference: initialized.data.reference,
    updatedAt,
    events: [
      ...row.events,
      makeEvent(
        "Payment started",
        `Paystack checkout opened · ${initialized.data.reference}`,
        null,
        updatedAt,
      ),
    ],
  }))

  if (!updated) {
    throw new DeliveryBookingError("Delivery not found after payment init", 404)
  }

  return {
    delivery: updated,
    authorizationUrl: initialized.data.authorization_url,
    accessCode: initialized.data.access_code,
    reference: initialized.data.reference,
  }
}

export async function markDeliveryPaid(input: {
  trackingId?: string
  reference: string
  channel?: string | null
  paidAt?: string | null
}) {
  let delivery =
    (input.trackingId
      ? await getDeliveryByTrackingId(input.trackingId)
      : null) || (await getDeliveryByPaymentReference(input.reference))

  if (!delivery) {
    throw new DeliveryBookingError("Delivery not found for payment", 404)
  }

  if (delivery.paymentStatus === "paid") {
    return delivery
  }

  const updatedAt = nowIso()
  const paidAt = input.paidAt || updatedAt
  const marked = await updateDelivery(delivery.trackingId, (row) => ({
    ...row,
    paymentStatus: "paid",
    paymentReference: input.reference || row.paymentReference,
    paidAt,
    paidBy: row.payer,
    paymentChannel: input.channel || row.paymentChannel,
    updatedAt,
    events: [
      ...row.events,
      makeEvent(
        "Payment received",
        `GHS ${row.fareGhs} paid${input.channel ? ` via ${input.channel}` : ""}`,
        null,
        updatedAt,
      ),
    ],
  }))

  if (!marked) {
    throw new DeliveryBookingError("Delivery not found after payment", 404)
  }

  return dispatchDeliveryAfterPayment(marked.trackingId)
}

export async function confirmPaystackReference(reference: string) {
  const verified = await verifyPaystackPayment(reference)
  if (verified.data.status !== "success") {
    const failed = await getDeliveryByPaymentReference(reference)
    if (failed && failed.paymentStatus !== "paid") {
      await updateDelivery(failed.trackingId, (row) => ({
        ...row,
        paymentStatus: "failed",
        updatedAt: nowIso(),
      }))
    }
    throw new DeliveryBookingError(
      verified.message || "Payment was not successful",
      400,
    )
  }

  const trackingId =
    typeof verified.data.metadata?.trackingId === "string"
      ? verified.data.metadata.trackingId
      : undefined

  return markDeliveryPaid({
    trackingId,
    reference: verified.data.reference,
    channel: verified.data.channel,
    paidAt: verified.data.paid_at,
  })
}

export { payUrlForDelivery }

export async function getDelivery(trackingId: string) {
  return getDeliveryByTrackingId(trackingId)
}

export async function getRecentDeliveries(limit = 20) {
  const all = await listDeliveries()
  return all.slice(0, limit)
}

export async function listOpsAgents(): Promise<TookanAgent[]> {
  return listTookanAgents()
}

export async function assignRiderToDelivery(
  trackingId: string,
  fleetId: number,
) {
  const delivery = await getDeliveryByTrackingId(trackingId)
  if (!delivery) {
    throw new DeliveryBookingError("Delivery not found", 404)
  }
  if (!delivery.tookanJobId && !delivery.tookanPickupJobId) {
    throw new DeliveryBookingError(
      "This order has no Tookan task yet — can’t assign a rider.",
      400,
    )
  }

  const agents = await listTookanAgents()
  const agent = agents.find((item) => item.fleetId === fleetId)
  if (!agent) {
    throw new DeliveryBookingError("Rider not found in Tookan", 404)
  }

  const jobIds = [
    ...new Set(
      [delivery.tookanPickupJobId, delivery.tookanDeliveryJobId, delivery.tookanJobId]
        .filter((id) => id != null && id !== "")
        .map(String),
    ),
  ]

  const results = []
  for (const jobId of jobIds) {
    const result = await assignTookanTask(jobId, fleetId)
    results.push({ jobId, ...result })
    if (!result.ok) {
      throw new DeliveryBookingError(
        `Tookan assign failed for job ${jobId}: ${result.message}`,
        502,
      )
    }
  }

  const updatedAt = nowIso()
  const updated = await updateDelivery(trackingId, (current) => ({
    ...current,
    status: "assigned",
    riderName: agent.name,
    progressStep: Math.max(current.progressStep, 2),
    updatedAt,
    events: [
      ...current.events,
      makeEvent(
        "Assigned",
        `${agent.name} assigned via ops desk`,
        null,
        updatedAt,
      ),
    ],
  }))

  if (!updated) {
    throw new DeliveryBookingError("Delivery not found after assign", 404)
  }

  return { delivery: updated, agent, results }
}

export async function matchRider(trackingId: string) {
  const riders = ["Kwame A.", "Ama M.", "Kojo B.", "Efua T.", "Yaw O."]
  const rider = riders[Math.floor(Math.random() * riders.length)]!

  return updateDelivery(trackingId, (current) => {
    // Tookan webhooks own the lifecycle when a job exists
    if (current.tookanJobId) {
      return current
    }

    if (
      current.status === "accepted" ||
      current.status === "matched" ||
      current.status === "started" ||
      current.status === "picked_up" ||
      current.status === "arrived" ||
      current.status === "in_transit" ||
      current.status === "delivered"
    ) {
      return current
    }

    const updatedAt = nowIso()
    return {
      ...current,
      status: "accepted",
      riderName: rider,
      progressStep: Math.max(current.progressStep, 3),
      updatedAt,
      events: [
        ...current.events,
        makeEvent(
          "Accepted",
          `${rider} accepted the trip`,
          null,
          updatedAt
        ),
      ],
    }
  })
}

export async function advanceDelivery(trackingId: string) {
  return updateDelivery(trackingId, (current) => {
    // Tookan webhooks own the lifecycle when a job exists
    if (current.tookanJobId) {
      return current
    }

    const updatedAt = nowIso()

    const sequence: Array<{
      from: DeliveryStatus[]
      status: DeliveryStatus
      step: number
      title: string
      detail: string
      place: string | null
    }> = [
      {
        from: ["accepted", "matched", "assigned"],
        status: "pickup_started",
        step: 4,
        title: "To pickup",
        detail: "Rider is on the way to collect the package",
        place: current.pickup,
      },
      {
        from: ["pickup_started", "started"],
        status: "at_pickup",
        step: 5,
        title: "At pickup",
        detail: "Rider arrived at the pickup location",
        place: current.pickup,
      },
      {
        from: ["at_pickup"],
        status: "picked_up",
        step: 6,
        title: "Picked up",
        detail: "Package collected from sender",
        place: current.pickup,
      },
      {
        from: ["picked_up"],
        status: "delivering",
        step: 7,
        title: "Delivering",
        detail: "Rider is on the way to the drop-off",
        place: null,
      },
      {
        from: ["delivering", "in_transit"],
        status: "at_dropoff",
        step: 8,
        title: "At drop-off",
        detail: "Rider arrived at the drop-off location",
        place: current.dropoff,
      },
      {
        from: ["at_dropoff", "arrived"],
        status: "delivered",
        step: 9,
        title: "Delivered",
        detail: "Package handed to recipient",
        place: current.dropoff,
      },
    ]

    const next = sequence.find((item) => item.from.includes(current.status))
    if (!next) return current

    return {
      ...current,
      status: next.status,
      progressStep: next.step,
      updatedAt,
      events: [
        ...current.events,
        makeEvent(next.title, next.detail, next.place, updatedAt),
      ],
    }
  })
}

export function recommendFromPrompt(prompt: string): GuideRecommendation {
  const text = prompt.toLowerCase()
  const sameDay =
    text.includes("same-day") ||
    text.includes("now") ||
    text.includes("asap") ||
    text.includes("urgent")
  const food = text.includes("food") || text.includes("lunch")
  const docs = text.includes("document") || text.includes("passport")
  const bulky = text.includes("large") || text.includes("bulky") || text.includes("fridge")

  if (food) {
    return {
      service: "Express food delivery",
      summary:
        "Priority same-day riders for hot meals and perishable orders across Accra.",
      eta: "20–35 min",
      fareHint: "From GHS 20",
      reasons: [
        "Food/perishable keywords detected",
        "Live tracking for the recipient",
        "Fragile/perishable handling available",
      ],
    }
  }

  if (bulky) {
    return {
      service: "Large package route",
      summary:
        "Scheduled pickup with riders sized for bulky boxes and multi-stop drops.",
      eta: "Same day / scheduled",
      fareHint: "From GHS 20",
      reasons: [
        "Bulky package cues detected",
        "Best with scheduled pickup window",
        "Photo upload recommended for the rider",
      ],
    }
  }

  if (docs) {
    return {
      service: "Documents same-day",
      summary:
        "Fast envelope delivery with live tracking and confirmation at drop-off.",
      eta: "25–40 min",
      fareHint: "From GHS 20",
      reasons: [
        "Document delivery detected",
        "Small package pricing",
        "OTP-style handoff available on request",
      ],
    }
  }

  if (sameDay) {
    return {
      service: "Same-day delivery",
      summary:
        "Match a verified rider in minutes for pickup and drop-off across Accra.",
      eta: "25–40 min",
      fareHint: "From GHS 20",
      reasons: [
        "Same-day timing detected",
        "Works for shops, clinics, and personal sends",
        "Trackable from request to door",
      ],
    }
  }

  return {
    service: "Standard city delivery",
    summary:
      "Reliable Accra pickup and drop-off with live tracking and clear fare upfront.",
    eta: "45–90 min",
    fareHint: "From GHS 20",
    reasons: [
      "General delivery request",
      "Add pickup, drop-off, and timing for a tighter match",
      "Upgrade to same-day anytime",
    ],
  }
}
