"use client"

import Link from "next/link"

import { CheckoutSummary } from "./checkout-summary"
import type { PayLinkStatus } from "@/lib/deliveries/pay-link"

export type ConfirmationPhase = "redirecting" | "awaiting" | "paid" | "failed"
export type PayMethod = "momo" | "card"

type StepState = "done" | "current" | "pending" | "error"

type ConfirmationProps = {
  phase: ConfirmationPhase
  trackingId: string | null
  fare: number
  etaLabel: string
  payer: "sender" | "recipient"
  recipientName: string
  recipientEmail: string
  pickup: string
  dropoff: string
  packageType: string
  sizeLabel: string
  payUrl: string | null
  paymentChannel: string | null
  fleetQueued: boolean
  riderMatched: boolean
  payLink: PayLinkStatus
  copied: boolean
  payLinkCopied: boolean
  resending: boolean
  payingWith: PayMethod | null
  error: string | null
  onCopyId: () => void
  onCopyPayLink: () => void
  onResend: () => void
  onPay: (method: PayMethod) => void
}

function channelLabel(channel: string | null) {
  if (!channel) return null
  if (channel === "mobile_money") return "Mobile Money"
  if (channel === "card") return "Card"
  if (channel === "bank_transfer") return "Bank transfer"
  return channel.charAt(0).toUpperCase() + channel.slice(1).replace(/_/g, " ")
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GH", {
    timeZone: "Africa/Accra",
    hour: "numeric",
    minute: "2-digit",
  })
}

function heroCopy(props: ConfirmationProps, who: string) {
  const amount = `GHS ${props.fare}`
  if (props.phase === "redirecting") {
    return {
      kicker: "Secure checkout",
      title: "Opening Paystack…",
      subtitle: `Pay ${amount} with Mobile Money or card. Your delivery is already booked.`,
    }
  }
  if (props.phase === "paid") {
    return {
      kicker: "Payment received",
      title: "You’re all set",
      subtitle: props.riderMatched
        ? "A rider is heading to your pickup. Follow every step live."
        : "We’re lining up the nearest rider for your pickup now.",
    }
  }
  if (props.phase === "failed") {
    return {
      kicker: "Payment not completed",
      title: "Payment didn’t go through",
      subtitle: `Nothing is lost — your delivery is still booked and dispatching. Try again with Mobile Money or card. The fare stays ${amount}.`,
    }
  }
  if (props.payer === "recipient") {
    if (props.payLink.state === "failed") {
      return {
        kicker: "Booking confirmed",
        title: "Booked — the pay link didn’t send",
        subtitle: `Your delivery is booked and a rider is being dispatched. We couldn’t email ${who}, so send the link again below.`,
      }
    }
    return {
      kicker: "Booking confirmed",
      title: `Booked — ${who} has the pay link`,
      subtitle: `We emailed ${who} a secure link to pay ${amount}. A rider is being dispatched now — it doesn’t wait for payment.`,
    }
  }
  return {
    kicker: "Booking confirmed",
    title: "Booked — payment still open",
    subtitle: `Finish paying ${amount} with Mobile Money or card. Your rider is being dispatched either way.`,
  }
}

function buildSteps(props: ConfirmationProps, who: string) {
  const channel = channelLabel(props.paymentChannel)
  const payment: { state: StepState; caption: string } =
    props.phase === "paid"
      ? { state: "done", caption: channel ? `Paid with ${channel}` : "Paid" }
      : props.phase === "failed"
        ? { state: "error", caption: "Didn’t go through — try again above" }
        : props.phase === "redirecting"
          ? { state: "current", caption: "Checkout is opening" }
          : props.payer === "recipient"
            ? { state: "current", caption: `Waiting for ${who} to pay` }
            : { state: "current", caption: "Waiting for your payment" }

  const rider: { state: StepState; caption: string } = props.riderMatched
    ? { state: "done", caption: "Rider matched" }
    : props.fleetQueued
      ? { state: "current", caption: "Finding the nearest rider" }
      : { state: "pending", caption: "Dispatching" }

  return [
    { id: "booked", label: "Booked", state: "done" as StepState, caption: "Order placed and sent to our fleet" },
    { id: "payment", label: "Payment", ...payment },
    { id: "rider", label: "Rider", ...rider },
    { id: "delivered", label: "Delivered", state: "pending" as StepState, caption: "Track it live until handover" },
  ]
}

