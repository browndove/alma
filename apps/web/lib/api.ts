import { NextResponse } from "next/server"
import type { ZodError } from "zod"

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init)
}

export function jsonError(
  error: string,
  status = 400,
  details?: unknown
) {
  return NextResponse.json(
    { ok: false, error, details: details ?? null },
    { status }
  )
}

export function zodErrorResponse(error: ZodError) {
  return jsonError("Validation failed", 400, error.flatten())
}
