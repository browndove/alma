import { z } from "zod"

export const packageSizes = ["small", "medium", "large"] as const
export const payers = ["sender", "recipient"] as const
export const pickupWindows = ["now", "schedule"] as const

export const deliveryStatuses = [
  "requested",
  "matching",
  "matched",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
] as const

export const createDeliverySchema = z.object({
  senderName: z.string().trim().min(2).max(80),
  senderPhone: z.string().trim().regex(/^\d{9,15}$/),
  senderEmail: z.string().trim().email().optional().or(z.literal("")),
  pickup: z.string().trim().min(3).max(220),
  dropoff: z.string().trim().min(3).max(220),
  packageType: z.string().trim().min(2).max(40),
  size: z.enum(packageSizes),
  notes: z.string().trim().max(500).optional().default(""),
  fragile: z.boolean().optional().default(false),
  perishable: z.boolean().optional().default(false),
  recipientName: z.string().trim().min(2).max(80),
  recipientPhone: z.string().trim().regex(/^\d{9,15}$/),
  payer: z.enum(payers),
  estimatedValue: z.string().trim().max(20).optional().default(""),
  photoName: z.string().trim().max(120).optional().nullable().default(null),
  pickupWindow: z.enum(pickupWindows),
  scheduledAt: z.string().datetime().nullable().optional().default(null),
})

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>
export type DeliveryStatus = (typeof deliveryStatuses)[number]
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
  tookanJobId?: string | number | null
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
