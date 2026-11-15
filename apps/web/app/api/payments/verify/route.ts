import { z } from "zod"

import {
  confirmPaystackReference,
  DeliveryBookingError,
} from "@/lib/deliveries/service"
import {
  jsonError,
  jsonOk,
  serverErrorResponse,
  siteLockResponse,
  zodErrorResponse,
} from "@/lib/api"

export const runtime = "nodejs"

const bodySchema = z.object({
  reference: z.string().trim().min(3).max(80),
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
    const delivery = await confirmPaystackReference(parsed.data.reference)
    return jsonOk({ delivery })
  } catch (error) {
    if (error instanceof DeliveryBookingError) {
      return jsonError(error.message, error.status)
    }
    console.error("[payments] verify failed", error)
    return serverErrorResponse(
      error,
      "Could not verify payment. Try again in a moment.",
    )
  }
}
