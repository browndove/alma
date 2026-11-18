import { z } from "zod"

import { jsonError, jsonOk, siteLockResponse, zodErrorResponse } from "@/lib/api"
import { sendContactEnquiry } from "@/lib/email/contact-emails"
import { ghanaPhoneError, normalizeGhanaPhone } from "@/lib/phone"

export const runtime = "nodejs"

const contactSchema = z.object({
  topic: z.enum(["support", "business", "riders", "press"]),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || !ghanaPhoneError(value), {
      message: "Enter a valid Ghana mobile number, e.g. 024 123 4567",
    })
    .transform((value) => (value ? normalizeGhanaPhone(value) ?? value : value)),
  message: z.string().trim().min(12).max(4000),
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
