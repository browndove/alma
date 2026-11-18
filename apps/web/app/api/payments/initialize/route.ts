import { z } from "zod"

import {
  DeliveryBookingError,
  initializeDeliveryPayment,
} from "@/lib/deliveries/service"
import {
  jsonError,
  jsonOk,
  serverErrorResponse,
  siteLockResponse,
  zodErrorResponse,
} from "@/lib/api"
import { paymentMethods } from "@/lib/payments/paystack"

export const runtime = "nodejs"

const bodySchema = z.object({
  trackingId: z.string().trim().min(3).max(40),
  method: z.enum(paymentMethods).optional(),
})

export async function POST(request: Request) {
  const locked = siteLockResponse()
  if (locked) return locked

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return zodErrorResponse(parsed.error)

  try {
    const result = await initializeDeliveryPayment(
      parsed.data.trackingId,
      parsed.data.method,
    )
    return jsonOk({
      delivery: result.delivery,
      authorizationUrl: result.authorizationUrl,
      accessCode: result.accessCode,
      reference: result.reference,
    })
  } catch (error) {
    if (error instanceof DeliveryBookingError) {
      return jsonError(error.message, error.status)
    }
    console.error("[payments] initialize failed", error)
    return serverErrorResponse(
      error,
      "Could not start payment. Try again in a moment.",
    )
  }
}
