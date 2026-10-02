import type { PackageSize } from "./types"

export function estimateFareGhs(size: PackageSize) {
  if (size === "medium") return 38
  if (size === "large") return 55
  return 25
}

export function estimateEtaMinutes(pickupWindow: "now" | "schedule") {
  return pickupWindow === "schedule" ? 0 : 32
}

export function formatEtaLabel(
  pickupWindow: "now" | "schedule",
  scheduledAt: string | null,
  etaMinutes: number
) {
  if (pickupWindow === "schedule" && scheduledAt) {
    const date = new Date(scheduledAt)
    return date.toLocaleString("en-GH", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const low = Math.max(15, etaMinutes - 7)
  const high = etaMinutes + 8
  return `${low}–${high} min`
}
