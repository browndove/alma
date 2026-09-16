import Link from "next/link"
import type { ReactNode } from "react"

import { ParticleGlobe } from "./particle-globe"
import { ParticleRing } from "./particle-ring"
import { PayoutCard } from "./payout-card"

type Intensity = "strong" | "soft" | "quiet"
type Flow = "bl-up" | "br-up" | "lr" | "tr-down"

function ArrowUpRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3" fill="none">
      <path
        d="M3.5 8.5 8.5 3.5M4.25 3.5h4.25v4.25"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ExpandCorners() {
  return (
    <svg aria-hidden="true" viewBox="0 0 14 14" className="size-3.5" fill="none">
      <path
        d="M2 5.5V2h3.5M12 5.5V2H8.5M2 8.5V12h3.5M12 8.5V12H8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Atmosphere({ intensity }: { intensity: Intensity }) {
  return (
    <div className="bento-atmosphere" aria-hidden="true">
      <div
        className={`bento-atmosphere-base bento-atmosphere-base-${intensity}`}
      />
      <div
        className={`bento-atmosphere-glow bento-atmosphere-glow-${intensity}`}
      />
    </div>
  )
}

function Particles({ count = 7 }: { count?: number }) {
  const spots = [
    { top: "52%", left: "16%", delay: "0s" },
    { top: "62%", left: "48%", delay: "1.1s", orange: true },
    { top: "70%", left: "28%", delay: "0.5s" },
    { top: "58%", left: "72%", delay: "1.8s" },
    { top: "78%", left: "58%", delay: "1.4s", orange: true },
    { top: "66%", left: "38%", delay: "2.2s" },
    { top: "74%", left: "82%", delay: "0.8s" },
    { top: "54%", left: "88%", delay: "1.6s" },
  ].slice(0, count)

  return (
    <div className="bento-particles" aria-hidden="true">
      {spots.map((spot, index) => (
        <span
          key={index}
          className={`bento-particle${spot.orange ? " bento-particle-orange" : ""}`}
          style={{
            top: spot.top,
            left: spot.left,
            animationDelay: spot.delay,
          }}
        />
      ))}
    </div>
  )
}

const ribbonPaths: Record<Flow, string[]> = {
  "bl-up": [
    "M-40 340 C80 300 160 250 260 210 C360 170 460 150 560 170 L560 420 L-40 420 Z",
    "M-40 360 C100 330 190 280 290 245 C390 210 480 195 560 210 L560 420 L-40 420 Z",
    "M-40 380 C120 360 210 320 310 290 C410 260 490 250 560 265 L560 420 L-40 420 Z",
    "M-40 395 C140 385 230 360 330 340 C430 320 500 310 560 320 L560 420 L-40 420 Z",
  ],
  "br-up": [
    "M560 340 C440 300 360 250 260 210 C160 170 60 150 -40 170 L-40 420 L560 420 Z",
    "M560 360 C420 330 330 280 230 245 C130 210 40 195 -40 210 L-40 420 L560 420 Z",
    "M560 380 C400 360 310 320 210 290 C110 260 30 250 -40 265 L-40 420 L560 420 Z",
    "M560 395 C380 385 290 360 190 340 C90 320 20 310 -40 320 L-40 420 L560 420 Z",
  ],
  lr: [
    "M-60 250 C80 230 180 255 280 250 C380 245 460 220 580 240 L580 420 L-60 420 Z",
    "M-60 280 C90 265 190 285 290 280 C390 275 470 255 580 275 L580 420 L-60 420 Z",
    "M-60 310 C100 300 200 315 300 310 C400 305 480 290 580 305 L580 420 L-60 420 Z",
    "M-60 340 C110 335 210 345 310 340 C410 335 490 325 580 335 L580 420 L-60 420 Z",
  ],
  "tr-down": [
    "M420 -20 C380 80 340 150 280 210 C200 290 100 340 -40 360 L-40 420 L560 420 L560 -20 Z",
    "M460 -20 C410 90 360 170 290 230 C210 300 110 350 -40 375 L-40 420 L560 420 L560 -20 Z",
    "M500 -20 C440 100 380 185 300 250 C220 315 120 360 -40 390 L-40 420 L560 420 L560 -20 Z",
  ],
}

function RibbonField({
  flow,
  intensity,
  id,
}: {
  flow: Flow
  intensity: Intensity
  id: string
}) {
  const paths = ribbonPaths[flow]
  const fills = [
    `url(#${id}-orange)`,
    `url(#${id}-peach)`,
    `url(#${id}-pink)`,
    `url(#${id}-lavender)`,
  ]
  const opacities =
    intensity === "strong"
      ? [0.88, 0.62, 0.4, 0.22]
      : intensity === "soft"
        ? [0.55, 0.4, 0.28, 0.16]
        : [0.28, 0.2, 0.14, 0.08]

  return (
    <div className={`bento-ribbon-field bento-flow-${flow}`} aria-hidden="true">
      <svg
        className="bento-ribbon-svg"
        viewBox="0 0 520 420"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id={`${id}-orange`} x1="0" y1="0" x2="1" y2="0.35">
            <stop offset="0%" stopColor="#FF5A00" />
            <stop offset="45%" stopColor="#FF8A3D" />
            <stop offset="100%" stopColor="#FFB58F" />
          </linearGradient>
          <linearGradient id={`${id}-peach`} x1="0" y1="0.1" x2="1" y2="0.5">
            <stop offset="0%" stopColor="#FFB58F" />
            <stop offset="55%" stopColor="#F7B6CF" />
            <stop offset="100%" stopColor="#F4C6E0" />
          </linearGradient>
          <linearGradient id={`${id}-pink`} x1="0" y1="0.2" x2="1" y2="0.7">
            <stop offset="0%" stopColor="#F7B6CF" />
            <stop offset="60%" stopColor="#F4C6E0" />
            <stop offset="100%" stopColor="#CDBBFF" />
          </linearGradient>
          <linearGradient id={`${id}-lavender`} x1="0" y1="0.4" x2="1" y2="1">
            <stop offset="0%" stopColor="#F4C6E0" />
            <stop offset="100%" stopColor="#CDBBFF" />
          </linearGradient>
          <linearGradient id={`${id}-highlight`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="40%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}-soft`} x="-10%" y="-20%" width="120%" height="140%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id={`${id}-edge`} x="-8%" y="-15%" width="116%" height="130%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {paths.map((d, index) => (
          <path
            key={index}
            d={d}
            fill={fills[index] ?? fills[fills.length - 1]}
            opacity={opacities[index] ?? 0.15}
            filter={
              index === 0 ? `url(#${id}-edge)` : `url(#${id}-soft)`
            }
          />
        ))}

        <path
          d={paths[0]}
          fill={`url(#${id}-highlight)`}
          opacity={intensity === "quiet" ? 0.12 : 0.28}
          filter={`url(#${id}-edge)`}
        />
      </svg>
    </div>
  )
}

