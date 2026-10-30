import { z } from "zod"

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api"
import { sendContactEnquiry } from "@/lib/email/contact-emails"

export const runtime = "nodejs"

const contactSchema = z.object({
  topic: z.enum(["support", "business", "riders", "press"]),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(12).max(4000),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return zodErrorResponse(parsed.error)
  }

  const result = await sendContactEnquiry({
    topic: parsed.data.topic,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || undefined,
    message: parsed.data.message,
  })

  if (!result.ok) {
    return jsonError(
      result.reason || "Could not send your message. Try again in a moment.",
      502,
    )
  }

  return jsonOk({ sent: true })
}
