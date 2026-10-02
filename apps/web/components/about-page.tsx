import Link from "next/link"

import { GridRule } from "@/components/page-grid"
import { ChevronRight } from "@/components/about-icons"
import { AboutTrackingMock } from "@/components/about-tracking-mock"

const topics = [
  {
    href: "/about/mission",
    label: "Mission",
    body: "Make sending a package as simple as sending a message.",
  },
  {
    href: "/about/network",
    label: "Network",
    body: "Same-day pickup, scheduled routes, and coverage across Accra.",
  },
  {
    href: "/about/tracking",
    label: "Tracking",
    body: "Share a live link so every stop is visible until drop-off.",
  },
  {
    href: "/about/riders",
    label: "Riders",
    body: "Verified riders who know local corridors and keep parcels secure.",
  },
  {
    href: "/about/safety",
    label: "Safety",
    body: "ID checks, chain of custody, and support when something goes wrong.",
  },
] as const

export function AboutPage() {
  return (
    <>
      <section className="about-hero">
        <div className="about-hero-copy">
          <Link href="/guide" className="about-hero-pill">
            Delivery guide · Get matched in minutes
            <ChevronRight />
          </Link>

          <h1 className="about-hero-title">
            Reliable delivery built to move Ghana.
          </h1>

          <p className="about-hero-body">
            Pickup, track, and drop off across Accra and beyond with a
            logistics network built for people, shops, restaurants, and
            clinics — from same-day parcels to scheduled business routes.
          </p>

          <div className="about-hero-actions">
            <Link
              href="/request-delivery"
              className="btn btn-primary about-hero-cta"
            >
              Request a delivery
              <ChevronRight />
            </Link>
            <Link href="/contact" className="about-hero-link">
              Talk to us
              <ChevronRight />
            </Link>
          </div>
        </div>

        <AboutTrackingMock />

        <div className="about-hero-ribbon" aria-hidden="true">
          <span className="about-hero-ribbon-a" />
          <span className="about-hero-ribbon-b" />
          <span className="about-hero-ribbon-c" />
        </div>
      </section>

      <GridRule />

      <section className="about-topics">
        <div className="about-features-head">
          <span className="about-eyebrow">About Diatel</span>
          <h2 className="about-features-title">Explore the network</h2>
          <p className="about-section-body">
            How we operate, who rides for us, and what senders can see from
            pickup to drop-off.
          </p>
        </div>
        <div className="about-topic-list">
          {topics.map((topic) => (
            <Link key={topic.href} href={topic.href} className="about-topic">
              <strong>{topic.label}</strong>
              <span>{topic.body}</span>
              <ChevronRight />
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
