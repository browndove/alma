"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent } from "react"

import { GridRule, PageGrid } from "@/components/page-grid"
import { SiteHeader } from "@/components/site-header"
import { fetchDelivery } from "@/lib/client-api"
import type { Delivery } from "@/lib/deliveries/types"

const RECENT_KEY = "diatel.recentTrackingIds"
const MAX_RECENT = 5

const PROGRESS_STEPS = [
  { id: "placed", label: "Order placed" },
  { id: "packed", label: "Packed & sorted" },
  { id: "transit", label: "In transit" },
  { id: "delivered", label: "Delivered" },
] as const

type StepState = "done" | "current" | "pending"

function readRecentIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

function rememberTrackingId(id: string) {
  const next = [id, ...readRecentIds().filter((item) => item !== id)].slice(
    0,
    MAX_RECENT
  )
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  return next
}

function formatFeedTime(iso: string) {
  return new Date(iso)
    .toLocaleTimeString("en-GH", {
      hour: "numeric",
      minute: "2-digit",
    })
    .replace(":", " : ")
}

function formatGhs(amount: number) {
  return `GHS ${amount.toFixed(2)}`
}

function stepCaption(state: StepState) {
  if (state === "done") return "Completed"
  if (state === "current") return "In progress"
  return "Pending"
}

function formatEtaClock(delivery: Delivery) {
  const eta = new Date(delivery.createdAt)
  eta.setMinutes(eta.getMinutes() + delivery.etaMinutes)
  const time = eta.toLocaleTimeString("en-GH", {
    hour: "numeric",
    minute: "2-digit",
  })
  const today = new Date()
  const sameDay =
    eta.getFullYear() === today.getFullYear() &&
    eta.getMonth() === today.getMonth() &&
    eta.getDate() === today.getDate()
  return `${time} ${sameDay ? "Today" : eta.toLocaleDateString("en-GH", { month: "short", day: "numeric" })}`
}

function handoverPin(trackingId: string) {
  let hash = 0
  for (const char of trackingId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return String(1000 + (hash % 9000))
}

function vehicleLabel(size: Delivery["size"]) {
  if (size === "large") return "Cargo van"
  if (size === "medium") return "Box bike"
  return "Express bike"
}

function storageSpec(delivery: Delivery) {
  if (delivery.perishable) return "Cold chain"
  if (delivery.fragile) return "Fragile handling"
  return "Ambient controlled"
}

function packageWeight(size: Delivery["size"]) {
  if (size === "large") return "8.0 kg"
  if (size === "medium") return "3.2 kg"
  return "1.1 kg"
}

function buildProgress(delivery: Delivery) {
  const fullyDone =
    delivery.status === "delivered" ||
    delivery.progressStep >= PROGRESS_STEPS.length
  const currentIndex = Math.min(
    delivery.progressStep,
    PROGRESS_STEPS.length - 1
  )

  return PROGRESS_STEPS.map((step, index) => {
    let state: StepState = "pending"
    if (fullyDone || index < currentIndex) state = "done"
    else if (index === currentIndex) state = "current"

    let time: string | null = null
    if (state !== "pending") {
      if (index === 0) time = formatFeedTime(delivery.createdAt)
      else if (state === "current") time = formatFeedTime(delivery.updatedAt)
      else {
        const event = delivery.events[Math.min(index, delivery.events.length - 1)]
        time = formatFeedTime(event?.at ?? delivery.updatedAt)
      }
    }

    return { ...step, state, index, time, caption: stepCaption(state) }
  })
}

function currentStepMeta(delivery: Delivery) {
  const steps = buildProgress(delivery)
  const current =
    steps.find((step) => step.state === "current") ??
    steps[steps.length - 1]!
  const labels = [
    "Order received",
    "Packed & sorted",
    "Out for delivery",
    "Delivered",
  ] as const
  return {
    stepNumber: Math.min(current.index + 1, 4),
    label: labels[current.index] ?? current.label,
    steps,
  }
}

function headlineFor(delivery: Delivery) {
  if (delivery.status === "delivered") return "Delivered"
  if (delivery.status === "cancelled") return "Delivery cancelled"
  return `Arriving in ${delivery.etaMinutes} mins`
}

function ChevronRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" fill="none">
      <path
        d="M4.25 2.25 8.5 6 4.25 9.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 10.5h7V5H2v5.5Zm7 0h2.6L13 8.8V5H9v5.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="4.5" cy="12" r="1.2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11.2" cy="12" r="1.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 1.4 7.3 4.2l3.1.3-2.4 2.1.7 3L6 8.2 3.3 9.6l.7-3L1.6 4.5l3.1-.3L6 1.4Z" />
    </svg>
  )
}

function PinMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1.6a3 3 0 0 1 3 3c0 2-3 5.4-3 5.4S3 6.6 3 4.6a3 3 0 0 1 3-3Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="6" cy="4.6" r="1" fill="currentColor" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d="M4.6 2.8h2.1l.9 2.2-1.3 1.3a8 8 0 0 0 3.4 3.4l1.3-1.3 2.2.9v2.1A1.4 1.4 0 0 1 11.8 13 8.8 8.8 0 0 1 3 4.2 1.4 1.4 0 0 1 4.6 2.8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MessageStrokeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d="M3.4 11.2 2.2 12.8V4.4A1.4 1.4 0 0 1 3.6 3h8.8A1.4 1.4 0 0 1 13.8 4.4v5.4A1.4 1.4 0 0 1 12.4 11.2H3.4Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WarehouseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d="M2.5 13V7.2L8 3.5l5.5 3.7V13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M6.2 13v-4h3.6v4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function EmptyStateArt() {
  return (
    <div className="track-empty-art" aria-hidden="true">
      <div className="track-empty-art-glow" />
      <svg className="track-empty-art-svg" viewBox="0 0 120 96" fill="none">
        <rect x="28" y="28" width="64" height="48" rx="10" fill="#FFE4D4" />
        <path d="M28 42h64" stroke="#FE8A55" strokeWidth="2" strokeLinecap="round" />
        <path d="M60 28v48" stroke="#FE8A55" strokeWidth="2" strokeLinecap="round" />
        <rect x="46" y="18" width="28" height="14" rx="4" fill="#FE5200" />
        <circle cx="92" cy="24" r="8" fill="#FFD0E4" />
        <circle cx="24" cy="68" r="6" fill="#E8D7FF" />
      </svg>
    </div>
  )
}

