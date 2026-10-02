import Link from "next/link"

import { ChevronRight } from "@/components/about-icons"
import { GridRule } from "@/components/page-grid"

function ServicePhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="about-hero-mock">
      <img src={src} alt={alt} className="service-hero-photo" />
    </div>
  )
}

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
}) {
  return (
    <section className="about-hero about-subhero">
      <div className="about-hero-copy">
        <span className="about-eyebrow">{eyebrow}</span>
        <h1 className="about-hero-title">{title}</h1>
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
      <ServicePhoto src={image} alt={imageAlt} />
    </section>
  )
}

function Points({
  items,
}: {
  items: readonly { title: string; body: string }[]
}) {
  return (
    <section className="about-subpage about-subpage-follow">
      <div className="about-point-grid">
        {items.map((item) => (
          <article key={item.title} className="about-point">
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
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

export function BusinessPage() {
  return (
    <>
      <ServiceHero
        eyebrow="Business"
        title="Daily routes for shops that ship every day."
        body="Restaurants, retail, clinics, and warehouses use the same rider network — with repeating pickups instead of one-off requests."
        primaryHref="/contact"
        primaryLabel="Talk to us"
        secondaryHref="/request-delivery"
        secondaryLabel="Request a delivery"
        image="/services/service-business.jpg"
        imageAlt="A restaurant handing a food order to a Diatel rider"
      />
      <GridRule />
      <Points
        items={[
          {
            title: "Shops and clinics",
            body: "Move prescriptions, retail parcels, and kitchen orders without standing up a fleet.",
          },
          {
            title: "Repeating coverage",
            body: "Tell us the corridors and the cadence. We match verified riders to those routes.",
          },
          {
            title: "One tracking record",
            body: "Each stop still has a tracking ID, so your team and the recipient see the same status.",
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
