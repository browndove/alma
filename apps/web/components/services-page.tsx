import Link from "next/link"

import { ChevronRight } from "@/components/about-icons"
import { GridRule } from "@/components/page-grid"

const topics = [
  {
    href: "/services/same-day",
    label: "Same-day",
    body: "Match a rider in minutes for documents, parcels, and food across Accra.",
  },
  {
    href: "/services/scheduled",
    label: "Scheduled",
    body: "Pick a window so pickup lands when the shop, clinic, or office is ready.",
  },
  {
    href: "/services/business",
    label: "Business",
    body: "Repeating routes for restaurants, retail, clinics, and warehouses.",
  },
  {
    href: "/services/bulk",
    label: "Bulk",
    body: "Move a batch of orders in one request instead of booking them one by one.",
  },
  {
    href: "/services/tracking",
    label: "Tracking",
    body: "Share a link so senders and recipients see every stop until drop-off.",
  },
] as const

export function ServicesPage() {
  return (
    <>
      <section className="about-hero about-subhero">
        <div className="about-hero-copy">
          <Link href="/guide" className="about-hero-pill">
            Delivery guide · Find the right option
            <ChevronRight />
          </Link>

          <h1 className="about-hero-title">
            Delivery that scales with you.
          </h1>

          <p className="about-hero-body">
            One parcel across town or the day&apos;s orders for your shop.
            Same-day pickup, scheduled windows, and business routes — with
            tracking on every job.
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

        <div className="about-hero-mock">
          <img
            src="/services/service-overview.jpg"
            alt="A Diatel rider carrying a parcel past a market in Accra"
            className="service-hero-photo"
          />
        </div>
      </section>

      <GridRule />

      <section className="about-topics">
        <div className="about-features-head">
          <span className="about-eyebrow">Services</span>
          <h2 className="about-features-title">What you can book</h2>
          <p className="about-section-body">
            Pick the service that matches the job — then request it from the
            same form.
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
