import { z } from "zod"

import {
  cancelDeliveryByOps,
  deleteDeliveryByOps,
  DeliveryBookingError,
  dispatchDeliveryToTookan,
  emailRecipientPayLink,
  getDelivery,
  markDeliveryPaidByOps,
} from "@/lib/deliveries/service"
import { isOpsAuthorized } from "@/lib/ops-auth"
import { jsonError, jsonOk, siteLockResponse, zodErrorResponse } from "@/lib/api"

export const runtime = "nodejs"

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("cancel"),
    reason: z.string().trim().min(3, "Give a reason").max(200),
  }),
  z.object({
    action: z.literal("mark_paid"),
    channel: z.enum(["cash", "momo", "bank"]),
  }),
  z.object({ action: z.literal("resend_pay_link") }),
  z.object({ action: z.literal("dispatch") }),
])

type Params = {
  params: Promise<{ trackingId: string }>
}

export async function DELETE(request: Request, { params }: Params) {
  const locked = siteLockResponse()
  if (locked) return locked
  if (!isOpsAuthorized(request)) {
    return jsonError("Unauthorized", 401)
  }

  const { trackingId } = await params
  try {
    return jsonOk({ deleted: await deleteDeliveryByOps(trackingId) })
  } catch (error) {
    if (error instanceof DeliveryBookingError) {
      return jsonError(error.message, error.status)
    }
    console.error(`[ops] delete failed for ${trackingId}`, error)
    return jsonError("Could not delete order", 500)
  }
}

export async function POST(request: Request, { params }: Params) {
  const locked = siteLockResponse()
  if (locked) return locked
  if (!isOpsAuthorized(request)) {
    return jsonError("Unauthorized", 401)
  }

  const { trackingId } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) {
    return zodErrorResponse(parsed.error)
  }

  try {
    const input = parsed.data
    switch (input.action) {
      case "cancel":
        return jsonOk({
          delivery: await cancelDeliveryByOps(trackingId, input.reason),
        })
      case "mark_paid":
        return jsonOk({
          delivery: await markDeliveryPaidByOps(trackingId, input.channel),
        })
      case "dispatch": {
        const delivery = await dispatchDeliveryToTookan(trackingId)
        if (!delivery.tookanJobId && !delivery.tookanPickupJobId) {
          return jsonError("Tookan didn’t accept the task — try again.", 502)
        }
        return jsonOk({ delivery })
      }
      case "resend_pay_link": {
        const delivery = await getDelivery(trackingId)
        if (!delivery) return jsonError("Delivery not found", 404)
        if (delivery.paymentStatus === "paid") {
          return jsonError("This delivery is already paid", 400)
        }
        if (delivery.payer !== "recipient") {
          return jsonError("Pay link is only for recipient-paid orders", 400)
        }
        if (!delivery.recipientEmail?.trim()) {
          return jsonError("This order has no recipient email to send to", 400)
        }
        const { delivery: updated, result } = await emailRecipientPayLink(
          delivery.trackingId,
        )
        if (!result.ok) {
          return jsonError(`Couldn’t send the pay link: ${result.reason}`, 502)
        }
        return jsonOk({ delivery: updated, sentTo: result.to })
      }
    }
  } catch (error) {
    if (error instanceof DeliveryBookingError) {
      return jsonError(error.message, error.status)
    }
    console.error(`[ops] ${parsed.data.action} failed for ${trackingId}`, error)
    return jsonError("Ops action failed", 500)
  }
}
