import { randomInt, timingSafeEqual } from "node:crypto"

import { getAppUrl } from "@/lib/email/resend"

import { HANDOVER_CONFIRMED_TITLE } from "./handover-status"
import {
  createId,
  getHandoverState,
  recordHandoverAttempt,
  updateDelivery,
} from "./store"

/** Wrong codes allowed before the check locks and ops has to step in. */
export const HANDOVER_MAX_ATTEMPTS = 5

/** Random 4-digit code (0000–9999) from a cryptographic source. */
export function generateHandoverCode() {
  return String(randomInt(0, 10_000)).padStart(4, "0")
}

/** Rider-facing page where the recipient's code is checked. */
export function handoverCheckUrl(trackingId: string) {
  return `${getAppUrl()}/handover/${encodeURIComponent(trackingId)}`
}

export type HandoverCheckResult =
  | { status: "confirmed"; alreadyConfirmed: boolean }
  | { status: "wrong"; attemptsLeft: number }
  | { status: "locked" }
  | { status: "not_found" }
  | { status: "no_code" }

function sameCode(expected: string, given: string) {
  const a = Buffer.from(expected)
  const b = Buffer.from(given)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Checks the code the recipient gave the rider. Wrong guesses count towards a
 * lock so the 4 digits can't be brute-forced; the right one is recorded once.
 */
export async function checkHandoverCode(
  trackingId: string,
  code: string,
): Promise<HandoverCheckResult> {
  const state = await getHandoverState(trackingId)
  if (!state) return { status: "not_found" }
  if (!state.code) return { status: "no_code" }
  if (state.confirmedAt) return { status: "confirmed", alreadyConfirmed: true }
  if (state.attempts >= HANDOVER_MAX_ATTEMPTS) return { status: "locked" }

  if (!sameCode(state.code, code.trim())) {
    await recordHandoverAttempt(trackingId, "wrong")
    const attemptsLeft = HANDOVER_MAX_ATTEMPTS - (state.attempts + 1)
    return attemptsLeft > 0 ? { status: "wrong", attemptsLeft } : { status: "locked" }
  }

  await recordHandoverAttempt(trackingId, "confirmed")
  const at = new Date().toISOString()
  await updateDelivery(trackingId, (row) => ({
    ...row,
    updatedAt: at,
    events: [
      ...row.events,
      {
        id: createId(),
        title: HANDOVER_CONFIRMED_TITLE,
        detail: "The recipient gave the rider the correct handover code",
        place: row.dropoff,
        at,
      },
    ],
  }))
  return { status: "confirmed", alreadyConfirmed: false }
}
