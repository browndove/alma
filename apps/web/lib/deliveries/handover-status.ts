import type { Delivery } from "./types"

/** Event recorded when the rider enters the recipient's correct handover code. */
export const HANDOVER_CONFIRMED_TITLE = "Handover confirmed"

/** Safe for the browser: reads the confirmation event, never the code itself. */
export function handoverConfirmedAt(delivery: Pick<Delivery, "events">) {
  return (
    delivery.events.find((event) => event.title === HANDOVER_CONFIRMED_TITLE)?.at ??
    null
  )
}
