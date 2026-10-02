import { z } from "zod"

import { recommendFromPrompt } from "@/lib/deliveries/service"
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api"

export const runtime = "nodejs"

const guideSchema = z.object({
  prompt: z.string().trim().min(8).max(500),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const parsed = guideSchema.safeParse(body)
  if (!parsed.success) {
    return zodErrorResponse(parsed.error)
  }

  const recommendation = recommendFromPrompt(parsed.data.prompt)
  return jsonOk({ recommendation })
}
