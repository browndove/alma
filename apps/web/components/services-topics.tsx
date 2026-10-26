import Link from "next/link"

import { ChevronRight } from "@/components/about-icons"
import { GridRule } from "@/components/page-grid"
import { MIN_FARE_GHS } from "@/lib/deliveries/fare"
import { TOOKAN_TRACK_STEP_COUNT } from "@/lib/deliveries/tookan-status"

type Spec = { label: string; value: string }

function ServiceHero({
  eyebrow,
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  image,
  imageAlt,
  specs,
}: {
  eyebrow: string
  title: string
  body: string
  primaryHref: string
  primaryLabel: string
  secondaryHref: string
  secondaryLabel: string
  image: string
  imageAlt: string
  specs: readonly Spec[]
}) {
  return (
    <>
    <section className="about-hero sv-hero">
      <div className="about-hero-copy">
        <Link href="/services" className="sv-crumb">
          Services <span aria-hidden="true">/</span> <b>{eyebrow}</b>
        </Link>
        <h1 className="about-hero-title sv-hero-title">{title}</h1>
        <p className="about-hero-body">{body}</p>
        <div className="about-hero-actions">
          <Link href={primaryHref} className="btn btn-primary about-hero-cta">
            {primaryLabel}
            <ChevronRight />
          </Link>
          <Link href={secondaryHref} className="about-hero-link">
            {secondaryLabel}
            <ChevronRight />
          </Link>
        </div>
      </div>
      <figure className="sv-hero-figure">
        <img src={image} alt={imageAlt} className="sv-hero-photo" />
      </figure>
    </section>

    <dl className="sv-specs">
      {specs.map((spec) => (
        <div key={spec.label} className="sv-spec">
          <dt>{spec.label}</dt>
          <dd>{spec.value}</dd>
        </div>
      ))}
    </dl>
    </>
  )
}

function Points({
  items,
}: {
  items: readonly { title: string; body: string }[]
}) {
  return (
    <section className="sv-points-section">
      <h2 className="sv-points-title">How it works</h2>
      <ol className="sv-points">
        {items.map((item, index) => (
          <li key={item.title} className="sv-point">
            <span className="sv-point-num">{String(index + 1).padStart(2, "0")}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function SameDayPage() {
  return (
    <>
      <ServiceHero
        eyebrow="Same-day"
        title="A rider in minutes, not a next-day promise."
        body="Documents, parcels, and food across Accra. Request pickup now and follow the job until it is in the right hands."
        primaryHref="/request-delivery"
        primaryLabel="Request a pickup"
        secondaryHref="/services/tracking"
        secondaryLabel="How tracking works"
        image="/services/service-same-day.jpg"
        imageAlt="A Diatel rider on a motorbike with a parcel, ready for a same-day pickup"
        specs={[
          { label: "Best for", value: "Documents, parcels, and food" },
          { label: "Pickup", value: "Now, from the nearest rider" },
          { label: "Book via", value: "Request form" },
          { label: "Fares", value: `From GHS ${MIN_FARE_GHS}` },
        ]}
      />
      <GridRule />
      <Points
        items={[
          {
            title: "Matched nearby",
            body: "Same-day jobs go to riders already on the corridor, so pickup does not wait on a distant queue.",
          },
          {
            title: "One parcel or a few",
            body: "Send a document across town or a small set of packages from the shop counter.",
          },
          {
            title: "Visible the whole way",
            body: "Senders and recipients share a tracking link from the moment a rider is matched.",
          },
        ]}
      />
    </>
  )
}

export function ScheduledPage() {
  return (
    <>
      <ServiceHero
        eyebrow="Scheduled"
        title="Pickup when the counter is ready."
        body="Choose a window instead of sending a rider right now. Useful for clinics, offices, and shops that batch orders through the day."
        primaryHref="/request-delivery"
        primaryLabel="Schedule a pickup"
        secondaryHref="/services/business"
        secondaryLabel="Business routes"
        image="/services/service-scheduled.jpg"
        imageAlt="A shopkeeper stacking parcels on the counter for a scheduled pickup"
        specs={[
          { label: "Best for", value: "Shops, clinics, and offices" },
          { label: "Pickup", value: "A window you choose" },
          { label: "Book via", value: "Request form" },
          { label: "Fares", value: `From GHS ${MIN_FARE_GHS}` },
        ]}
      />
      <GridRule />
      <Points
        items={[
          {
            title: "A window, not a guess",
            body: "Set the pickup time on the request so the rider arrives when the package is packed.",
          },
          {
            title: "Built into the same form",
            body: "Switch from “now” to “schedule” on the delivery request. No separate booking desk.",
          },
          {
            title: "Still tracked",
            body: "Once the rider is matched, the tracking link works the same as a same-day job.",
          },
        ]}
      />
    </>
  )
}

export function BulkPage() {
  return (
    <>
      <ServiceHero
        eyebrow="Bulk"
        title="A batch of orders, one pickup."
        body="When the counter has more than a single parcel, book the batch together. Same riders, same tracking, less back and forth."
        primaryHref="/contact"
        primaryLabel="Plan a bulk pickup"
        secondaryHref="/services/scheduled"
        secondaryLabel="Schedule a window"
        image="/services/service-bulk.jpg"
        imageAlt="A rider loading a batch of parcels for a bulk pickup"
        specs={[
          { label: "Best for", value: "Busy counters and online shops" },
          { label: "Pickup", value: "One stop for the batch" },
          { label: "Book via", value: "Talk to us" },
          { label: "Tracking", value: "A link per recipient" },
        ]}
      />
      <GridRule />
      <Points
        items={[
          {
            title: "Packed as a set",
            body: "Group orders that leave the same shop so a rider collects them in one stop.",
          },
          {
            title: "Still one ID each",
            body: "Recipients get their own tracking link. Your team can see the batch as separate jobs.",
          },
          {
            title: "For busy counters",
            body: "Markets, online shops, and warehouses that outgrow single-package requests.",
          },
        ]}
      />
    </>
  )
}

export function TrackingServicePage() {
  return (
    <>
      <ServiceHero
        eyebrow="Tracking"
        title="A link for every delivery."
        body="No app for the recipient. Share the tracking page and they see pickup, en route, and drop-off for that package."
        primaryHref="/track"
        primaryLabel="Track a delivery"
        secondaryHref="/about/tracking"
        secondaryLabel="How tracking works"
        image="/services/service-tracking.jpg"
        imageAlt="A recipient checking a delivery on her phone as the rider arrives"
        specs={[
          { label: "Included", value: "On every Diatel job" },
          { label: "Stages", value: `${TOOKAN_TRACK_STEP_COUNT}, request to delivered` },
          { label: "Recipient needs", value: "Just the link" },
          { label: "Opens on", value: "Any phone browser" },
        ]}
      />
      <GridRule />
      <Points
        items={[
          {
            title: "Opens in the browser",
            body: "Recipients follow the job from a link. Senders see the same stages on the tracking page.",
          },
          {
            title: "Stages you can trust",
            body: "Requested, rider matched, picked up, en route, delivered. Exceptions show on the same record.",
          },
          {
            title: "Tied to the job",
            body: "Support looks up the tracking ID, so a delayed or missed stop is not a blank ticket.",
          },
        ]}
      />
    </>
  )
}
