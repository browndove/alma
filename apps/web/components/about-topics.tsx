import Link from "next/link"

import { ChevronRight } from "@/components/about-icons"
import { GridRule } from "@/components/page-grid"

const features = [
  {
    id: "tracking",
    title: "Live tracking",
    body: "Share a tracking link so senders and recipients see every stop until drop-off.",
    href: "/about/tracking",
    link: "How tracking works",
  },
  {
    id: "sameday",
    title: "Same-day pickup",
    body: "Match a rider in minutes for documents, parcels, and food across Accra.",
    href: "/request-delivery",
    link: "Request a pickup",
  },
  {
    id: "business",
    title: "Business routes",
    body: "Schedule bulk pickups for shops, restaurants, clinics, and warehouses.",
    href: "/guide",
    link: "See how it works",
  },
  {
    id: "riders",
    title: "Verified riders",
    body: "Work with riders who know local routes and keep packages secure end to end.",
    href: "/about/riders",
    link: "Meet the riders",
  },
] as const

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2.6a4.4 4.4 0 0 1 4.4 4.4c0 3.2-4.4 10.4-4.4 10.4S5.6 10.2 5.6 7A4.4 4.4 0 0 1 10 2.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="7" r="1.6" fill="currentColor" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 6.2V10l2.6 1.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.2 16.5V8.4L10 4l6.8 4.4v8.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7.8 16.5v-5h4.4v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2.8 15.6 5v4.3c0 3.3-2.3 6.3-5.6 7.5-3.3-1.2-5.6-4.2-5.6-7.5V5L10 2.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m7.7 9.9 1.7 1.7 3.2-3.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const featureIcons = {
  tracking: <PinIcon />,
  sameday: <ClockIcon />,
  business: <BuildingIcon />,
  riders: <ShieldIcon />,
}

export function AboutMissionPage() {
  return (
    <section className="about-subpage">
      <div className="about-mission-grid">
        <div className="about-mission-copy">
          <span className="about-eyebrow">Mission</span>
          <h1 className="about-section-title">
            Make sending a package as simple as sending a message.
          </h1>
          <p className="about-section-body">
            Live tracking, verified riders, and coverage that keeps Ghana
            moving — whether it&apos;s one parcel across town or daily routes
            for your business.
          </p>
          <Link href="/request-delivery" className="about-hero-link">
            Request a delivery
            <ChevronRight />
          </Link>
        </div>
        <div className="about-stat-list">
          <div className="about-stat">
            <strong>1,284+</strong>
            <span>Deliveries completed today</span>
          </div>
          <div className="about-stat">
            <strong>28 min</strong>
            <span>Average same-day ETA in Accra</span>
          </div>
          <div className="about-stat">
            <strong>Citywide</strong>
            <span>Riders across Accra corridors</span>
          </div>
        </div>
      </div>

      <div className="about-point-grid">
        <article className="about-point">
          <h2>Speed</h2>
          <p>
            Match a rider in minutes and move documents, parcels, and food the
            same day — without a call center in the middle.
          </p>
        </article>
        <article className="about-point">
          <h2>Visibility</h2>
          <p>
            Every send gets a tracking link. Senders and recipients see pickup,
            en route, and drop-off as it happens.
          </p>
        </article>
        <article className="about-point">
          <h2>Trust</h2>
          <p>
            Verified riders, package chain of custody, and support when a
            delivery needs a human.
          </p>
        </article>
      </div>
    </section>
  )
}

