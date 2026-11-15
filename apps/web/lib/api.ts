import { NextResponse } from "next/server"
import type { ZodError } from "zod"

import { formatZodIssues, publicErrorMessage } from "@/lib/api-errors"
import { isSiteLocked } from "@/lib/site-lock"

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

export function siteLockResponse() {
  if (!isSiteLocked()) return null
  return jsonError("Server unreachable", 503)
}

export function zodErrorResponse(error: ZodError) {
  const { message } = formatZodIssues(error)
  return jsonError(message, 400, error.flatten())
}

export function serverErrorResponse(
  error: unknown,
  fallback = "Something went wrong. Try again in a moment.",
  status = 500,
) {
  return jsonError(publicErrorMessage(error, fallback), status)
}
