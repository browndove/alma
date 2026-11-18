import { z } from "zod"

import { jsonError, jsonOk, siteLockResponse, zodErrorResponse } from "@/lib/api"
import { checkHandoverCode, HANDOVER_MAX_ATTEMPTS } from "@/lib/deliveries/handover"

export const runtime = "nodejs"

type Params = {
  params: Promise<{ trackingId: string }>
}

const bodySchema = z.object({
  code: z.string().trim().regex(/^\d{4}$/, "Enter the 4-digit code"),
})

/** Rider submits the code the recipient read out at drop-off. */
export async function POST(request: Request, { params }: Params) {
  const locked = siteLockResponse()
  if (locked) return locked
  const { trackingId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body", 400)
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return zodErrorResponse(parsed.error)

  const result = await checkHandoverCode(trackingId, parsed.data.code)
  switch (result.status) {
    case "confirmed":
      return jsonOk({ confirmed: true, alreadyConfirmed: result.alreadyConfirmed })
    case "wrong":
      return jsonError(
        `That code isn’t right — ${result.attemptsLeft} ${result.attemptsLeft === 1 ? "try" : "tries"} left.`,
        400,
        { attemptsLeft: result.attemptsLeft },
      )
    case "locked":
      return jsonError(
        `Too many wrong codes (${HANDOVER_MAX_ATTEMPTS}). Call Diatel ops before handing over the package.`,
        423,
      )
    case "no_code":
      return jsonError("This order has no handover code. Call Diatel ops.", 409)
    case "not_found":
      return jsonError("Order not found — check the tracking ID.", 404)
  }
}