function BentoCard({
  title,
  href,
  intensity,
  flow,
  className,
  children,
  particleCount = 6,
  id,
  action = "arrow",
  titleWide = false,
  bare = false,
}: {
  title: ReactNode
  href: string
  intensity: Intensity
  flow: Flow
  className: string
  children: ReactNode
  particleCount?: number
  id: string
  action?: "arrow" | "expand"
  titleWide?: boolean
  bare?: boolean
}) {
  return (
    <article className={`bento-card ${className}`}>
      {!bare && (
        <>
          <Atmosphere intensity={intensity} />
          <RibbonField id={id} flow={flow} intensity={intensity} />
          <Particles count={particleCount} />
        </>
      )}
      <div className="bento-noise" aria-hidden="true" />

      <div className="bento-card-header">
        <h3
          className={`bento-card-title${titleWide ? " bento-card-title-wide" : ""}`}
        >
          {title}
        </h3>
        <Link
          href={href}
          className={`bento-card-action${action === "expand" ? " bento-card-action-expand" : ""}`}
          aria-label={typeof title === "string" ? title : "Open feature"}
        >
          {action === "expand" ? <ExpandCorners /> : <ArrowUpRight />}
        </Link>
      </div>

      <div className="bento-visual">{children}</div>
    </article>
  )
}

