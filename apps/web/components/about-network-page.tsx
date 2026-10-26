import Link from "next/link"

import { ChevronRight } from "@/components/about-icons"
import { GridRule } from "@/components/page-grid"
import {
  COVERAGE_AREAS,
  MIN_FARE_GHS,
  RATE_PER_KM_GHS,
  RATE_PER_MIN_GHS,
  quoteDeliveryFare,
} from "@/lib/deliveries/fare"

const MAP = {
  width: 520,
  height: 340,
  minLng: -0.47,
  maxLng: 0.05,
  minLat: 5.49,
  maxLat: 5.81,
}

function project(lat: number, lng: number) {
  const x = ((lng - MAP.minLng) / (MAP.maxLng - MAP.minLng)) * MAP.width
  const y = ((MAP.maxLat - lat) / (MAP.maxLat - MAP.minLat)) * MAP.height
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
}

const COAST: [number, number][] = [
  [-0.47, 5.5],
  [-0.42, 5.51],
  [-0.33, 5.52],
  [-0.25, 5.525],
  [-0.21, 5.528],
  [-0.175, 5.546],
  [-0.12, 5.57],
  [-0.067, 5.602],
  [0, 5.63],
  [0.05, 5.65],
]

const LABELS: Record<string, string> = {
  Kasoa: "Kasoa",
  Weija: "Weija",
  "Kwame Nkrumah Circle": "Circle",
  Osu: "Osu",
  "East Legon": "East Legon",
  Madina: "Madina",
  Adenta: "Adenta",
  Spintex: "Spintex",
  Tema: "Tema",
  "Airport Residential": "Airport",
  Amasaman: "Amasaman",
}

const services = [
  {
    href: "/services/same-day",
    name: "Same-day",
    body: "A nearby rider in minutes for documents, parcels, and food.",
  },
  {
    href: "/services/scheduled",
    name: "Scheduled",
    body: "Pick a pickup window that suits the shop, clinic, or office.",
  },
  {
    href: "/services/business",
    name: "Business routes",
    body: "Repeating pickups for restaurants, retail, and warehouses.",
  },
  {
    href: "/services/bulk",
    name: "Bulk",
    body: "Send a batch of orders in one request.",
  },
  {
    href: "/services/tracking",
    name: "Live tracking",
    body: "One link for sender and recipient on every job.",
  },
] as const

