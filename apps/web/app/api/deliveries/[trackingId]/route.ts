import { getDelivery } from "@/lib/deliveries/service"
import { jsonError, jsonOk } from "@/lib/api"

export const runtime = "nodejs"

type Params = {
  params: Promise<{ trackingId: string }>
}

export async function GET(_request: Request, { params }: Params) {
  const { trackingId } = await params
  if (!trackingId?.trim()) {
    return jsonError("Tracking ID is required", 400)
  }

  const delivery = await getDelivery(trackingId)
  if (!delivery) {
    return jsonError("Delivery not found", 404)
  }

  return jsonOk({ delivery })
}
