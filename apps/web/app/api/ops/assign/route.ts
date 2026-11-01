import { z } from "zod"

import {
  assignRiderToDelivery,
  DeliveryBookingError,
} from "@/lib/deliveries/service"
import { isOpsAuthorized } from "@/lib/ops-auth"
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api"

export const runtime = "nodejs"

const assignSchema = z.object({
  trackingId: z.string().trim().min(3).max(40),
  fleetId: z.number().int().positive(),
})

export async function POST(request: Request) {
  if (!isOpsAuthorized(request)) {
    return jsonError("Unauthorized", 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const parsed = assignSchema.safeParse(body)
  if (!parsed.success) {
    return zodErrorResponse(parsed.error)
  }

  try {
    const result = await assignRiderToDelivery(
      parsed.data.trackingId,
      parsed.data.fleetId,
    )
    return jsonOk(result)
  } catch (error) {
    if (error instanceof DeliveryBookingError) {
      return jsonError(error.message, error.status)
    }
    console.error("[ops] assign failed", error)
    return jsonError("Could not assign rider", 500)
  }
}
