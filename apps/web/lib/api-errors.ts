import type { ZodError } from "zod"

const FIELD_LABELS: Record<string, string> = {
  senderName: "Your name",
  senderPhone: "Your phone",
  senderEmail: "Your email",
  pickup: "Pickup address",
  dropoff: "Drop-off address",
  packageType: "Package type",
  size: "Package size",
  notes: "Notes",
  recipientName: "Recipient name",
  recipientPhone: "Recipient phone",
  recipientEmail: "Recipient email",
  payer: "Who pays",
  estimatedValue: "Estimated value",
  photoName: "Package photo",
  pickupWindow: "Pickup window",
  scheduledAt: "Scheduled pickup time",
  trackingId: "Tracking ID",
  reference: "Payment reference",
}

const STEP_FIELDS: Record<number, readonly string[]> = {
  0: ["senderName", "senderPhone", "senderEmail"],
  1: [
    "pickup",
    "dropoff",
    "pickupLatitude",
    "pickupLongitude",
    "dropoffLatitude",
    "dropoffLongitude",
    "packageType",
    "size",
    "notes",
  ],
  2: [
    "recipientName",
    "recipientPhone",
    "recipientEmail",
    "payer",
    "estimatedValue",
    "photoName",
    "pickupWindow",
    "scheduledAt",
  ],
}

const SECRETISH =
  /PAYSTACK|SECRET|API[_ ]?KEY|TOKEN|PASSWORD|configured|DATABASE_URL|NEON|INTERNAL/i

export function fieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field
}

export function formatZodIssues(
  error: ZodError,
  limit = 3,
): { message: string; fields: string[]; step: number | null } {
  const fields: string[] = []
  const parts: string[] = []

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "")
    if (!field || fields.includes(field)) continue
    fields.push(field)
    parts.push(`${fieldLabel(field)}: ${issue.message}`)
    if (parts.length >= limit) break
  }

  return {
    message: parts.length > 0 ? parts.join(" · ") : "Check the form and try again",
    fields,
    step: stepForFields(fields),
  }
}

export function formatZodFlatten(
  details: unknown,
  fallback = "Check the form and try again",
  limit = 3,
): string {
  if (!details || typeof details !== "object") return fallback
  const fieldErrors = (details as { fieldErrors?: Record<string, string[]> })
    .fieldErrors
  if (!fieldErrors) return fallback

  const parts = Object.entries(fieldErrors)
    .flatMap(([field, messages]) => {
      if (!messages?.length) return []
      return messages.map((message) => `${fieldLabel(field)}: ${message}`)
    })
    .slice(0, limit)

  return parts.length > 0 ? parts.join(" · ") : fallback
}

export function stepForFields(fields: string[]): number | null {
  for (const field of fields) {
    for (const [step, list] of Object.entries(STEP_FIELDS)) {
      if (list.includes(field)) return Number(step)
    }
  }
  return null
}

export function stepForFlatten(details: unknown): number | null {
  if (!details || typeof details !== "object") return null
  const fieldErrors = (details as { fieldErrors?: Record<string, string[]> })
    .fieldErrors
  if (!fieldErrors) return null
  return stepForFields(Object.keys(fieldErrors))
}

/** Strip config / secret leakage from messages shown to users. */
export function publicErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Try again in a moment.",
): string {
  if (!(error instanceof Error) || !error.message.trim()) return fallback
  if (SECRETISH.test(error.message)) return fallback
  return error.message.trim()
}

export function httpStatusMessage(status: number): string {
  if (status === 401 || status === 403) return "You’re not allowed to do that"
  if (status === 404) return "We couldn’t find that order"
  if (status === 408 || status === 504) return "That took too long — try again"
  if (status === 429) return "Too many attempts — wait a moment and try again"
  if (status === 503) return "Server unreachable. Try again shortly."
  if (status >= 500) return "Something went wrong on our side. Try again."
  return "Request failed"
}

export class ApiRequestError extends Error {
  status: number
  details: unknown
  step: number | null

  constructor(
    message: string,
    options?: { status?: number; details?: unknown; step?: number | null },
  ) {
    super(message)
    this.name = "ApiRequestError"
    this.status = options?.status ?? 400
    this.details = options?.details ?? null
    this.step = options?.step ?? null
  }
}
