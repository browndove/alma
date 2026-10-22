import {
  formatEtaLabel,
  quoteDeliveryFare,
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

import { createTookanTask } from "./tookan"

export async function createDelivery(input: CreateDeliveryInput) {
  const createdAt = nowIso()
  const quote = quoteDeliveryFare(input.pickup, input.dropoff, input.size)
  const fareGhs = quote.fareGhs
  const etaMinutes =
    input.pickupWindow === "schedule" ? 0 : quote.etaMinutes
  const etaLabel = formatEtaLabel(
    input.pickupWindow,
    input.scheduledAt ?? null,
    etaMinutes
  )

  let trackingId = createTrackingId(Date.now() + input.senderPhone.length * 17)
  // Avoid rare collisions
  for (let i = 0; i < 5; i++) {
    const existing = await getDeliveryByTrackingId(trackingId)
    if (!existing) break
    trackingId = createTrackingId(Date.now() + i * 97)
  }

  // Dispatch task to Tookan fleet API if configured
  const tookan = await createTookanTask({
    trackingId,
    senderName: input.senderName,
    senderPhone: input.senderPhone,
    senderEmail: input.senderEmail || undefined,
    pickupAddress: input.pickup,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    deliveryAddress: input.dropoff,
    jobDescription: `${input.packageType} (${input.size}) - Notes: ${input.notes || "None"}`,
  })

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
        `Tookan Job #${tookan.jobId} created — waiting for rider assignment`,
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

  return insertDelivery(delivery)
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
