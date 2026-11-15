"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import {
  fetchPaymentStatus,
  initializePayment,
  type PaymentStatusPayload,
} from "@/lib/client-api"
import { parseCoordsFromAddress } from "@/lib/deliveries/tookan"

function place(address: string) {
  return parseCoordsFromAddress(address).label || address
}

export function PayDeliveryPage({ trackingId }: { trackingId: string | null }) {
  const [payload, setPayload] = useState<PaymentStatusPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(trackingId))
  const [paying, setPaying] = useState(false)

  const load = useCallback(async () => {
    if (!trackingId) return
    setLoading(true)
    setError(null)
    try {
      const next = await fetchPaymentStatus(trackingId)
      setPayload(next)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load this order. Check the link and try again.",
      )
    } finally {
      setLoading(false)
    }
  }, [trackingId])

  useEffect(() => {
    void load()
  }, [load])

  async function startPay() {
    if (!trackingId) return
    setPaying(true)
    setError(null)
    try {
      const result = await initializePayment(trackingId)
      window.location.href = result.authorizationUrl
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start payment. Try again in a moment.",
      )
      setPaying(false)
    }
  }

  if (!trackingId) {
    return (
      <main className="pay-page">
        <div className="pay-shell">
          <div className="pay-card">
            <p className="rd-pay-kicker">Diatel Pay</p>
            <h1 className="rd-pay-title">Missing tracking ID</h1>
            <p className="rd-pay-copy">
              Open the pay link from your email, or track your order instead.
            </p>
            <Link className="rd-continue" href="/track">
              Track delivery
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const delivery = payload?.delivery
  const paid = delivery?.paymentStatus === "paid"

  return (
    <main className="pay-page">
      <div className="pay-shell">
        <div className="pay-brand">
          <img src="/diatel-logo.png" alt="Diatel" />
        </div>
        <div className="pay-card">
          {loading && !delivery ? (
            <p className="rd-pay-copy">Loading order…</p>
          ) : error && !delivery ? (
            <>
              <h1 className="rd-pay-title">Couldn’t open payment</h1>
              <p className="rd-pay-copy">{error}</p>
              <button type="button" className="rd-continue" onClick={() => void load()}>
                Retry
              </button>
            </>
          ) : delivery ? (
            <>
              <p className="rd-pay-kicker">
                {paid ? "Paid" : "Pay for delivery"}
              </p>
              <h1 className="rd-pay-title">
                {paid ? "Payment received" : `Pay GHS ${delivery.fareGhs}`}
              </h1>
              <p className="rd-pay-copy">
                {paid
                  ? "Thanks — we’re lining up a rider for this delivery."
                  : "Pay with MoMo, card, or bank. A rider is assigned only after payment."}
              </p>

              <div className="rd-pay-summary">
                <div className="rd-pay-summary-row">
                  <span>Tracking</span>
                  <strong>{delivery.trackingId}</strong>
                </div>
                <div className="rd-pay-summary-row">
                  <span>From</span>
                  <strong>{place(delivery.pickup)}</strong>
                </div>
                <div className="rd-pay-summary-row">
                  <span>To</span>
                  <strong>{place(delivery.dropoff)}</strong>
                </div>
                <div className="rd-pay-summary-row rd-pay-total">
                  <span>Total</span>
                  <strong>GHS {delivery.fareGhs}</strong>
                </div>
              </div>

              {error ? (
                <div className="rd-pay-status is-bad" role="alert">
                  <span className="rd-pay-status-dot" aria-hidden="true" />
                  <div>
                    <strong>Payment error</strong>
                    <span>{error}</span>
                  </div>
                </div>
              ) : null}

              {paid ? (
                <Link
                  className="rd-continue"
                  href={`/track?id=${encodeURIComponent(delivery.trackingId)}`}
                >
                  Track delivery
                </Link>
              ) : (
                <button
                  type="button"
                  className="rd-continue"
                  disabled={paying}
                  onClick={() => void startPay()}
                >
                  {paying ? "Opening Paystack…" : `Pay GHS ${delivery.fareGhs}`}
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </main>
  )
}
