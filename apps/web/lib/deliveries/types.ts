import { z } from "zod"

import { ghanaPhoneError, normalizeGhanaPhone } from "@/lib/phone"

export const packageSizes = ["small", "medium", "large"] as const
export const payers = ["sender", "recipient"] as const
export const pickupWindows = ["now", "schedule"] as const
export const paymentStatuses = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "expired",
] as const

export const deliveryStatuses = [
  "requested",
  "unassigned",
  "assigned",
  "accepted",
  "pickup_started",
  "at_pickup",
  "picked_up",
  "delivering",
  "at_dropoff",
  "delivered",
  "failed",
  "declined",
  "cancelled",
  // Legacy Diatel / earlier Tookan mapping
  "matching",
  "matched",
  "started",
  "arrived",
  "in_transit",
] as const

const optionalCoord = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") return null
    if (typeof value === "number") return value
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : value
    }
    return value
  },
  z.number().finite().optional().nullable(),
)

const optionalEmail = z.preprocess(
  (value) => (value == null ? "" : value),
  z.union([
    z.literal(""),
    z.string().trim().email("Enter a valid email address"),
  ]),
)

export const SAME_PHONE_MESSAGE =
  "Use the recipient’s own number — it can’t be the same as yours"
export const SAME_EMAIL_MESSAGE =
  "Use the recipient’s own email — it can’t be the same as yours"

/** Ghana mobile numbers only; stored in national form (0241234567). */
const phoneSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const message = ghanaPhoneError(value)
    if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message })
  })
  .transform((value) => normalizeGhanaPhone(value) ?? value)

export const createDeliverySchema = z
  .object({
    senderName: z.string().trim().min(2, "Enter your full name").max(80),
    senderPhone: phoneSchema,
    senderEmail: optionalEmail,
    pickup: z
      .string()
      .trim()
      .min(3, "Enter a pickup address")
      .max(500, "Pickup address is too long"),
    dropoff: z
      .string()
      .trim()
      .min(3, "Enter a drop-off address")
      .max(500, "Drop-off address is too long"),
    /** Explicit map / locate-me pins — preferred over parsing the address string. */
    pickupLatitude: optionalCoord,
    pickupLongitude: optionalCoord,
    dropoffLatitude: optionalCoord,
    dropoffLongitude: optionalCoord,
    packageType: z.string().trim().min(2).max(40),
    size: z.enum(packageSizes),
    notes: z.string().trim().max(500).optional().default(""),
    fragile: z.boolean().optional().default(false),
    perishable: z.boolean().optional().default(false),
    recipientName: z.string().trim().min(2, "Enter recipient name").max(80),
    recipientPhone: phoneSchema,
    recipientEmail: optionalEmail,
    payer: z.enum(payers),
    estimatedValue: z.string().trim().max(20).optional().default(""),
    photoName: z.string().trim().max(255).optional().nullable().default(null),
    pickupWindow: z.enum(pickupWindows),
    scheduledAt: z.string().datetime().nullable().optional().default(null),
  })
  .superRefine((data, ctx) => {
    if (data.pickupWindow === "schedule" && !data.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick a date and time for scheduled pickup",
        path: ["scheduledAt"],
      })
    }
    // The rider calls the recipient at drop-off and the pay link goes to them,
    // so they must be a different person from the sender.
    if (data.recipientPhone && data.recipientPhone === data.senderPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: SAME_PHONE_MESSAGE,
        path: ["recipientPhone"],
      })
    }
    if (
      data.recipientEmail &&
      data.recipientEmail.toLowerCase() === data.senderEmail.toLowerCase()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: SAME_EMAIL_MESSAGE,
        path: ["recipientEmail"],
      })
    }
  })

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>
export type DeliveryStatus = (typeof deliveryStatuses)[number]
export type PaymentStatus = (typeof paymentStatuses)[number]
export type PackageSize = (typeof packageSizes)[number]

export type DeliveryEvent = {
  id: string
  title: string
  detail: string
  place: string | null
  at: string
}

export type Delivery = {
  id: string
  trackingId: string
  status: DeliveryStatus
  senderName: string
  senderPhone: string
  senderEmail: string
  pickup: string
  dropoff: string
  packageType: string
  size: PackageSize
  notes: string
  fragile: boolean
  perishable: boolean
  recipientName: string
  recipientPhone: string
  recipientEmail: string
  payer: (typeof payers)[number]
  estimatedValue: string
  photoName: string | null
  pickupWindow: (typeof pickupWindows)[number]
  scheduledAt: string | null
  fareGhs: number
  etaMinutes: number
  etaLabel: string
  riderName: string | null
  progressStep: number
  paymentStatus: PaymentStatus
  paymentReference: string | null
  paidAt: string | null
  paidBy: (typeof payers)[number] | null
  paymentChannel: string | null
  tookanJobId?: string | number | null
  tookanPickupJobId?: string | number | null
  tookanDeliveryJobId?: string | number | null
  tookanTrackingLink?: string | null
  events: DeliveryEvent[]
  createdAt: string
  updatedAt: string
}

export type GuideRecommendation = {
  service: string
  summary: string
  eta: string
  fareHint: string
  reasons: string[]
}
