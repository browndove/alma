"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { GridRule, PageGrid } from "@/components/page-grid"
import { SiteHeader } from "@/components/site-header"

const STATUS_EVENTS = [
  {
    id: "placed",
    title: "Order placed",
    time: "Today · 2:14 PM",
    detail: "Delivery request received by Diatel",
    place: "Accra Mall, Tetteh Quarshie",
  },
  {
    id: "preparing",
    title: "Preparing pickup",
    time: "Today · 2:18 PM",
    detail: "Package confirmed and labeled for same-day",
    place: null,
  },
  {
    id: "confirmed",
    title: "Rider assigned",
    time: "Today · 2:22 PM",
    detail: "Kwame A. accepted the trip",
    place: null,
  },
  {
    id: "picked",
    title: "Picked up",
    time: "Today · 2:31 PM",
    detail: "Package collected from sender",
    place: "Accra Mall",
  },
] as const

const PROGRESS_STEPS = [
  { id: "packed", label: "Packed", done: true, current: false },
  { id: "hub", label: "At hub", done: true, current: true },
  { id: "transit", label: "In transit", done: false, current: false },
  { id: "delivered", label: "Delivered", done: false, current: false },
] as const

function BackIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d="M10 3.5 5.5 8 10 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d={dir === "left" ? "M10 3.5 5.5 8 10 12.5" : "M6 3.5 10.5 8 6 12.5"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" fill="none">
      <path
        d="M4.5 13.5 3 15.2V5.5A1.5 1.5 0 0 1 4.5 4h9A1.5 1.5 0 0 1 15 5.5v6A1.5 1.5 0 0 1 13.5 13H4.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 7.5h5M6.5 10h3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1.6 12.4 11.2H1.6L7 1.6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M7 5.4v2.6M7 9.8h.01"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 7.2V11M8 5.2h.01"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1.5a3 3 0 0 1 3 3c0 2.1-3 5.5-3 5.5S3 6.6 3 4.5a3 3 0 0 1 3-3Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="6" cy="4.5" r="1" fill="currentColor" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <rect
        x="5.5"
        y="5.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M3.5 10.5h-.5A1.5 1.5 0 0 1 1.5 9V3.5A1.5 1.5 0 0 1 3 2h5.5A1.5 1.5 0 0 1 10 3.5v.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StepIcon({ id }: { id: string }) {
  if (id === "packed") {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M4 7.5 10 4l6 3.5v7L10 18l-6-3.5v-7Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M4 7.5 10 11l6-3.5M10 11v7" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    )
  }
  if (id === "hub") {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M3.5 16V8.5L10 4l6.5 4.5V16"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M8 16v-5h4v5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    )
  }
  if (id === "transit") {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M3 12.5h8V7H3v5.5Zm8 0h3.2L16 10V7h-5v5.5Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <circle cx="6" cy="14.5" r="1.4" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="13.5" cy="14.5" r="1.4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 3.2a4 4 0 0 1 4 4c0 2.8-4 7.6-4 7.6S6 10 6 7.2a4 4 0 0 1 4-4Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="m8.2 7.4 1.3 1.3 2.4-2.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrackMap({ mapMode }: { mapMode: "map" | "satellite" }) {
  return (
    <div className={`track-map-art${mapMode === "satellite" ? " is-satellite" : ""}`}>
      <svg className="track-map-svg" viewBox="0 0 800 720" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="track-route" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fe5200" />
            <stop offset="100%" stopColor="#ff8a5b" />
          </linearGradient>
        </defs>
        <rect width="800" height="720" className="track-map-base" />
        {/* Roads */}
        <g className="track-map-roads">
          <path d="M0 180 H800" />
          <path d="M0 320 H800" />
          <path d="M0 470 H800" />
          <path d="M0 590 H800" />
          <path d="M140 0 V720" />
          <path d="M280 0 V720" />
          <path d="M430 0 V720" />
          <path d="M580 0 V720" />
          <path d="M720 0 V720" />
          <path d="M40 80 Q220 140 360 260 T720 520" />
          <path d="M100 640 Q300 500 520 420 T780 240" />
        </g>
        {/* Blocks */}
        <g className="track-map-blocks">
          <rect x="160" y="200" width="90" height="70" rx="4" />
          <rect x="300" y="210" width="70" height="55" rx="4" />
          <rect x="450" y="340" width="110" height="80" rx="4" />
          <rect x="600" y="250" width="80" height="60" rx="4" />
          <rect x="200" y="500" width="120" height="70" rx="4" />
          <rect x="500" y="520" width="90" height="65" rx="4" />
        </g>
        {/* Route */}
        <path
          id="track-rider-path"
          className="track-map-route"
          d="M190 250 C260 250 300 300 360 340 S480 420 560 400 S650 340 690 300"
          fill="none"
          stroke="url(#track-route)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle className="track-map-start" cx="190" cy="250" r="8" />
        <g className="track-map-rider-wrap">
          <circle className="track-map-rider" r="10" cx="0" cy="0">
            <animateMotion
              dur="14s"
              repeatCount="indefinite"
              rotate="auto"
              keyPoints="0;0.55;0.55;1"
              keyTimes="0;0.45;0.62;1"
              calcMode="spline"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
              path="M190 250 C260 250 300 300 360 340 S480 420 560 400 S650 340 690 300"
            />
          </circle>
        </g>
        <circle className="track-map-end" cx="690" cy="300" r="9" />
        <text className="track-map-label" x="160" y="228">
          Pickup
        </text>
        <text className="track-map-label" x="660" y="278">
          Drop-off
        </text>
      </svg>
    </div>
  )
}

export function TrackPage() {
  const [mapMode, setMapMode] = useState<"map" | "satellite">("map")
  const [copied, setCopied] = useState(false)
  const [showAllStatus, setShowAllStatus] = useState(false)
  const trackingId = "DT-94837"

  const events = useMemo(
    () => (showAllStatus ? STATUS_EVENTS : STATUS_EVENTS.slice(0, 4)),
    [showAllStatus]
  )

  async function copyId() {
    try {
      await navigator.clipboard.writeText(trackingId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="page-shell track-shell">
      <SiteHeader />

      <div className="relative">
        <PageGrid>
          <GridRule />

          <div className="track-page">
            <aside className="track-panel">
              <div className="track-panel-top">
                <div className="track-nav-row">
                  <Link
                    href="/request-delivery"
                    className="track-icon-btn"
                    aria-label="Back to request"
                  >
                    <BackIcon />
                  </Link>
                  <div className="track-nav-pair" aria-hidden="true">
                    <button type="button" className="track-icon-btn" tabIndex={-1}>
                      <Chevron dir="left" />
                    </button>
                    <button type="button" className="track-icon-btn" tabIndex={-1}>
                      <Chevron dir="right" />
                    </button>
                  </div>
                </div>

                <div className="track-heading-row">
                  <div className="track-id-wrap">
                    <h1 className="track-id">{trackingId}</h1>
                    <button
                      type="button"
                      className="track-copy"
                      onClick={copyId}
                      aria-label="Copy tracking ID"
                    >
                      <CopyIcon />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="track-badges">
                    <span className="track-badge track-badge-progress">
                      <span className="track-badge-dot" />
                      In Progress
                    </span>
                    <span className="track-badge track-badge-delay">
                      <WarnIcon />
                      Busy area
                    </span>
                  </div>
                </div>

                <p className="track-meta">
                  Pickup date Today ·{" "}
                  <button type="button" className="track-order-link">
                    Order ID ORD-12567
                  </button>
                </p>

                <div className="track-actions">
                  <button type="button" className="track-cancel">
                    Cancel delivery
                  </button>
                  <div className="track-actions-right">
                    <button
                      type="button"
                      className="track-icon-btn track-chat"
                      aria-label="Message rider"
                    >
                      <ChatIcon />
                    </button>
                    <button type="button" className="track-primary">
                      Notify recipient
                    </button>
                  </div>
                </div>
              </div>

              <div className="track-panel-scroll">
                <section className="track-route-card">
                  <div className="track-route-brand" aria-hidden="true">
                    DIATEL
                  </div>
                  <ul className="track-addresses">
                    <li>
                      <span className="track-address-dot" />
                      Accra Mall, Tetteh Quarshie
                    </li>
                    <li>
                      <span className="track-address-dot is-end" />
                      14 Oxford Street, Osu
                    </li>
                  </ul>

                  <div className="track-progress" aria-label="Delivery progress">
                    <div className="track-progress-line" aria-hidden="true">
                      <span className="track-progress-fill" />
                    </div>
                    {PROGRESS_STEPS.map((step) => (
                      <div
                        key={step.id}
                        className={`track-progress-step${step.done ? " is-done" : ""}${step.current ? " is-current" : ""}`}
                      >
                        <span className="track-progress-icon">
                          <StepIcon id={step.id} />
                        </span>
                        <span className="track-progress-label">{step.label}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <dl className="track-metrics">
                  <div>
                    <dt>Total time</dt>
                    <dd>42 min</dd>
                  </div>
                  <div>
                    <dt>Picked up</dt>
                    <dd>Today 2:31 PM</dd>
                  </div>
                  <div>
                    <dt>Expected arrival</dt>
                    <dd>Today 3:15 PM</dd>
                  </div>
                </dl>

                <div className="track-alert" role="status">
                  <InfoIcon />
                  <p>
                    <strong>High volume.</strong> Accra corridors are busy this
                    hour — your rider may take a few extra minutes.
                  </p>
                </div>

                <section className="track-status">
                  <h2 className="track-status-title">Shipment status</h2>
                  <ol className="track-timeline">
                    {events.map((event) => (
                      <li key={event.id} className="track-timeline-item">
                        <span className="track-timeline-dot" aria-hidden="true" />
                        <div className="track-timeline-body">
                          <div className="track-timeline-head">
                            <strong>{event.title}</strong>
                            <time>{event.time}</time>
                          </div>
                          <p>{event.detail}</p>
                          {event.place ? (
                            <p className="track-timeline-place">
                              <PinIcon />
                              {event.place}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                  <button
                    type="button"
                    className="track-view-more"
                    onClick={() => setShowAllStatus((v) => !v)}
                  >
                    {showAllStatus ? "View less" : "View more"}
                  </button>
                </section>
              </div>
            </aside>

            <section className="track-map" aria-label="Live map">
              <TrackMap mapMode={mapMode} />

              <div className="track-map-controls-left">
                <button type="button" className="track-map-ctrl" aria-label="Fullscreen">
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3 6V3h3M10 3h3v3M13 10v3h-3M6 13H3v-3"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button type="button" className="track-map-ctrl" aria-label="Zoom in">
                  +
                </button>
                <button type="button" className="track-map-ctrl" aria-label="Zoom out">
                  −
                </button>
              </div>

              <div className="track-map-toggles">
                <button
                  type="button"
                  className={`track-map-toggle${mapMode === "satellite" ? " is-active" : ""}`}
                  onClick={() => setMapMode("satellite")}
                >
                  Satellite View
                </button>
                <button
                  type="button"
                  className={`track-map-toggle${mapMode === "map" ? " is-active" : ""}`}
                  onClick={() => setMapMode("map")}
                >
                  Map View
                </button>
              </div>
            </section>
          </div>
        </PageGrid>
      </div>
    </div>
  )
}
