import type { Delivery } from "./types"

/** Event titles recorded on an order when the recipient's pay link is emailed. */
export const PAY_LINK_SENT_TITLE = "Pay link emailed"
export const PAY_LINK_FAILED_TITLE = "Pay link not sent"

export type PayLinkStatus =
  | { state: "sent"; to: string; at: string }
  | { state: "failed"; reason: string; at: string }
  | { state: "none" }

/** Latest pay-link email outcome for an order, read from its events. */
export function payLinkStatus(delivery: Pick<Delivery, "events">): PayLinkStatus {
  for (let index = delivery.events.length - 1; index >= 0; index--) {
    const event = delivery.events[index]!
    if (event.title === PAY_LINK_SENT_TITLE) {
      return { state: "sent", to: event.detail, at: event.at }
    }
    if (event.title === PAY_LINK_FAILED_TITLE) {
      return { state: "failed", reason: event.detail, at: event.at }
    }
  }
  return { state: "none" }
}