/** Business delivery volume mock for the right lead card */
function BillingShowcase() {
  const bars = [
    28, 34, 30, 42, 38, 48, 44, 52, 40, 58, 46, 62, 55, 68, 50, 72, 60, 78, 66,
    84, 70, 88, 74, 92, 80, 96, 58, 70, 64, 76, 68, 82, 72, 86, 78, 90, 84, 94,
  ]

  return (
    <div className="bento-billing">
      <div className="bento-billing-stack">
        <div className="bento-billing-panel bento-billing-plan">
          <div className="bento-billing-plan-head">
            <span className="bento-billing-logo" aria-hidden="true">
              Q
            </span>
            <div>
              <div className="bento-billing-plan-name">Business Plan</div>
              <div className="bento-billing-plan-meta">Monthly deliveries</div>
            </div>
          </div>

          <div className="bento-billing-tokens">
            <div className="bento-billing-tokens-title">Included trips</div>
            <div className="bento-billing-tokens-rate">
              From GHS 12 per delivery
            </div>
          </div>

          <div className="bento-billing-meter">
            <div className="bento-billing-meter-label">
              <span className="bento-billing-meter-icon" aria-hidden="true" />
              Monthly volume
            </div>
            <div className="bento-billing-meter-track">
              <div className="bento-billing-meter-fill" />
            </div>
          </div>
        </div>

        <div className="bento-billing-panel bento-billing-usage">
          <div className="bento-billing-usage-label">
            Packages delivered in the last 30 days
          </div>
          <div className="bento-billing-usage-value">12,480</div>
          <div className="bento-billing-chart" aria-hidden="true">
            {bars.map((height, index) => (
              <span
                key={index}
                className="bento-billing-bar"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Delivery tracking mock — swap for video/image later via .bento-payments-media */
function PaymentsShowcase() {
  return (
    <div className="bento-payments">
      {/* Drop an <img> or <video> into .bento-payments-media to replace this mock */}
      <div className="bento-payments-media" aria-hidden="true">
        <div className="bento-pos">
          <div className="bento-pos-body">
            <div className="bento-pos-screen">
              <div className="bento-pos-contactless">
                <span />
                <span />
                <span />
              </div>
              <div className="bento-pos-brand">Diatel Express</div>
              <div className="bento-pos-amount">GHS 25</div>
              <div className="bento-pos-hint">Same-day pickup confirmed</div>
              <div className="bento-pos-lines">
                <div>
                  <span>Documents · Accra → Osu</span>
                  <span>GHS 25</span>
                </div>
                <div>
                  <span>Priority pickup</span>
                  <span>GHS 5</span>
                </div>
                <div>
                  <span>Service fee</span>
                  <span>GHS 2</span>
                </div>
                <div className="bento-pos-total">
                  <span>Total</span>
                  <span>GHS 32</span>
                </div>
              </div>
              <button type="button" className="bento-pos-cta" tabIndex={-1}>
                Track delivery
              </button>
            </div>
          </div>
          <div className="bento-pos-base" />
        </div>

        <div className="bento-checkout">
          <div className="bento-checkout-chrome">
            <span className="bento-checkout-lock" />
            <span className="bento-checkout-url">diatel.com/track</span>
          </div>
          <div className="bento-checkout-body">
            <div className="bento-checkout-main">
              <div className="bento-checkout-logo">DIATEL</div>
              <label className="bento-checkout-field">
                <span>Tracking ID</span>
                <span className="bento-checkout-input">DT-94821</span>
              </label>
              <div className="bento-checkout-wallets">
                <span className="bento-wallet-link">live</span>
                <span className="bento-wallet-apple"> route</span>
              </div>
              <div className="bento-checkout-methods">
                <div className="bento-method">
                  <span className="bento-radio" />
                  Standard
                </div>
                <div className="bento-method bento-method-active">
                  <span className="bento-radio bento-radio-on" />
                  <div>
                    <div>Same-day</div>
                    <p>Rider matched · ETA 28 minutes to drop-off.</p>
                  </div>
                </div>
                <div className="bento-method">
                  <span className="bento-radio" />
                  Scheduled
                </div>
                <div className="bento-method">
                  <span className="bento-radio" />
                  Express
                </div>
                <div className="bento-method">
                  <span className="bento-radio" />
                  Bulk order
                </div>
              </div>
              <button type="button" className="bento-checkout-cta" tabIndex={-1}>
                Track package
              </button>
            </div>
            <aside className="bento-checkout-summary">
              <div className="bento-summary-title">Delivery summary</div>
              <div className="bento-summary-product">
                <div className="bento-summary-thumb" />
                <div>
                  <div className="bento-summary-name">
                    Documents · Accra Mall → Oxford St, Osu
                  </div>
                  <div className="bento-summary-price">GHS 32</div>
                </div>
              </div>
              <div className="bento-summary-rows">
                <div>
                  <span>Base fare</span>
                  <span>GHS 25</span>
                </div>
                <div>
                  <span>Priority</span>
                  <span>GHS 5</span>
                </div>
                <div>
                  <span>Service fee</span>
                  <span>GHS 2</span>
                </div>
                <div className="bento-summary-total">
                  <span>Total</span>
                  <span>GHS 32</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BentoGrid() {
  return (
    <div className="bento-grid">
      <div className="bento-lead">
        <BentoCard
          id="payments"
          className="bento-card-send bento-card-payments"
          title={
            <>
              Ship packages across Accra—
              <br />
              same day or scheduled
            </>
          }
          href="/services"
          intensity="strong"
          flow="bl-up"
          particleCount={8}
          action="expand"
          titleWide
        >
          <PaymentsShowcase />
        </BentoCard>

        <BentoCard
          id="billing"
          className="bento-card-billing"
          title="Delivery plans for every business"
          href="/services"
          intensity="strong"
          flow="br-up"
          particleCount={6}
          action="expand"
        >
          <BillingShowcase />
        </BentoCard>
      </div>

      <BentoCard
        id="track"
        className="bento-card-track"
        title="Track every delivery"
        href="/services"
        intensity="strong"
        flow="bl-up"
        particleCount={8}
      >
        <div className="flex w-full flex-col items-center gap-3 pb-2">
          <div className="bento-track-line">
            <span className="bento-track-dot" />
            <span className="bento-track-dot bento-track-dot-end" />
          </div>
          <div className="flex w-full max-w-[280px] justify-between px-1 text-[11px] font-medium text-[#8898aa]">
            <span>Pickup</span>
            <span>Delivered</span>
          </div>
        </div>
      </BentoCard>

      <BentoCard
        id="speed"
        className="bento-card-speed"
        title="Minutes, not hours"
        href="/services"
        intensity="strong"
        flow="br-up"
        particleCount={6}
      >
        <div className="bento-metric">
          <span className="bento-metric-value">12m</span>
          <span className="bento-metric-label">avg. rider match</span>
        </div>
      </BentoCard>

      <BentoCard
        id="coverage"
        className="bento-card-coverage"
        title="Citywide coverage"
        href="/services"
        intensity="quiet"
        flow="lr"
        particleCount={4}
      >
        <div className="bento-panel">
          <div className="bento-panel-label">Live zones</div>
          <div className="bento-panel-value">Accra · Tema · East Legon</div>
        </div>
      </BentoCard>

      <BentoCard
        id="status"
        className="bento-card-status"
        title="Live status updates"
        href="/services"
        intensity="soft"
        flow="tr-down"
        particleCount={5}
      >
        <div className="bento-panel">
          <div className="bento-panel-label">Current</div>
          <div className="bento-panel-value">Rider en route</div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f4f1f2]">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#f7b6cf] to-[#ff6a24]" />
          </div>
        </div>
      </BentoCard>

      <div className="bento-trio">
        <BentoCard
          id="request"
          className="bento-card-request"
          title={
            <>
              Request pickup
              <br />
              in minutes
            </>
          }
          href="/request-delivery"
          intensity="soft"
          flow="bl-up"
          action="expand"
          bare
        >
          <ParticleRing />
        </BentoCard>

        <BentoCard
          id="payout"
          className="bento-card-payout"
          title={
            <>
              Riders you can
              <br />
              trust and track
            </>
          }
          href="/services"
          intensity="soft"
          flow="lr"
          bare
        >
          <PayoutCard />
        </BentoCard>

        <BentoCard
          id="network"
          className="bento-card-network"
          title={
            <>
              Every delivery
              <br />
              has a route
            </>
          }
          href="/services"
          intensity="quiet"
          flow="lr"
          bare
        >
          <ParticleGlobe />
        </BentoCard>
      </div>
    </div>
  )
}
