import Link from "next/link"

import { ChevronRight } from "@/components/about-icons"
import { GridRule } from "@/components/page-grid"

const checks = ["ID verified", "Phone verified", "Route briefing done"] as const

const corridors = ["East Legon", "Airport", "Osu", "Spintex", "Madina"] as const

const promises = [
  { title: "ID checked", body: "Every rider is verified before their first job." },
  { title: "Local routes", body: "Riders who know Accra's malls, markets, and offices." },
  { title: "Accountable", body: "Every handover is tied to a named rider and a tracking ID." },
] as const

type RiderIcon = "fast" | "care" | "shops"

const qualities: { icon: RiderIcon; title: string; body: string }[] = [
  {
    icon: "fast",
    title: "Matched in minutes",
    body: "Same-day jobs go to nearby riders first, so pickup doesn't wait on a distant dispatch queue.",
  },
  {
    icon: "care",
    title: "One standard of care",
    body: "Documents, parcels, and food move with the same chain of custody — logged pickup, live status, PIN handover.",
  },
  {
    icon: "shops",
    title: "Built for shops too",
    body: "Clinics, restaurants, and warehouses can run repeating routes with the same verified riders.",
  },
]

type VehicleIcon = "bike" | "box" | "van"

const vehicles: {
  icon: VehicleIcon
  name: string
  size: string
  examples: string
}[] = [
  {
    icon: "bike",
    name: "Express bike",
    size: "Small",
    examples: "Envelopes, documents, food, and small bags.",
  },
  {
    icon: "box",
    name: "Box bike",
    size: "Medium",
    examples: "Shopping bags, shoe boxes, and retail parcels.",
  },
  {
    icon: "van",
    name: "Cargo van",
    size: "Large",
    examples: "Bulky boxes, bulk orders, and multi-item drops.",
  },
]

const joinSteps = [
  { title: "Apply", body: "Tell us about you, your vehicle, and the areas you know." },
  { title: "Get verified", body: "We check your ID and phone, then walk you through how jobs work." },
  { title: "Take your first job", body: "Go online in the rider app and accept deliveries near you." },
] as const

const requirements = [
  "Valid Ghana Card or other government ID",
  "Your own motorbike, box bike, or van",
  "A smartphone with mobile data",
  "Good knowledge of Accra roads",
] as const

function QualityGlyph({ icon }: { icon: RiderIcon }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  }

  switch (icon) {
    case "fast":
      return (
        <svg {...common}>
          <circle cx="13" cy="13" r="7" />
          <path d="M13 9.5V13l2.4 1.5M3 9h3M2 13h3M3 17h3" />
        </svg>
      )
    case "care":
      return (
        <svg {...common}>
          <path d="M4 9.5 12 5l8 4.5v5L12 19l-8-4.5v-5Z" />
          <path d="M4 9.5 12 14l8-4.5M12 14v5" />
        </svg>
      )
    case "shops":
      return (
        <svg {...common}>
          <path d="M4.5 9.5V19h15V9.5M3.5 9.5l1.5-4.5h14l1.5 4.5" />
          <path d="M3.5 9.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5c0 1.4 1.1 2.5 2.5 2.5h2c1.4 0 2.5-1.1 2.5-2.5 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5M10 19v-4h4v4" />
        </svg>
      )
  }
}

