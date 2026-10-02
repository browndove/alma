import { advanceDelivery } from "@/lib/deliveries/service"
import { jsonError, jsonOk } from "@/lib/api"

export const runtime = "nodejs"

type Params = {
  params: Promise<{ trackingId: string }>
}

export async function POST(_request: Request, { params }: Params) {
  const { trackingId } = await params
  const delivery = await advanceDelivery(trackingId)

  if (!delivery) {
    return jsonError("Delivery not found", 404)
  }

  return jsonOk({ delivery })
}
