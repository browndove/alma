import Link from "next/link"

import { ChevronRight } from "@/components/about-icons"
import { GridRule } from "@/components/page-grid"
import { MIN_FARE_GHS } from "@/lib/deliveries/fare"

const services = [
  {
    href: "/services/same-day",
    label: "Same-day",
    summary: "A rider in minutes",
    image: "/services/service-same-day.jpg",
    bestFor: "Documents, parcels, and food",
    pickup: "Now, from the nearest rider",
    booking: "Request form",
  },
  {
    href: "/services/scheduled",
    label: "Scheduled",
    summary: "Pickup when you're ready",
    image: "/services/service-scheduled.jpg",
    bestFor: "Shops, clinics, and offices",
    pickup: "A window you choose",
    booking: "Request form",
  },
  {
    href: "/services/business",
    label: "Business",
    summary: "Daily routes for shops",
    image: "/services/service-business.jpg",
    bestFor: "Restaurants, retail, warehouses",
    pickup: "Repeating, on your cadence",
    booking: "Talk to us",
  },
  {
    href: "/services/bulk",
    label: "Bulk",
    summary: "Many orders, one pickup",
    image: "/services/service-bulk.jpg",
    bestFor: "Busy counters and online shops",
    pickup: "One stop for the batch",
    booking: "Talk to us",
  },
] as const

const included = [
  "A live tracking link for sender and recipient",
  "A fare you see before you confirm",
  "A verified, named rider",
  "Support that can look up any job by its tracking ID",
] as const

function formatGhs(value: number) {
  return `GHS ${Number.isInteger(value) ? value : value.toFixed(2)}`
}

export function ServicesPage() {
  return (
    <>
      <section className="about-hero sv-hero">
        <div className="about-hero-copy">
          <span className="about-eyebrow">Services</span>

          <h1 className="about-hero-title sv-hero-title">
            One rider network. Four ways to send.
          </h1>

          <p className="about-hero-body">
            A single parcel across town or the day&apos;s orders for your shop.
            Pick how the rider shows up — every job gets the same tracking
            and the same upfront fare.
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
              Set up business routes
              <ChevronRight />
            </Link>
          </div>
        </div>

        <figure className="sv-hero-figure">
          <img
            src="/services/service-overview.jpg"
            alt="A Diatel rider carrying a parcel past a market in Accra"
            className="sv-hero-photo"
          />
          <figcaption className="sv-hero-tag">
            <span>Fares from</span>
            <strong>{formatGhs(MIN_FARE_GHS)}</strong>
          </figcaption>
        </figure>
      </section>

      <GridRule />

      <section className="sv-sheet-section" aria-labelledby="sv-sheet-title">
        <div className="sv-sheet-head">
          <span className="about-eyebrow">Compare</span>
          <h2 id="sv-sheet-title" className="about-features-title">
            Pick by the job, not the jargon
          </h2>
        </div>

        <div className="sv-sheet" role="table" aria-label="Diatel services">
          <div className="sv-sheet-row sv-sheet-labels" role="row">
            <span role="columnheader">Service</span>
            <span role="columnheader">Best for</span>
            <span role="columnheader">Pickup</span>
            <span role="columnheader">Book via</span>
            <span role="columnheader" className="sr-only">
              Details
            </span>
          </div>

          {services.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="sv-sheet-row sv-sheet-item"
              role="row"
            >
              <span className="sv-sheet-service" role="cell">
                <img src={service.image} alt="" className="sv-sheet-thumb" />
                <span>
                  <strong>{service.label}</strong>
                  <em>{service.summary}</em>
                </span>
              </span>
              <span className="sv-sheet-cell" role="cell" data-label="Best for">
                {service.bestFor}
              </span>
              <span className="sv-sheet-cell" role="cell" data-label="Pickup">
                {service.pickup}
              </span>
              <span className="sv-sheet-cell" role="cell" data-label="Book via">
                {service.booking}
              </span>
              <span className="sv-sheet-go" role="cell" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>

        <div className="sv-included">
          <p className="sv-included-title">
            Included on every job
            <Link href="/services/tracking">See how tracking works</Link>
          </p>
          <ul>
            {included.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <GridRule />

      <section className="ab-cta">
        <div className="ab-cta-panel">
          <div>
            <h2 className="ab-cta-title">Know what you&apos;re sending?</h2>
            <p className="ab-cta-body">
              Add the pickup and drop-off — the fare shows up instantly.
            </p>
          </div>
          <div className="ab-cta-actions">
            <Link href="/request-delivery" className="btn btn-primary ab-cta-btn">
              Request a delivery
              <ChevronRight />
            </Link>
            <Link href="/guide" className="ab-cta-link">
              Help me choose
              <ChevronRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