function CoverageMap() {
  const coastPoints = COAST.map(([lng, lat]) => project(lat, lng))
  const coastPath = coastPoints
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ")
  const seaPath = `${coastPath} L${MAP.width} ${MAP.height} L0 ${MAP.height} Z`

  const legon = COVERAGE_AREAS.find((item) => item.name === "East Legon")
  const osu = COVERAGE_AREAS.find((item) => item.name === "Osu")
  const from = legon ? project(legon.lat, legon.lng) : null
  const to = osu ? project(osu.lat, osu.lng) : null

  return (
    <div className="about-hero-mock" aria-hidden="true">
      <div className="nw-map-card">
        <div className="nw-map-head">
          <div>
            <span className="sf-log-kicker">Coverage</span>
            <strong>Greater Accra</strong>
          </div>
          <span className="nw-map-count">{COVERAGE_AREAS.length} areas</span>
        </div>

        <svg
          className="nw-map"
          viewBox={`0 0 ${MAP.width} ${MAP.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="nw-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fe5200" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#fe5200" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width={MAP.width} height={MAP.height} fill="#fbfaf8" />
          <ellipse cx="300" cy="190" rx="230" ry="150" fill="url(#nw-glow)" />
          <path d={seaPath} fill="#eaf2fb" />
          <path d={coastPath} fill="none" stroke="#cfdcea" strokeWidth="1.5" />
          <text x="40" y={MAP.height - 18} className="nw-map-sea">
            Gulf of Guinea
          </text>

          {from && to ? (
            <path
              d={`M${from.x} ${from.y} Q ${(from.x + to.x) / 2 + 40} ${(from.y + to.y) / 2} ${to.x} ${to.y}`}
              fill="none"
              stroke="#fe5200"
              strokeWidth="2.5"
              strokeDasharray="1 6"
              strokeLinecap="round"
            />
          ) : null}

          {COVERAGE_AREAS.map((item) => {
            const point = project(item.lat, item.lng)
            const label = LABELS[item.name]
            return (
              <g key={item.name}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={label ? 4.5 : 3}
                  fill={label ? "#fe5200" : "#0a2540"}
                  fillOpacity={label ? 1 : 0.35}
                />
                {label ? (
                  <text x={point.x + 8} y={point.y + 4} className="nw-map-label">
                    {label}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export function AboutNetworkPage() {
  const example = quoteDeliveryFare("Accra Mall", "Oxford Street, Osu", "small")
  const km = example.distanceKm ?? 0
  const kmCost = km * RATE_PER_KM_GHS
  const minCost = example.etaMinutes * RATE_PER_MIN_GHS

  const areaNames = [...COVERAGE_AREAS]
    .map((item) => item.name)
    .sort((a, b) => a.localeCompare(b))

  return (
    <>
      <section className="about-hero ab-hero">
        <div className="about-hero-copy">
          <span className="about-eyebrow">Network</span>
          <h1 className="about-hero-title ab-hero-title">
            From Kasoa to Tema, one network.
          </h1>
          <p className="about-hero-body">
            Same-day pickups, scheduled windows, and business routes across
            Greater Accra — priced by distance, never by guesswork.
          </p>
          <div className="about-hero-actions">
            <Link
              href="/request-delivery"
              className="btn btn-primary about-hero-cta"
            >
              Get a quote
              <ChevronRight />
            </Link>
            <Link href="/services" className="about-hero-link">
              All services
              <ChevronRight />
            </Link>
          </div>
        </div>

        <CoverageMap />
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="ab-section-head">
          <span className="about-eyebrow">Services</span>
          <h2 className="about-features-title">What runs on the network</h2>
          <p className="about-section-body">
            Every service uses the same riders, the same pricing, and the same
            tracking link.
          </p>
        </div>

        <div className="nw-services">
          {services.map((service, index) => (
            <Link key={service.href} href={service.href} className="nw-service">
              <span className="nw-service-num">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="nw-service-copy">
                <h3>{service.name}</h3>
                <p>{service.body}</p>
              </div>
              <span className="nw-service-arrow">
                <ChevronRight />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="sf-split">
          <div>
            <span className="about-eyebrow">Pricing</span>
            <h2 className="about-features-title">Priced by the trip, not the zone</h2>
            <p className="about-section-body">
              Every quote is distance plus time, with a floor of GHS{" "}
              {MIN_FARE_GHS}. Bigger packages add a small size charge. You see
              the full price before you book.
            </p>

            <div className="nw-formula">
              <span className="nw-formula-part">
                GHS {RATE_PER_KM_GHS.toFixed(2)}
                <small>per km</small>
              </span>
              <span className="nw-formula-op">+</span>
              <span className="nw-formula-part">
                GHS {RATE_PER_MIN_GHS.toFixed(2)}
                <small>per minute</small>
              </span>
              <span className="nw-formula-op">≥</span>
              <span className="nw-formula-part is-floor">
                GHS {MIN_FARE_GHS}
                <small>minimum</small>
              </span>
            </div>
          </div>

          <aside className="nw-receipt">
            <span className="sf-log-kicker">Example quote</span>
            <strong className="nw-receipt-route">Accra Mall → Osu</strong>
            <span className="nw-receipt-sub">Small package · same-day</span>

            <dl className="nw-receipt-lines">
              <div>
                <dt>Distance · {km.toFixed(1)} km</dt>
                <dd>GHS {kmCost.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Time · {example.etaMinutes} min</dt>
                <dd>GHS {minCost.toFixed(2)}</dd>
              </div>
              <div className="is-total">
                <dt>You pay</dt>
                <dd>GHS {example.fareGhs}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="ab-section-head">
          <span className="about-eyebrow">Where we go</span>
          <h2 className="about-features-title">Neighbourhoods we cover</h2>
          <p className="about-section-body">
            Not on the list? If it&apos;s in Greater Accra, drop a pin on the
            map when you book and we&apos;ll quote it.
          </p>
        </div>

        <ul className="nw-areas">
          {areaNames.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </section>

      <GridRule />

      <section className="ab-cta">
        <div className="ab-cta-panel">
          <div>
            <h2 className="ab-cta-title">See what your trip costs.</h2>
            <p className="ab-cta-body">
              Enter pickup and drop-off for an instant quote.
            </p>
          </div>
          <div className="ab-cta-actions">
            <Link href="/request-delivery" className="btn btn-primary ab-cta-btn">
              Get a quote
              <ChevronRight />
            </Link>
            <Link href="/contact?topic=business" className="ab-cta-link">
              Business routes
              <ChevronRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
