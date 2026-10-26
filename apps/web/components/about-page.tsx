import Link from "next/link"

import { GridRule } from "@/components/page-grid"
import { ChevronRight } from "@/components/about-icons"
import { AboutTrackingMock } from "@/components/about-tracking-mock"

const facts = [
  { value: "From GHS 20", label: "Distance-based fares, quoted before you book" },
  { value: "Same day", label: "Pickup and drop-off across Accra" },
  { value: "10 stages", label: "Live tracking from request to doorstep" },
  { value: "1 link", label: "Shared by sender and recipient" },
] as const

const journey = [
  {
    step: "01",
    title: "Request",
    body: "Add pickup, drop-off, and the package. You see the fare before you confirm.",
  },
  {
    step: "02",
    title: "Match",
    body: "A verified rider near the pickup accepts the job and heads over.",
  },
  {
    step: "03",
    title: "Pick up",
    body: "The rider collects the parcel and the tracking link starts moving.",
  },
  {
    step: "04",
    title: "Deliver",
    body: "The recipient confirms the handover with a four-digit code.",
  },
] as const

type TopicIcon = "mission" | "network" | "tracking" | "riders" | "safety"

const topics: {
  href: string
  label: string
  title: string
  body: string
  icon: TopicIcon
}[] = [
  {
    href: "/about/mission",
    label: "Mission",
    title: "Sending a package should feel like sending a message.",
    body: "Why we started Diatel and what we're building for senders across Ghana.",
    icon: "mission",
  },
  {
    href: "/about/network",
    label: "Network",
    title: "Coverage across Accra",
    body: "Same-day pickup, scheduled windows, and business routes.",
    icon: "network",
  },
  {
    href: "/about/tracking",
    label: "Tracking",
    title: "Every stop, in order",
    body: "One live link from rider assignment to drop-off.",
    icon: "tracking",
  },
  {
    href: "/about/riders",
    label: "Riders",
    title: "Riders who know the roads",
    body: "Verified, named riders who know local corridors.",
    icon: "riders",
  },
  {
    href: "/about/safety",
    label: "Safety",
    title: "Handled with care",
    body: "ID checks, chain of custody, and support when something goes wrong.",
    icon: "safety",
  },
]

function TopicGlyph({ icon }: { icon: TopicIcon }) {
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
    case "mission":
      return (
        <svg {...common}>
          <path d="M4 12.5 19.5 5l-4.2 14-3.6-5.4L4 12.5Z" />
          <path d="m11.7 13.6 3.1-3.1" />
        </svg>
      )
    case "network":
      return (
        <svg {...common}>
          <circle cx="6" cy="7" r="2.2" />
          <circle cx="18" cy="7" r="2.2" />
          <circle cx="12" cy="17.5" r="2.2" />
          <path d="M8.1 8.2 10.6 15.6M15.9 8.2l-2.5 7.4M8.2 7h7.6" />
        </svg>
      )
    case "tracking":
      return (
        <svg {...common}>
          <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0c0 5.4 6.5 11 6.5 11Z" />
          <circle cx="12" cy="10" r="2.3" />
        </svg>
      )
    case "riders":
      return (
        <svg {...common}>
          <circle cx="6" cy="16.5" r="3" />
          <circle cx="18" cy="16.5" r="3" />
          <path d="M6 16.5 9.5 9h5l3.5 7.5M9.5 9 12 16.5h-6M14 6h2.5" />
        </svg>
      )
    case "safety":
      return (
        <svg {...common}>
          <path d="M12 3.5 5 6.2v5.3c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6.2l-7-2.7Z" />
          <path d="m9.2 12.1 2 2 3.8-4" />
        </svg>
      )
  }
}

export function AboutPage() {
  return (
    <>
      <section className="about-hero ab-hero">
        <div className="about-hero-copy">
          <span className="about-eyebrow">About Diatel</span>

          <h1 className="about-hero-title ab-hero-title">
            Delivery built for how Accra moves.
          </h1>

          <p className="about-hero-body">
            Diatel picks up and drops off across the city for people, shops,
            restaurants, and clinics — with a fair price up front and a live
            link that follows every parcel to the door.
          </p>

          <div className="about-hero-actions">
            <Link
              href="/request-delivery"
              className="btn btn-primary about-hero-cta"
            >
              Request a delivery
              <ChevronRight />
            </Link>
            <Link href="/contact?topic=business" className="about-hero-link">
              Talk to us
              <ChevronRight />
            </Link>
          </div>
        </div>

        <AboutTrackingMock />
      </section>

      <GridRule />

      <section className="ab-facts" aria-label="Diatel at a glance">
        {facts.map((fact) => (
          <div key={fact.value} className="ab-fact">
            <strong>{fact.value}</strong>
            <span>{fact.label}</span>
          </div>
        ))}
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="ab-section-head">
          <span className="about-eyebrow">How it works</span>
          <h2 className="about-features-title">From request to doorstep</h2>
          <p className="about-section-body">
            Four moments, all visible on the same tracking link.
          </p>
        </div>

        <ol className="ab-journey">
          {journey.map((item) => (
            <li key={item.step} className="ab-journey-step">
              <span className="ab-journey-num">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="ab-section-head">
          <span className="about-eyebrow">Explore</span>
          <h2 className="about-features-title">Inside the network</h2>
          <p className="about-section-body">
            How we operate, who rides for us, and how we keep parcels safe.
          </p>
        </div>

        <div className="ab-bento">
          {topics.map((topic, index) => (
            <Link
              key={topic.href}
              href={topic.href}
              className={index === 0 ? "ab-card ab-card-feature" : "ab-card"}
            >
              <span className="ab-card-icon">
                <TopicGlyph icon={topic.icon} />
              </span>
              <span className="ab-card-label">{topic.label}</span>
              <h3 className="ab-card-title">{topic.title}</h3>
              <p className="ab-card-body">{topic.body}</p>
              <span className="ab-card-more">
                Learn more
                <ChevronRight />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <GridRule />

      <section className="ab-cta">
        <div className="ab-cta-panel">
          <div>
            <h2 className="ab-cta-title">Have something to send?</h2>
            <p className="ab-cta-body">
              Get a quote in seconds and a rider on the way.
            </p>
          </div>
          <div className="ab-cta-actions">
            <Link href="/request-delivery" className="btn btn-primary ab-cta-btn">
              Request a delivery
              <ChevronRight />
            </Link>
            <Link href="/track" className="ab-cta-link">
              Track a delivery
              <ChevronRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
