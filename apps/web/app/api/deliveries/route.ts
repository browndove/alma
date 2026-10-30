import {
  createDelivery,
  DeliveryBookingError,
  getRecentDeliveries,
} from "@/lib/deliveries/service"
import { createDeliverySchema } from "@/lib/deliveries/types"
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api"

export const runtime = "nodejs"

function adminAuthorized(request: Request) {
  const secret = process.env.DELIVERIES_ADMIN_SECRET?.trim()
  if (!secret) return false
  const header = request.headers.get("x-admin-secret")?.trim()
  return Boolean(header && header === secret)
}

export async function GET(request: Request) {
  if (!adminAuthorized(request)) {
    return jsonError("Unauthorized", 401)
  }

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

  try {
    const delivery = await createDelivery(parsed.data)
    return jsonOk({ delivery }, { status: 201 })
  } catch (error) {
    if (error instanceof DeliveryBookingError) {
      return jsonError(error.message, error.status)
    }
    console.error("[deliveries] create failed", error)
    return jsonError("Could not create delivery", 500)
  }
}
