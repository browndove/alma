import type { Delivery } from "@/lib/deliveries/types"
import { parseCoordsFromAddress } from "@/lib/deliveries/tookan"

/** Joins class names; safe from formatters that trim class-string whitespace. */
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

export function place(address: string) {
  return parseCoordsFromAddress(address).label || address
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GH", {
    timeZone: "Africa/Accra",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GH", {
    timeZone: "Africa/Accra",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function isUnassignedOrder(d: Delivery) {
  if (d.riderName) return false
  return (
    d.status === "unassigned" ||
    d.status === "requested" ||
    d.status === "matching"
  )
}

export function isInTransit(d: Delivery) {
  return (
    d.status === "accepted" ||
    d.status === "matched" ||
    d.status === "pickup_started" ||
    d.status === "at_pickup" ||
    d.status === "picked_up" ||
    d.status === "delivering" ||
    d.status === "at_dropoff" ||
    d.status === "started" ||
    d.status === "arrived" ||
    d.status === "in_transit"
  )
}

export function isClosedOrder(d: Delivery) {
  return (
    d.status === "delivered" ||
    d.status === "failed" ||
    d.status === "cancelled" ||
    d.status === "declined"
  )
}

function statusTone(
  d: Delivery
): "amber" | "indigo" | "violet" | "slate" | "green" | "red" {
  if (d.pickupWindow === "schedule" && isUnassignedOrder(d)) return "violet"
  if (
    d.status === "unassigned" ||
    d.status === "requested" ||
    d.status === "matching"
  ) {
    return "amber"
  }
  if (d.status === "delivered") return "green"
  if (
    d.status === "failed" ||
    d.status === "cancelled" ||
    d.status === "declined"
  ) {
    return "red"
  }
  if (isInTransit(d)) return "indigo"
  if (d.status === "assigned" || d.riderName) return "indigo"
  return "slate"
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
}

export function orderWhenIso(d: Delivery) {
  return d.pickupWindow === "schedule" && d.scheduledAt
    ? d.scheduledAt
    : d.createdAt
}

export function StatusPill({ delivery }: { delivery: Delivery }) {
  const tone = statusTone(delivery)
  return (
    <span className={`ops-pill ops-pill-${tone}`}>
      <span className="ops-pill-dot" aria-hidden="true" />
      <span>{delivery.status.replace(/_/g, " ")}</span>
    </span>
  )
}

export function PayPill({ delivery }: { delivery: Delivery }) {
  const tone =
    delivery.paymentStatus === "paid"
      ? "green"
      : delivery.paymentStatus === "failed" ||
          delivery.paymentStatus === "expired"
        ? "red"
        : "amber"
  return (
    <span className={`ops-pill ops-pill-${tone}`}>
      <span className="ops-pill-dot" aria-hidden="true" />
      <span>{delivery.paymentStatus}</span>
    </span>
  )
}
