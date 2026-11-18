"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useMemo, type ReactNode } from "react"

import { resolveAddressCoords } from "@/lib/deliveries/fare"
import { parseCoordsFromAddress } from "@/lib/deliveries/tookan"

const RoutePreviewMap = dynamic(
  () => import("./route-preview-map").then((mod) => mod.RoutePreviewMap),
  { ssr: false }
)

type SummaryLine = { label: string; value: ReactNode }

/**
 * Left pane shared by the booking form and its confirmation: brand, the hero
 * amount, route, live route map, order lines and total.
 */
export function CheckoutSummary({
  kicker,
  amount,
  note,
  noteTone = "default",
  pickup,
  dropoff,
  mapChip,
  lines,
  total,
  showAssurances = false,
}: {
  kicker: string
  amount: string
  note: ReactNode
  noteTone?: "default" | "blocked" | "success"
  pickup: string
  dropoff: string
  mapChip?: string | null
  lines: SummaryLine[]
  total: SummaryLine
  showAssurances?: boolean
}) {
  // Stable per address so the preview map only re-fits when a stop moves.
  const pickupPoint = useMemo(
    () => (pickup.trim() ? resolveAddressCoords(pickup) : null),
    [pickup]
  )
  const dropoffPoint = useMemo(
    () => (dropoff.trim() ? resolveAddressCoords(dropoff) : null),
    [dropoff]
  )
  const place = (value: string) => parseCoordsFromAddress(value).label || value

  return (
    <aside className="ck-summary" aria-label="Order summary">
      <div className="ck-summary-inner">
        <div className="ck-brand">
          <Link href="/" className="ck-back" aria-label="Back to Diatel">
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
              <path d="M10 3.5 5.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/diatel-logo.png" alt="" className="ck-brand-mark" />
          <span className="ck-brand-word">diatel</span>
        </div>

        <p className="ck-summary-kicker">{kicker}</p>
        <p className="ck-amount">{amount}</p>
        <p className={`ck-amount-note${noteTone === "default" ? "" : ` is-${noteTone}`}`}>
          {note}
        </p>

        <ol className="ck-route" aria-label="Route">
          <li className={pickup.trim() ? "" : "is-empty"}>
            <span className="ck-route-mark is-pickup" aria-hidden="true" />
            <span className="ck-route-label">Pickup</span>
            <span className="ck-route-value">
              {pickup.trim() ? place(pickup) : "Add a pickup address"}
            </span>
          </li>
          <li className={dropoff.trim() ? "" : "is-empty"}>
            <span className="ck-route-mark is-dropoff" aria-hidden="true" />
            <span className="ck-route-label">Drop-off</span>
            <span className="ck-route-value">
              {dropoff.trim() ? place(dropoff) : "Add a drop-off address"}
            </span>
          </li>
        </ol>

        <div className="ck-map">
          <RoutePreviewMap pickup={pickupPoint} dropoff={dropoffPoint} />
          {!pickupPoint && !dropoffPoint ? (
            <p className="ck-map-empty">Your route appears here</p>
          ) : mapChip ? (
            <span className="ck-map-chip">{mapChip}</span>
          ) : null}
        </div>

        <dl className="ck-lines">
          {lines.map((line) => (
            <div key={line.label}>
              <dt>{line.label}</dt>
              <dd>{line.value}</dd>
            </div>
          ))}
          <div className="ck-lines-total">
            <dt>{total.label}</dt>
            <dd>{total.value}</dd>
          </div>
        </dl>

        {showAssurances ? (
          <ul className="ck-assurances">
            <li>
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
                <path d="M8 14s4.5-3.9 4.5-7.25a4.5 4.5 0 0 0-9 0C3.5 10.1 8 14 8 14Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <circle cx="8" cy="6.75" r="1.5" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              Live tracking from pickup to door
            </li>
            <li>
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="4" width="12" height="8.5" rx="1.75" stroke="currentColor" strokeWidth="1.4" />
                <path d="M2 6.75h12" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              Pay securely with MoMo or card
            </li>
            <li>
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
                <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5.5 7V5.25a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              Handover PIN for the recipient
            </li>
          </ul>
        ) : null}

        <p className="ck-summary-foot">
          Secure payments by <strong>Paystack</strong>
          <span aria-hidden="true">·</span>
          <Link href="/track">Track an order</Link>
        </p>
      </div>
    </aside>
  )
}
