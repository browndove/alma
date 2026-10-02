import { createDelivery, getRecentDeliveries } from "@/lib/deliveries/service"
import { createDeliverySchema } from "@/lib/deliveries/types"
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api"

export const runtime = "nodejs"

export async function GET() {
  const deliveries = await getRecentDeliveries(25)
  return jsonOk({ deliveries })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const parsed = createDeliverySchema.safeParse(body)
  if (!parsed.success) {
    return zodErrorResponse(parsed.error)
  }

  const delivery = await createDelivery(parsed.data)
  return jsonOk({ delivery }, { status: 201 })
}
