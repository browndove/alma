import {
  formatEtaLabel,
  quoteDeliveryFare,
  resolveAddressCoords,
} from "./fare"
import {
  createId,
  createTrackingId,
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

import { sendDeliveryBookingEmails } from "@/lib/email/delivery-emails"
import { createTookanTask, type TookanTaskResult } from "./tookan"

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
      "Diatel currently delivers in Accra only. Pick Accra pickup and drop-off points.",
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

  const pickupAt =
    input.pickupWindow === "schedule" && input.scheduledAt
      ? new Date(input.scheduledAt)
      : new Date()
  const dropBufferMinutes =
    input.pickupWindow === "schedule"
      ? 120
      : Math.max(45, etaMinutes + 20)
  const deliveryAt = new Date(
    pickupAt.getTime() + dropBufferMinutes * 60 * 1000,
  )
  const toTookanDate = (date: Date) =>
    date.toISOString().slice(0, 19).replace("T", " ")

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

  const tookanPayload = {
    trackingId,
    senderName: input.senderName,
    senderPhone: input.senderPhone,
    senderEmail: input.senderEmail || undefined,
    pickupAddress: input.pickup,
    pickupLatitude: pickupCoords.lat,
    pickupLongitude: pickupCoords.lng,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    recipientEmail: input.recipientEmail || undefined,
    deliveryAddress: input.dropoff,
    deliveryLatitude: dropoffCoords.lat,
    deliveryLongitude: dropoffCoords.lng,
    jobDescription: [
      `Tracking: ${trackingId}`,
      `${input.packageType} (${input.size})`,
      input.notes ? `Notes: ${input.notes}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    jobPickupDatetime: toTookanDate(pickupAt),
    jobDeliveryDatetime: toTookanDate(deliveryAt),
  }

  // One retry — transient Tookan blips shouldn’t orphan a paid booking path.
  let tookan: TookanTaskResult | null = await createTookanTask(tookanPayload)
  if (!tookan?.jobId) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    tookan = await createTookanTask(tookanPayload)
  }

  const initialEvents: DeliveryEvent[] = [
    makeEvent(
      "Order placed",
      "Delivery request received by Diatel",
      input.pickup,
      createdAt
    ),
    makeEvent(
      "Preparing pickup",
      "Package details confirmed for dispatch",
      null,
      createdAt
    ),
  ]

  if (tookan?.jobId) {
    initialEvents.push(
      makeEvent(
        "Unassigned",
        `Tookan pickup #${tookan.pickupJobId ?? tookan.jobId}` +
          (tookan.deliveryJobId
            ? ` · delivery #${tookan.deliveryJobId}`
            : "") +
          " — waiting for rider assignment",
        null,
        createdAt
      )
    )
  } else {
    initialEvents.push(
      makeEvent(
        "Dispatch pending",
        "Order saved, but Tookan did not accept the task yet. Support will retry.",
        null,
        createdAt
      )
    )
  }

  const delivery: Delivery = {
    id: createId(),
    trackingId,
    status: tookan?.jobId ? "unassigned" : "requested",
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
    progressStep: tookan?.jobId ? 1 : 0,
    tookanJobId: tookan?.jobId ?? null,
    tookanPickupJobId: tookan?.pickupJobId ?? null,
    tookanDeliveryJobId: tookan?.deliveryJobId ?? null,
    tookanTrackingLink: tookan?.trackingLink ?? null,
    events: initialEvents,
    createdAt,
    updatedAt: createdAt,
  }

  const saved = await insertDelivery(delivery)

  console.log(
    `[delivery] created ${saved.trackingId} tookan=${saved.tookanJobId ?? "none"} sender=${saved.senderEmail || "n/a"} recipient=${saved.recipientEmail || "n/a"}`,
  )

  // Await so logs show the real send result for this tracking ID.
  try {
    await sendDeliveryBookingEmails(saved)
  } catch (error) {
    console.error(`[email] booking emails failed for ${saved.trackingId}`, error)
  }

  return saved
}

export async function getDelivery(trackingId: string) {
  return getDeliveryByTrackingId(trackingId)
}

export async function getRecentDeliveries(limit = 20) {
  const all = await listDeliveries()
  return all.slice(0, limit)
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