function VehicleGlyph({ icon }: { icon: VehicleIcon }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  }

  switch (icon) {
    case "bike":
      return (
        <svg {...common}>
          <circle cx="5.5" cy="16.5" r="3" />
          <circle cx="18.5" cy="16.5" r="3" />
          <path d="M5.5 16.5 9 9.5h5l4.5 7M9 9.5l3 7h-6.5M13 6.5h3" />
        </svg>
      )
    case "box":
      return (
        <svg {...common}>
          <circle cx="5.5" cy="17" r="2.6" />
          <circle cx="18.5" cy="17" r="2.6" />
          <path d="M8.1 17h7.8M14 17l-2.5-5H7" />
          <rect x="13" y="6" width="7" height="6" rx="1" />
        </svg>
      )
    case "van":
      return (
        <svg {...common}>
          <path d="M2.5 16.5V7.5h11v9M13.5 10.5h4l3 3.5v2.5h-2" />
          <circle cx="6.5" cy="17" r="2" />
          <circle cx="16.5" cy="17" r="2" />
          <path d="M8.5 17h6" />
        </svg>
      )
  }
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RiderCard() {
  return (
    <div className="about-hero-mock" aria-hidden="true">
      <div className="rr-card">
        <div className="rr-card-top">
          <span className="rr-avatar">KA</span>
          <div className="rr-who">
            <strong>Kwame Asante</strong>
            <span>Diatel rider · Accra</span>
          </div>
          <span className="sf-log-badge">
            <CheckGlyph />
            Verified
          </span>
        </div>

        <div className="rr-meta">
          <div>
            <span>Vehicle</span>
            <strong>Express bike</strong>
          </div>
          <div>
            <span>Status</span>
            <strong className="rr-online">
              <span className="tm-live-dot" />
              Online
            </strong>
          </div>
        </div>

        <div className="rr-block">
          <span className="rr-block-title">Knows these corridors</span>
          <div className="rr-chips">
            {corridors.map((corridor) => (
              <span key={corridor} className="rr-chip">
                {corridor}
              </span>
            ))}
          </div>
        </div>

        <ul className="rr-checks">
          {checks.map((check) => (
            <li key={check}>
              <span className="rr-check-icon">
                <CheckGlyph />
              </span>
              {check}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function AboutRidersPage() {
  return (
    <>
      <section className="about-hero ab-hero">
        <div className="about-hero-copy">
          <span className="about-eyebrow">Riders</span>
          <h1 className="about-hero-title ab-hero-title">
            Riders who know every corridor.
          </h1>
          <p className="about-hero-body">
            Diatel riders move documents, parcels, and food across Accra every
            day — verified, named on every job, and trained to one standard of
            care.
          </p>
          <div className="about-hero-actions">
            <Link
              href="/contact?topic=riders"
              className="btn btn-primary about-hero-cta"
            >
              Become a rider
              <ChevronRight />
            </Link>
            <Link href="/request-delivery" className="about-hero-link">
              Request a delivery
              <ChevronRight />
            </Link>
          </div>
        </div>

        <RiderCard />
      </section>

      <GridRule />

      <section className="ab-facts sf-promises" aria-label="Our rider standards">
        {promises.map((promise) => (
          <div key={promise.title} className="ab-fact">
            <strong>{promise.title}</strong>
            <span>{promise.body}</span>
          </div>
        ))}
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="ab-section-head">
          <span className="about-eyebrow">On every job</span>
          <h2 className="about-features-title">What every rider brings</h2>
          <p className="about-section-body">
            The same habits whether it&apos;s a single envelope or a shop&apos;s
            daily route.
          </p>
        </div>

        <div className="sf-grid rr-grid-3">
          {qualities.map((item) => (
            <article key={item.title} className="sf-card">
              <span className="ab-card-icon">
                <QualityGlyph icon={item.icon} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="ab-section-head">
          <span className="about-eyebrow">Vehicles</span>
          <h2 className="about-features-title">The right ride for the parcel</h2>
          <p className="about-section-body">
            Pick a package size when you book and we match a vehicle that fits.
          </p>
        </div>

        <div className="rr-vehicles">
          {vehicles.map((vehicle) => (
            <article key={vehicle.name} className="rr-vehicle">
              <div className="rr-vehicle-art">
                <VehicleGlyph icon={vehicle.icon} />
              </div>
              <div className="rr-vehicle-copy">
                <div className="rr-vehicle-head">
                  <h3>{vehicle.name}</h3>
                  <span className="rr-size">{vehicle.size}</span>
                </div>
                <p>{vehicle.examples}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="sf-split">
          <div>
            <span className="about-eyebrow">Ride with Diatel</span>
            <h2 className="about-features-title">Earn on your own schedule</h2>
            <p className="about-section-body">
              Pick up jobs near you across Accra. Three steps to your first
              delivery.
            </p>

            <ol className="sf-steps">
              {joinSteps.map((step, index) => (
                <li key={step.title} className="sf-step">
                  <span className="sf-step-num">{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="sf-dont">
            <span className="sf-dont-kicker">What you need</span>
            <p className="sf-dont-lead">Before you apply, make sure you have:</p>
            <ul className="sf-dont-list">
              {requirements.map((item) => (
                <li key={item}>
                  <span className="sf-dont-icon rr-need-icon">
                    <CheckGlyph />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/contact?topic=riders" className="about-hero-link">
              Apply to ride
              <ChevronRight />
            </Link>
          </aside>
        </div>
      </section>

      <GridRule />

      <section className="ab-cta">
        <div className="ab-cta-panel">
          <div>
            <h2 className="ab-cta-title">Know Accra&apos;s roads?</h2>
            <p className="ab-cta-body">
              Join the riders keeping the city&apos;s parcels moving.
            </p>
          </div>
          <div className="ab-cta-actions">
            <Link href="/contact?topic=riders" className="btn btn-primary ab-cta-btn">
              Become a rider
              <ChevronRight />
            </Link>
            <Link href="/request-delivery" className="ab-cta-link">
              Request a delivery
              <ChevronRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
