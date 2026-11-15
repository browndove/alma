import { getDelivery } from "@/lib/deliveries/service"
import { payUrlForDelivery } from "@/lib/email/payment-emails"
import { jsonError, jsonOk, siteLockResponse } from "@/lib/api"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const locked = siteLockResponse()
  if (locked) return locked

  const trackingId =
    new URL(request.url).searchParams.get("trackingId")?.trim() || ""
  if (!trackingId) {
    return jsonError("Tracking ID is required", 400)
  }

  const delivery = await getDelivery(trackingId)
  if (!delivery) {
    return jsonError("Delivery not found", 404)
  }

  return jsonOk({
    delivery,
    payUrl: payUrlForDelivery(delivery.trackingId),
  })
}
