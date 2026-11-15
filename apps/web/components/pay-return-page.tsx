"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { verifyPayment } from "@/lib/client-api"
import type { Delivery } from "@/lib/deliveries/types"

export function PayReturnPage({ reference }: { reference: string | null }) {
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(reference))

  useEffect(() => {
    if (!reference) {
      setError("Missing payment reference")
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const result = await verifyPayment(reference)
        if (!cancelled) setDelivery(result.delivery)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Payment verification failed")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [reference])

  const paid = delivery?.paymentStatus === "paid"

  return (
    <main className="pay-page">
      <div className="pay-shell">
        <div className="pay-brand">
          <img src="/diatel-logo.png" alt="Diatel" />
        </div>
        <div className="pay-card">
          {loading ? (
            <>
              <p className="rd-pay-kicker">Confirming</p>
              <h1 className="rd-pay-title">Checking payment…</h1>
              <p className="rd-pay-copy">
                Hang tight while we confirm your Paystack payment.
              </p>
            </>
          ) : paid && delivery ? (
            <>
              <div className="rd-pay-status is-ok" role="status">
                <span className="rd-pay-status-dot" aria-hidden="true" />
                <div>
                  <strong>Payment received</strong>
                  <span>
                    GHS {delivery.fareGhs}
                    {delivery.paymentChannel
                      ? ` · ${delivery.paymentChannel}`
                      : ""}
                  </span>
                </div>
              </div>
              <h1 className="rd-pay-title">You’re all set</h1>
              <p className="rd-pay-copy">
                Tracking <strong>{delivery.trackingId}</strong>. We’re lining up
                a rider now.
              </p>
              <Link
                className="rd-continue"
                href={`/track?id=${encodeURIComponent(delivery.trackingId)}`}
              >
                Track delivery
              </Link>
              <Link
                className="rd-back"
                href={`/request-delivery?paid=1&id=${encodeURIComponent(delivery.trackingId)}`}
              >
                Back to booking
              </Link>
            </>
          ) : (
            <>
              <div className="rd-pay-status is-bad" role="alert">
                <span className="rd-pay-status-dot" aria-hidden="true" />
                <div>
                  <strong>Payment didn’t go through</strong>
                  <span>{error || "Try again or use another method."}</span>
                </div>
              </div>
              <h1 className="rd-pay-title">Couldn’t confirm payment</h1>
              <p className="rd-pay-copy">
                No charge was kept if Paystack didn’t complete. You can retry
                from the pay page.
              </p>
              {delivery ? (
                <Link
                  className="rd-continue"
                  href={`/pay?id=${encodeURIComponent(delivery.trackingId)}`}
                >
                  Try again
                </Link>
              ) : (
                <Link className="rd-continue" href="/request-delivery">
                  Request a delivery
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