export function TrackPage({
  initialTrackingId,
}: {
  initialTrackingId: string | null
}) {
  const [lookupId, setLookupId] = useState(initialTrackingId ?? "")
  const [trackingId, setTrackingId] = useState(initialTrackingId)
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(Boolean(initialTrackingId))
  const [error, setError] = useState<string | null>(null)
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [notifyFeedback, setNotifyFeedback] = useState<string | null>(null)

  useEffect(() => {
    setRecentIds(readRecentIds())
  }, [])

  useEffect(() => {
    if (!trackingId) {
      setDelivery(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setNotifyFeedback(null)

    fetchDelivery(trackingId)
      .then(({ delivery: next }) => {
        if (cancelled) return
        setDelivery(next)
        setRecentIds(rememberTrackingId(next.trackingId))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setDelivery(null)
        setError(err instanceof Error ? err.message : "Delivery not found")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [trackingId])

  const progressMeta = useMemo(
    () => (delivery ? currentStepMeta(delivery) : null),
    [delivery]
  )

  const feedEvents = useMemo(() => {
    if (!delivery) return []
    return delivery.events
      .slice()
      .reverse()
      .map((event, index) => ({
        ...event,
        isLatest: index === 0,
      }))
  }, [delivery])

  function trackId(nextRaw: string) {
    const next = nextRaw.trim().toUpperCase()
    if (!next) return
    setLookupId(next)
    setTrackingId(next)
    const url = new URL(window.location.href)
    url.searchParams.set("id", next)
    window.history.replaceState({}, "", url.toString())
  }

  function onLookup(event: FormEvent) {
    event.preventDefault()
    trackId(lookupId)
  }

  function notifyMe() {
    if (!delivery) return
    setNotifyFeedback("We’ll notify you when this delivery’s status changes.")
  }

  const showEmpty = !loading && !delivery && !error
  const showResult = Boolean(delivery && progressMeta)
  const pin = delivery ? handoverPin(delivery.trackingId) : null
  const fulfillmentFee = delivery ? Math.max(8, Math.round(delivery.fareGhs * 0.45)) : 0
  const dispatchFee = delivery ? Math.max(6, Math.round(delivery.fareGhs * 0.4)) : 0
  const taxFee = delivery
    ? Math.max(0, delivery.fareGhs - fulfillmentFee - dispatchFee)
    : 0

  return (
    <div className="page-shell track-shell">
      <SiteHeader />

      <div className="relative">
        <PageGrid>
          <GridRule />

          <div className="track-page">
            {loading ? (
              <div className="track-loading" aria-busy="true" aria-live="polite">
                <div className="track-skeleton track-skeleton-hero" />
                <div className="track-skeleton-grid">
                  <div className="track-skeleton track-skeleton-main" />
                  <div className="track-skeleton track-skeleton-side" />
                </div>
              </div>
            ) : null}

            {showEmpty || error ? (
              <section className="track-empty" aria-label="No delivery tracked yet">
                <EmptyStateArt />
                <h1 className="track-empty-title">Track delivery</h1>
                <p className="track-empty-copy">
                  Enter a tracking ID to see the latest status.
                </p>
                <form className="track-lookup" onSubmit={onLookup}>
                  <input
                    className="track-lookup-input"
                    value={lookupId}
                    onChange={(event) => setLookupId(event.target.value)}
                    placeholder="Enter tracking ID (e.g. DT-94000)"
                    aria-label="Tracking ID"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button type="submit" className="track-primary">
                    Track
                    <ChevronRight />
                  </button>
                </form>
                {error ? (
                  <p className="track-error" role="alert">
                    {error}. Check the ID and try again.
                  </p>
                ) : null}
                {recentIds.length > 0 ? (
                  <div className="track-recent">
                    <p className="track-recent-label">Recently tracked</p>
                    <div className="track-recent-chips">
                      {recentIds.map((id) => (
                        <button
                          key={id}
                          type="button"
                          className="track-recent-chip"
                          onClick={() => trackId(id)}
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="track-empty-cta">
                  <span>Don&apos;t have a tracking ID?</span>
                  <Link href="/request-delivery" className="track-text-link">
                    Request a delivery
                  </Link>
                </div>
              </section>
            ) : null}

            {showResult && delivery && progressMeta ? (
              <div className="track-dashboard">
                <section className="track-hero-card">
                  <div className="track-status-hero">
                    <div className="track-status-copy">
                      <span className="track-route-badge">
                        Direct priority route
                      </span>
                      <h1 className="track-eta-title">{headlineFor(delivery)}</h1>
                      <div className="track-eta-meta">
                        <span>
                          Estimated delivery{" "}
                          <strong>{formatEtaClock(delivery)}</strong>
                        </span>
                        <span className="track-eta-sep" aria-hidden="true" />
                        <span className="track-eta-check">
                          <span
                            className="track-eta-check-icon"
                            aria-hidden="true"
                          >
                            <CheckIcon />
                          </span>
                          Priority signature
                        </span>
                      </div>
                    </div>

                    <div className="track-status-actions">
                      <div className="track-mode-card">
                        <p className="track-mode-label">Delivery mode</p>
                        <p className="track-mode-value">
                          {vehicleLabel(delivery.size)}{" "}
                          <span>
                            #{delivery.trackingId.replace(/\D/g, "").slice(-2) || "42"}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        className="track-notify-btn"
                        onClick={notifyMe}
                      >
                        Notify me
                      </button>
                    </div>
                    {notifyFeedback ? (
                      <p className="track-notify-feedback" role="status">
                        {notifyFeedback}
                      </p>
                    ) : null}
                  </div>

                  <div className="track-progress" aria-label="Delivery progress">
                    <div className="track-progress-head">
                      <p className="track-progress-kicker">Delivery progress</p>
                      <p className="track-progress-step-label">
                        Step {progressMeta.stepNumber} of 4 · {progressMeta.label}
                      </p>
                    </div>

                    <ol className="track-progress-rail">
                      <li
                        className="track-progress-fill"
                        aria-hidden="true"
                        style={{
                          width: `${
                            (delivery.status === "delivered"
                              ? 1
                              : (progressMeta.stepNumber - 1 + 0.55) / 3) * 100
                          }%`,
                        }}
                      />
                      {progressMeta.steps.map((step) => (
                        <li
                          key={step.id}
                          className={`track-progress-step is-${step.state}`}
                        >
                          <span className="track-progress-dot" aria-hidden="true">
                            {step.state === "done" ? <CheckIcon /> : null}
                            {step.state === "current" ? <TruckIcon /> : null}
                          </span>
                          <span className="track-progress-name">{step.label}</span>
                          {step.time ? (
                            <span className="track-progress-time">{step.time}</span>
                          ) : null}
                          <span className="track-progress-caption">
                            {step.caption}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </section>

                <div className="track-main-grid">
                  <div className="track-col-main">
                    <section className="track-card track-feed-card">
                      <div className="track-feed-head">
                        <h2 className="track-feed-title">
                          <span className="track-feed-title-dot" aria-hidden="true" />
                          Live Delivery Feed
                        </h2>
                        <span className="track-feed-live">Auto-updating live</span>
                      </div>

                      <ol className="track-feed">
                        {feedEvents.map((event, index) => (
                          <li
                            key={event.id}
                            className={`track-feed-item${event.isLatest ? " is-latest" : ""}${
                              index === 1 ? " is-checked" : ""
                            }`}
                          >
                            <div className="track-feed-rail" aria-hidden="true">
                              <span className="track-feed-dot">
                                {index === 1 ? <CheckIcon /> : null}
                              </span>
                            </div>
                            <div className="track-feed-body">
                              <div className="track-feed-top">
                                <time>{formatFeedTime(event.at)}</time>
                                {event.isLatest ? (
                                  <span className="track-feed-tag">
                                    Current status
                                  </span>
                                ) : null}
                              </div>
                              <strong>{event.title}</strong>
                              <p>{event.detail}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </section>

                    <section className="track-card track-courier-card">
                      <div className="track-card-head">
                        <p className="track-kicker">Your assigned courier</p>
                        <span className="track-ghost-pill">Direct dispatch</span>
                      </div>
                      <div className="track-courier-top">
                        <div className="track-courier-avatar" aria-hidden="true">
                          {(delivery.riderName ?? "Diatel")
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="track-courier-copy">
                          <h2 className="track-card-title">
                            {delivery.riderName ?? "Matching a rider"}
                          </h2>
                          <div className="track-courier-meta">
                            <span className="track-pro-badge">Certified pro</span>
                            <span className="track-rating">
                              <StarIcon />
                              4.9
                            </span>
                            <span>
                              {vehicleLabel(delivery.size)} · Accra fleet
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="track-courier-actions">
                        <button
                          type="button"
                          className="track-btn-ghost"
                          onClick={notifyMe}
                        >
                          <MessageStrokeIcon />
                          Message
                        </button>
                        <button
                          type="button"
                          className="track-btn-dark"
                          onClick={() =>
                            setNotifyFeedback(
                              delivery.riderName
                                ? `Calling ${delivery.riderName} isn’t connected yet — use Notify me for updates.`
                                : "Rider calling isn’t connected yet — use Notify me for updates."
                            )
                          }
                        >
                          <PhoneIcon />
                          {delivery.riderName
                            ? `Call ${delivery.riderName.split(" ")[0]}`
                            : "Call support"}
                        </button>
                      </div>
                    </section>

                    <section className="track-card track-pin-card">
                      <div className="track-pin-icon" aria-hidden="true">
                        <span />
                      </div>
                      <div className="track-pin-copy">
                        <p className="track-kicker">Handover verification code</p>
                        <h2 className="track-card-title">
                          Present 4-digit PIN to courier
                        </h2>
                        <p>
                          The rider will ask for this code before handing over
                          the package.
                        </p>
                      </div>
                      <p className="track-pin-code">{pin}</p>
                    </section>
                  </div>

                  <div className="track-col-side">
                    <section className="track-card">
                      <div className="track-card-head">
                        <h2 className="track-card-title">Route & destination</h2>
                        <span className="track-ghost-pill">2 stops</span>
                      </div>
                      <ul className="track-route-list">
                        <li>
                          <span className="track-route-mark" aria-hidden="true">
                            <WarehouseIcon />
                          </span>
                          <div>
                            <p className="track-route-label">Origin facility</p>
                            <p className="track-route-value">{delivery.pickup}</p>
                            <p className="track-route-meta">
                              {delivery.senderName} · {formatFeedTime(delivery.createdAt)}
                            </p>
                          </div>
                        </li>
                        <li>
                          <span
                            className="track-route-mark is-end"
                            aria-hidden="true"
                          >
                            <PinMark />
                          </span>
                          <div>
                            <p className="track-route-label is-dropoff">
                              Final drop-off
                            </p>
                            <p className="track-route-value">{delivery.dropoff}</p>
                            <p className="track-route-meta">
                              {delivery.recipientName}
                            </p>
                          </div>
                        </li>
                      </ul>
                      {delivery.notes ? (
                        <div className="track-instructions">
                          <p className="track-route-label">Special instructions</p>
                          <p>{delivery.notes}</p>
                        </div>
                      ) : (
                        <div className="track-instructions">
                          <p className="track-route-label">Special instructions</p>
                          <p>Leave with recipient. Signature required on handover.</p>
                        </div>
                      )}
                    </section>

                    <section className="track-card">
                      <div className="track-card-head">
                        <h2 className="track-card-title">Parcel manifest</h2>
                        <span className="track-priority-pill">
                          {delivery.size === "large"
                            ? "Priority cargo"
                            : "Priority express"}
                        </span>
                      </div>
                      <dl className="track-manifest">
                        <div>
                          <dt>Package type</dt>
                          <dd>
                            {delivery.fragile ? "Fragile · " : ""}
                            {delivery.packageType}
                          </dd>
                        </div>
                        <div>
                          <dt>Gross weight</dt>
                          <dd>{packageWeight(delivery.size)}</dd>
                        </div>
                        <div>
                          <dt>Tracking ID</dt>
                          <dd>{delivery.trackingId}</dd>
                        </div>
                        <div>
                          <dt>Storage spec</dt>
                          <dd>{storageSpec(delivery)}</dd>
                        </div>
                      </dl>
                    </section>

                    <section className="track-card">
                      <h2 className="track-card-title">Payment & invoice</h2>
                      <dl className="track-invoice">
                        <div>
                          <dt>Fulfillment & handling</dt>
                          <dd>{formatGhs(fulfillmentFee)}</dd>
                        </div>
                        <div>
                          <dt>Priority dispatch</dt>
                          <dd>{formatGhs(dispatchFee)}</dd>
                        </div>
                        <div>
                          <dt>Tax</dt>
                          <dd>{formatGhs(taxFee)}</dd>
                        </div>
                        <div className="track-invoice-total">
                          <dt>Total paid</dt>
                          <dd>{formatGhs(delivery.fareGhs)}</dd>
                        </div>
                      </dl>
                      <p className="track-pay-method">
                        Paid by{" "}
                        {delivery.payer === "recipient" ? "recipient" : "sender"}
                        {delivery.estimatedValue
                          ? ` · declared value ${delivery.estimatedValue}`
                          : ""}
                      </p>
                      <div className="track-invoice-actions">
                        <button type="button" className="track-text-action">
                          Download invoice
                        </button>
                        <Link href="/request-delivery" className="track-text-action">
                          Need help?
                        </Link>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </PageGrid>
      </div>
    </div>
  )
}