function HeroIcon({ phase }: { phase: ConfirmationPhase }) {
  if (phase === "paid") {
    return (
      <div className="cf-icon is-paid" aria-hidden="true">
        <svg viewBox="0 0 72 72" className="cf-icon-svg">
          <circle className="rd-success-check-ring" cx="36" cy="36" r="30" />
          <path className="rd-success-check-mark" d="M22 37.5 31.5 47 50 26" />
        </svg>
      </div>
    )
  }
  if (phase === "failed") {
    return (
      <div className="cf-icon is-failed" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" className="cf-icon-glyph">
          <path d="M12 7.5v5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="12" cy="16.75" r="1.3" fill="currentColor" />
        </svg>
      </div>
    )
  }
  if (phase === "redirecting") {
    return (
      <div className="cf-icon is-redirecting" aria-hidden="true">
        <span className="cf-spinner" />
        <svg viewBox="0 0 24 24" fill="none" className="cf-icon-glyph">
          <rect x="5.5" y="10.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </div>
    )
  }
  return (
    <div className="cf-icon is-booked" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" className="cf-icon-glyph">
        <path d="m6.5 12.5 3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function StepMark({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="cf-step-mark is-done" aria-hidden="true">
        <svg viewBox="0 0 12 12" fill="none">
          <path d="M2.75 6.25 5 8.5l4.25-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (state === "error") {
    return (
      <span className="cf-step-mark is-error" aria-hidden="true">
        <svg viewBox="0 0 12 12" fill="none">
          <path d="M3.5 3.5l5 5M8.5 3.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  return <span className={`cf-step-mark is-${state}`} aria-hidden="true" />
}

function CopyGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 14 14" fill="none" className="size-3.5">
      <rect x="4.5" y="4.5" width="7.5" height="7.5" rx="1.75" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 3.25V3A1.5 1.5 0 0 0 8 1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function MailGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <rect x="2.75" y="4.75" width="14.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="m3.5 5.75 6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

/** Recipient-pays: shows whether Resend actually delivered the pay link. */
function PayLinkPanel(props: ConfirmationProps & { who: string }) {
  const { payLink } = props
  const sent = payLink.state === "sent"
  const failed = payLink.state === "failed"
  return (
    <section
      className={`cf-panel cf-paylink${failed ? " is-failed" : sent ? " is-sent" : ""}`}
      aria-label="Pay link"
    >
      <div className="cf-panel-head">
        <span className="cf-panel-icon">
          <MailGlyph />
        </span>
        <div className="cf-panel-copy">
          <strong>
            {sent
              ? `Pay link emailed to ${props.who}`
              : failed
                ? `We couldn’t email ${props.who}`
                : `Pay link for ${props.who}`}
          </strong>
          <span>
            {sent
              ? `${payLink.to} · sent ${formatTime(payLink.at)}`
              : failed
                ? payLink.reason
                : props.recipientEmail || "No email on this order"}
          </span>
        </div>
        {sent ? (
          <span className="cf-pill is-green">Sent</span>
        ) : failed ? (
          <span className="cf-pill is-red">Not sent</span>
        ) : null}
      </div>
      <div className="cf-panel-actions">
        <button
          type="button"
          className={failed ? "cf-btn cf-btn-primary" : "cf-btn cf-btn-quiet"}
          disabled={props.resending}
          onClick={props.onResend}
        >
          {props.resending ? "Sending…" : failed ? "Try sending again" : "Resend email"}
        </button>
        {props.payUrl ? (
          <button type="button" className="cf-btn cf-btn-quiet" onClick={props.onCopyPayLink}>
            <CopyGlyph />
            {props.payLinkCopied ? "Copied" : "Copy pay link"}
          </button>
        ) : null}
      </div>
    </section>
  )
}

function PayPanel(props: ConfirmationProps) {
  return (
    <section className="cf-pay" aria-label="Pay now">
      <button
        type="button"
        className="cf-pay-btn is-momo"
        disabled={props.payingWith !== null}
        onClick={() => props.onPay("momo")}
      >
        <span className="cf-pay-copy">
          <strong>{props.payingWith === "momo" ? "Opening MoMo…" : "Pay with Mobile Money"}</strong>
          <span>MTN, Telecel, AirtelTigo</span>
        </span>
        <span className="cf-pay-amount">GHS {props.fare}</span>
      </button>
      <button
        type="button"
        className="cf-pay-btn"
        disabled={props.payingWith !== null}
        onClick={() => props.onPay("card")}
      >
        <span className="cf-pay-copy">
          <strong>{props.payingWith === "card" ? "Opening card checkout…" : "Pay with card"}</strong>
          <span>Visa, Mastercard, Verve</span>
        </span>
        <span className="cf-pay-amount">GHS {props.fare}</span>
      </button>
    </section>
  )
}

export function RequestDeliveryConfirmation(props: ConfirmationProps) {
  const who = props.recipientName.trim().split(/\s+/)[0] || "the recipient"
  const hero = heroCopy(props, who)
  const steps = buildSteps(props, who)
  const paid = props.phase === "paid"
  const channel = channelLabel(props.paymentChannel)
  const trackHref = props.trackingId
    ? `/track?id=${encodeURIComponent(props.trackingId)}`
    : "/track"
  const needsPayment =
    props.phase === "failed" || (props.phase === "awaiting" && props.payer === "sender")
  const showPayLink = props.payer === "recipient" && props.phase === "awaiting"

  return (
    <div className="ck-page">
      <div className="ck-shell">
        <CheckoutSummary
          kicker={paid ? "Paid" : "Amount due"}
          amount={`GHS ${props.fare}.00`}
          note={
            paid
              ? `Paid${channel ? ` with ${channel}` : ""} — thank you`
              : props.payer === "recipient"
                ? `Due from ${who} · ${props.payLink.state === "sent" ? "pay link sent" : "pay link not sent yet"}`
                : "Due from you · Mobile Money or card"
          }
          noteTone={paid ? "success" : "default"}
          pickup={props.pickup}
          dropoff={props.dropoff}
          mapChip={`ETA ${props.etaLabel}`}
          lines={[
            { label: "Tracking ID", value: props.trackingId ?? "—" },
            { label: "Package", value: `${props.packageType} · ${props.sizeLabel}` },
            {
              label: "Paid by",
              value: props.payer === "recipient" ? props.recipientName || "Recipient" : "You",
            },
          ]}
          total={{ label: paid ? "Total paid" : "Total due", value: `GHS ${props.fare}.00` }}
        />

        <main className="ck-main">
          <div className={`cf is-${props.phase}`}>
            <header className="cf-hero">
              <HeroIcon phase={props.phase} />
              <div className="cf-hero-copy">
                <p className="cf-kicker">{hero.kicker}</p>
                <h1 className="cf-title">{hero.title}</h1>
                <p className="cf-subtitle">{hero.subtitle}</p>
              </div>
            </header>

            <div className="cf-ticket">
              <div className="cf-ticket-item">
                <span>Tracking ID</span>
                <strong className="cf-mono">{props.trackingId ?? "—"}</strong>
              </div>
              <div className="cf-ticket-item">
                <span>ETA</span>
                <strong>{props.etaLabel}</strong>
              </div>
              <button
                type="button"
                className="cf-btn cf-btn-quiet"
                onClick={props.onCopyId}
                aria-live="polite"
              >
                <CopyGlyph />
                {props.copied ? "Copied" : "Copy ID"}
              </button>
            </div>

            {showPayLink ? <PayLinkPanel {...props} who={who} /> : null}
            {needsPayment ? <PayPanel {...props} /> : null}

            {props.error ? (
              <p className="cf-error" role="alert">
                {props.error}
              </p>
            ) : null}

            <section className="cf-progress" aria-label="Order progress">
              <h2 className="cf-section-title">Progress</h2>
              <ol className="cf-steps">
                {steps.map((step) => (
                  <li key={step.id} className={`cf-step is-${step.state}`}>
                    <StepMark state={step.state} />
                    <div className="cf-step-copy">
                      <strong>{step.label}</strong>
                      <span>{step.caption}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {props.phase !== "redirecting" ? (
              <div className="cf-actions">
                <Link
                  href={trackHref}
                  className={`cf-btn cf-btn-lg ${needsPayment ? "cf-btn-secondary" : "cf-btn-primary"}`}
                >
                  Track delivery
                  <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" className="size-3.5">
                    <path d="M4.25 2.25 8.5 6 4.25 9.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                {/* Full reload so the form resets instead of restoring this order. */}
                <a href="/request-delivery" className="cf-link">
                  Book another delivery
                </a>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
