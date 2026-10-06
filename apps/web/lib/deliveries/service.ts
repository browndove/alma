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
        "Dispatched to Tookan",
        `Tookan Job #${tookan.jobId} created for auto-assignment`,
        null,
        createdAt
      )
    )
  }

  const delivery: Delivery = {
    id: createId(),
    trackingId,
    status: "matching",
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
    progressStep: 0,
    tookanJobId: tookan?.jobId ?? null,
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
    if (current.status === "matched" || current.status === "picked_up") {
      return current
    }

    const updatedAt = nowIso()
    return {
      ...current,
      status: "matched",
      riderName: rider,
      progressStep: Math.max(current.progressStep, 1),
      updatedAt,
      events: [
        ...current.events,
        makeEvent(
          "Rider assigned",
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

    if (current.status === "matched") {
      return {
        ...current,
        status: "picked_up",
        progressStep: 2,
        updatedAt,
        events: [
          ...current.events,
          makeEvent(
            "Picked up",
            "Package collected from sender",
            current.pickup,
            updatedAt
          ),
        ],
      }
    }

    if (current.status === "picked_up") {
      return {
        ...current,
        status: "in_transit",
        progressStep: 3,
        updatedAt,
        events: [
          ...current.events,
          makeEvent(
            "In transit",
            "Rider is en route to drop-off",
            null,
            updatedAt
          ),
        ],
      }
    }

    if (current.status === "in_transit") {
      return {
        ...current,
        status: "delivered",
        progressStep: 4,
        updatedAt,
        events: [
          ...current.events,
          makeEvent(
            "Delivered",
            "Package handed to recipient",
            current.dropoff,
            updatedAt
          ),
        ],
      }
    }

    return current
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
      fareHint: "From GHS 25",
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
      fareHint: "From GHS 55",
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
      fareHint: "From GHS 25",
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
      fareHint: "From GHS 25–38",
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
    fareHint: "From GHS 25",
    reasons: [
      "General delivery request",
      "Add pickup, drop-off, and timing for a tighter match",
      "Upgrade to same-day anytime",
    ],
  }
}
