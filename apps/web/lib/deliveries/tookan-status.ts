import type { DeliveryStatus } from "./types"

/**
 * Customer-facing rail for Tookan pickup + delivery tasks.
 *
 * Tookan creates two linked jobs (job_type 0 = pickup, 1 = delivery).
 * Each runs: Started (1) → Arrived/InProgress (4) → Successful (2).
 * Shared assignment codes: Unassigned 6 · Assigned 0 · Accepted 7.
 */
export const TOOKAN_TRACK_STEPS = [
  { id: "requested", label: "Requested" },
  { id: "unassigned", label: "Unassigned" },
  { id: "assigned", label: "Assigned" },
  { id: "accepted", label: "Accepted" },
  { id: "to_pickup", label: "To pickup" },
  { id: "at_pickup", label: "At pickup" },
  { id: "picked_up", label: "Picked up" },
  { id: "delivering", label: "Delivering" },
  { id: "at_dropoff", label: "At drop-off" },
  { id: "delivered", label: "Delivered" },
] as const

export const TOOKAN_TRACK_STEP_COUNT = TOOKAN_TRACK_STEPS.length

export type TookanStatusMapping = {
  status: DeliveryStatus
  /** Index into TOOKAN_TRACK_STEPS; null for terminal failures */
  step: number | null
  title: string
  detail: string
  terminal?: boolean
}

type Leg = "pickup" | "delivery"

function resolveLeg(input: {
  jobType?: number | null
  jobId?: string | number | null
  pickupJobId?: string | number | null
  deliveryJobId?: string | number | null
  currentStep?: number
}): Leg {
  if (input.jobType === 0) return "pickup"
  if (input.jobType === 1) return "delivery"

  const jobId = input.jobId != null ? String(input.jobId) : null
  if (jobId && input.pickupJobId != null && jobId === String(input.pickupJobId)) {
    return "pickup"
  }
  if (
    jobId &&
    input.deliveryJobId != null &&
    jobId === String(input.deliveryJobId)
  ) {
    return "delivery"
  }

  // Before pickup completes, treat ambiguous updates as the pickup leg
  return (input.currentStep ?? 0) < 6 ? "pickup" : "delivery"
}

/** Map a Tookan webhook onto Diatel track status + step. */
export function mapTookanWebhook(input: {
  jobStatus: number
  jobType?: number | null
  jobId?: string | number | null
  pickupJobId?: string | number | null
  deliveryJobId?: string | number | null
  currentStep?: number
}): TookanStatusMapping | null {
  const { jobStatus } = input

  if (jobStatus === 3) {
    return {
      status: "failed",
      step: null,
      title: "Failed",
      detail: "Tookan reported the job as failed",
      terminal: true,
    }
  }
  if (jobStatus === 8) {
    return {
      status: "declined",
      step: null,
      title: "Declined",
      detail: "Rider declined the job",
      terminal: true,
    }
  }
  if (jobStatus === 9) {
    return {
      status: "cancelled",
      step: null,
      title: "Cancelled",
      detail: "Job was cancelled on Tookan",
      terminal: true,
    }
  }
  if (jobStatus === 10) {
    return {
      status: "cancelled",
      step: null,
      title: "Deleted",
      detail: "Job was deleted on Tookan",
      terminal: true,
    }
  }

  if (jobStatus === 6) {
    return {
      status: "unassigned",
      step: 1,
      title: "Unassigned",
      detail: "Job is waiting for a rider on Tookan",
    }
  }
  if (jobStatus === 0) {
    return {
      status: "assigned",
      step: 2,
      title: "Assigned",
      detail: "Rider assigned on Tookan",
    }
  }
  if (jobStatus === 7) {
    return {
      status: "accepted",
      step: 3,
      title: "Accepted",
      detail: "Rider accepted the job",
    }
  }

  const leg = resolveLeg(input)

  if (leg === "pickup") {
    if (jobStatus === 1) {
      return {
        status: "pickup_started",
        step: 4,
        title: "To pickup",
        detail: "Rider is on the way to collect the package",
      }
    }
    if (jobStatus === 4) {
      return {
        status: "at_pickup",
        step: 5,
        title: "At pickup",
        detail: "Rider arrived at the pickup location",
      }
    }
    if (jobStatus === 2) {
      return {
        status: "picked_up",
        step: 6,
        title: "Picked up",
        detail: "Package collected from sender",
      }
    }
  }

  if (jobStatus === 1) {
    return {
      status: "delivering",
      step: 7,
      title: "Delivering",
      detail: "Rider is on the way to the drop-off",
    }
  }
  if (jobStatus === 4) {
    return {
      status: "at_dropoff",
      step: 8,
      title: "At drop-off",
      detail: "Rider arrived at the drop-off location",
    }
  }
  if (jobStatus === 2) {
    return {
      status: "delivered",
      step: 9,
      title: "Delivered",
      detail: "Package handed to recipient",
    }
  }

  return null
}

/** @deprecated Prefer mapTookanWebhook with job_type */
export function mapTookanJobStatus(
  jobStatus: number
): TookanStatusMapping | null {
  return mapTookanWebhook({ jobStatus })
}

/** Resolve rail index for Track, including legacy Diatel statuses. */
export function resolveTrackStep(delivery: {
  status: DeliveryStatus
  progressStep: number
}): number {
  switch (delivery.status) {
    case "requested":
      return 0
    case "unassigned":
    case "matching":
      return Math.max(delivery.progressStep, 1)
    case "assigned":
      return Math.max(delivery.progressStep, 2)
    case "accepted":
    case "matched":
      return Math.max(delivery.progressStep, 3)
    case "pickup_started":
    case "started":
      return Math.max(delivery.progressStep, 4)
    case "at_pickup":
      return Math.max(delivery.progressStep, 5)
    case "picked_up":
      return Math.max(delivery.progressStep, 6)
    case "delivering":
    case "in_transit":
      return Math.max(delivery.progressStep, 7)
    case "at_dropoff":
    case "arrived":
      return Math.max(delivery.progressStep, 8)
    case "delivered":
      return TOOKAN_TRACK_STEP_COUNT - 1
    case "failed":
    case "declined":
    case "cancelled":
      return Math.min(
        Math.max(delivery.progressStep, 0),
        TOOKAN_TRACK_STEP_COUNT - 2
      )
    default:
      return Math.min(
        Math.max(delivery.progressStep, 0),
        TOOKAN_TRACK_STEP_COUNT - 1
      )
  }
}

export function isTerminalDeliveryStatus(status: DeliveryStatus) {
  return (
    status === "failed" ||
    status === "declined" ||
    status === "cancelled" ||
    status === "delivered"
  )
}