export function AboutNetworkPage() {
  return (
    <section className="about-subpage">
      <div className="about-features-head">
        <span className="about-eyebrow">Network</span>
        <h1 className="about-features-title">
          What Diatel delivers out of the box
        </h1>
        <p className="about-section-body">
          Tracking, pickup, scheduled routes, and a verified rider network —
          the pieces senders and businesses actually use.
        </p>
      </div>
      <div className="about-features-grid">
        {features.map((feature) => (
          <article key={feature.id} className="about-feature">
            <span
              className={`about-feature-icon about-feature-icon-${feature.id}`}
              aria-hidden="true"
            >
              {featureIcons[feature.id]}
            </span>
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
            <Link href={feature.href} className="about-hero-link">
              {feature.link}
              <ChevronRight />
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

export function AboutTrackingPage() {
  return (
    <>
      <section className="about-hero about-subhero">
        <div className="about-hero-copy">
          <span className="about-eyebrow">Tracking</span>
          <h1 className="about-hero-title">See every stop until drop-off.</h1>
          <p className="about-hero-body">
            Share a tracking link the moment a rider is matched. Senders and
            recipients follow pickup, en route, and handover — with an ETA that
            updates as the city moves.
          </p>
          <div className="about-hero-actions">
            <Link href="/track" className="btn btn-primary about-hero-cta">
              Track a delivery
              <ChevronRight />
            </Link>
            <Link href="/request-delivery" className="about-hero-link">
              Request a delivery
              <ChevronRight />
            </Link>
          </div>
        </div>
        <div className="about-hero-mock">
          <img
            src="/services/service-tracking.jpg"
            alt="A recipient checking a delivery on her phone as the rider arrives"
            className="service-hero-photo"
          />
        </div>
      </section>

      <GridRule />

      <section className="about-subpage about-subpage-follow">
        <div className="about-point-grid">
          <article className="about-point">
            <h2>A link, not an app</h2>
            <p>
              Recipients open a tracking page in the browser. No download, no
              account — just the status of that package.
            </p>
          </article>
          <article className="about-point">
            <h2>Status that matches the street</h2>
            <p>
              Pickup, rider matched, en route, and delivered. The same stages
              your operations team sees on the Diatel dashboard.
            </p>
          </article>
          <article className="about-point">
            <h2>When something slips</h2>
            <p>
              Failed attempts and exceptions surface on the same page, so
              support is looking at the same picture as the sender.
            </p>
          </article>
        </div>
      </section>
    </>
  )
}

export function AboutRidersPage() {
  return (
    <section className="about-subpage">
      <div className="about-mission-grid">
        <div className="about-mission-copy">
          <span className="about-eyebrow">Riders</span>
          <h1 className="about-section-title">
            Verified riders who know the city.
          </h1>
          <p className="about-section-body">
            Diatel riders cover Accra&apos;s corridors every day — documents,
            parcels, and food — with local route knowledge and a standard for
            how packages are handled end to end.
          </p>
          <Link href="/contact" className="about-hero-link">
            Talk to us about riding
            <ChevronRight />
          </Link>
        </div>
        <div className="about-stat-list">
          <div className="about-stat">
            <strong>ID checked</strong>
            <span>Riders are verified before they take a job</span>
          </div>
          <div className="about-stat">
            <strong>Local routes</strong>
            <span>Coverage across Accra malls, markets, and offices</span>
          </div>
          <div className="about-stat">
            <strong>Accountable</strong>
            <span>Every handover is tied to a tracking ID</span>
          </div>
        </div>
      </div>

      <div className="about-point-grid">
        <article className="about-point">
          <h2>Matched in minutes</h2>
          <p>
            Same-day jobs go to nearby riders first, so pickup doesn&apos;t wait
            on a distant dispatch queue.
          </p>
        </article>
        <article className="about-point">
          <h2>One standard of care</h2>
          <p>
            Documents, retail parcels, and food all move with the same chain of
            custody — pickup photo, live status, confirmed drop-off.
          </p>
        </article>
        <article className="about-point">
          <h2>Built for shops too</h2>
          <p>
            Clinics, restaurants, and warehouses can run repeating routes with
            the same verified fleet.
          </p>
        </article>
      </div>
    </section>
  )
}

export function AboutSafetyPage() {
  return (
    <section className="about-subpage">
      <div className="about-mission-grid">
        <div className="about-mission-copy">
          <span className="about-eyebrow">Safety</span>
          <h1 className="about-section-title">
            Built to keep packages — and people — safe.
          </h1>
          <p className="about-section-body">
            Every delivery is identifiable, tracked, and supported. We verify
            riders, log handovers, and give senders a way through when a job
            does not go as planned.
          </p>
          <Link href="/contact" className="about-hero-link">
            Contact support
            <ChevronRight />
          </Link>
        </div>
        <div className="about-stat-list">
          <div className="about-stat">
            <strong>Verified</strong>
            <span>Rider identity checked before the first job</span>
          </div>
          <div className="about-stat">
            <strong>Traced</strong>
            <span>Pickup to drop-off sits on one tracking ID</span>
          </div>
          <div className="about-stat">
            <strong>Supported</strong>
            <span>Exceptions go to a human, not a dead-end status</span>
          </div>
        </div>
      </div>

      <div className="about-point-grid">
        <article className="about-point">
          <h2>Chain of custody</h2>
          <p>
            Packages are scanned into a job at pickup and closed at drop-off.
            If a stop is missed, the tracking page shows it.
          </p>
        </article>
        <article className="about-point">
          <h2>Safer handovers</h2>
          <p>
            Recipients can follow the rider in and confirm receipt. Senders
            see the same event without calling the shop.
          </p>
        </article>
        <article className="about-point">
          <h2>A path to help</h2>
          <p>
            Lost, delayed, or damaged — raise it against the tracking ID so
            operations can act on the live record.
          </p>
        </article>
      </div>
    </section>
  )
}
