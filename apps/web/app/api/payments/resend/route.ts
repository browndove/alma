import { z } from "zod"

import { getDelivery, DeliveryBookingError } from "@/lib/deliveries/service"
import { sendRecipientPayLinkEmail } from "@/lib/email/payment-emails"
import { jsonError, jsonOk, siteLockResponse, zodErrorResponse } from "@/lib/api"

export const runtime = "nodejs"

const bodySchema = z.object({
  trackingId: z.string().trim().min(3).max(40),
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

  const delivery = await getDelivery(parsed.data.trackingId)
  if (!delivery) {
    return jsonError("Delivery not found", 404)
  }
  if (delivery.paymentStatus === "paid") {
    return jsonError("This delivery is already paid", 400)
  }
  if (delivery.payer !== "recipient") {
    return jsonError("Pay link is only for recipient-paid orders", 400)
  }

  try {
    await sendRecipientPayLinkEmail(delivery)
    return jsonOk({ sent: true, delivery })
  } catch (error) {
    if (error instanceof DeliveryBookingError) {
      return jsonError(error.message, error.status)
    }
    console.error("[payments] resend failed", error)
    return jsonError("Could not resend pay link", 500)
  }
}
