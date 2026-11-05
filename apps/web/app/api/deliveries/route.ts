import {
  createDelivery,
  DeliveryBookingError,
  getRecentDeliveries,
} from "@/lib/deliveries/service"
import { createDeliverySchema } from "@/lib/deliveries/types"
import { isOpsAuthorized } from "@/lib/ops-auth"
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api"

export const runtime = "nodejs"

export async function GET(request: Request) {
  if (!isOpsAuthorized(request)) {
    return jsonError(
      process.env.DELIVERIES_ADMIN_SECRET?.trim()
        ? "Unauthorized"
        : "Ops secret not configured (set DELIVERIES_ADMIN_SECRET)",
      401,
    )
  }

  const limitRaw = Number(new URL(request.url).searchParams.get("limit") || 75)
  const limit = Number.isFinite(limitRaw)
    ? Math.min(100, Math.max(1, Math.floor(limitRaw)))
    : 75
  const deliveries = await getRecentDeliveries(limit)
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
