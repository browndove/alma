import Link from "next/link"

import { ChevronRight } from "@/components/about-icons"
import { GridRule } from "@/components/page-grid"

const BUSINESS_EMAIL = "hrdiateldelivery@gmail.com"

const weekdays = ["M", "T", "W", "T", "F", "S", "S"] as const
const activeDays = new Set([0, 1, 2, 3, 4, 5])

const tickets = [
  { time: "09:30", to: "East Legon", state: "Done" },
  { time: "12:15", to: "Airport", state: "Out" },
  { time: "15:00", to: "Cantonments", state: "Due" },
  { time: "17:40", to: "Labone", state: "Due" },
] as const

const truths = [
  { label: "Pickup", value: "On the times you set" },
  { label: "Riders", value: "Matched to your corridors" },
  { label: "Each stop", value: "Its own tracking link" },
  { label: "Set up", value: "By email, not a form" },
] as const

const comparison = [
  { label: "Booking", oneOff: "Every time you send", standing: "Once, then it repeats" },
  { label: "Pickup", oneOff: "When you tap request", standing: "At the windows you choose" },
  { label: "Who it's for", oneOff: "Anyone with a parcel", standing: "Shops that ship every day" },
  { label: "Tracking", oneOff: "One link for that job", standing: "A link for every stop" },
] as const

const trades = [
  {
    name: "Restaurants",
    line: "Kitchen orders to homes and offices.",
    need: "Pickups timed to the pass.",
    image: "/services/service-business.jpg",
  },
  {
    name: "Retail & shops",
    line: "Parcels from the counter to customers.",
    need: "A rider on the same corridor.",
    image: "/services/service-scheduled.jpg",
  },
  {
    name: "Clinics",
    line: "Prescriptions, samples, and papers.",
    need: "Handled with care, stop by stop.",
    image: "/services/service-tracking.jpg",
  },
  {
    name: "Warehouses",
    line: "Restocks and batches across Accra.",
    need: "Several drops from one pickup.",
    image: "/services/service-bulk.jpg",
  },
] as const

const brief = [
  "Where you pick up from",
  "The areas you deliver to",
  "Roughly how many orders a day",
  "The times you need a rider",
] as const

function ticketClass(state: (typeof tickets)[number]["state"]) {
  if (state === "Done") return "bz-ticket-state is-done"
  if (state === "Out") return "bz-ticket-state is-live"
  return "bz-ticket-state"
}

function RouteDocket() {
  return (
    <aside className="bz-docket" aria-label="Example of a standing daily route">
      <header className="bz-docket-head">
        <span className="bz-docket-stamp">Standing</span>
        <div>
          <p className="bz-docket-shop">Osu Kitchen</p>
          <p className="bz-docket-meta">Pickup · Oxford Street · Mon–Sat</p>
        </div>
      </header>

      <ol className="bz-docket-days" aria-label="Runs Monday to Saturday">
        {weekdays.map((day, index) => (
          <li
            key={`${day}-${index}`}
            className={activeDays.has(index) ? "is-on" : undefined}
          >
            {day}
          </li>
        ))}
      </ol>

      <ol className="bz-docket-tickets">
        {tickets.map((ticket) => (
          <li key={ticket.time}>
            <time>{ticket.time}</time>
            <span>
              Drop <b>{ticket.to}</b>
            </span>
            <em className={ticketClass(ticket.state)}>{ticket.state}</em>
          </li>
        ))}
      </ol>
    </aside>
  )
}

export function ServicesBusinessPage() {
  const mailHref = `mailto:${BUSINESS_EMAIL}?subject=${encodeURIComponent(
    "Standing route for my shop",
  )}`

  return (
    <>
      <section className="bz-hero">
        <div className="bz-hero-copy">
          <Link href="/services" className="sv-crumb">
            Services <span aria-hidden="true">/</span> <b>Business</b>
          </Link>

          <h1 className="bz-hero-title">
            A rider on your corridor, every working day.
          </h1>

          <p className="bz-hero-body">
            For restaurants, shops, clinics, and warehouses that ship on a
            rhythm. Tell us the pickups and the areas — we line up riders so
            you are not booking each order by hand.
          </p>

          <div className="about-hero-actions">
            <a href={mailHref} className="btn btn-primary about-hero-cta">
              Email the business team
              <ChevronRight />
            </a>
            <Link href="/contact?topic=business" className="about-hero-link">
              Use the contact form
              <ChevronRight />
            </Link>
          </div>
        </div>

        <div className="bz-hero-stage">
          <img
            src="/services/service-business.jpg"
            alt="A restaurant handing a food order to a Diatel rider"
            className="bz-hero-photo"
          />
          <RouteDocket />
        </div>
      </section>

      <ul className="bz-strip" aria-label="What a standing route includes">
        {truths.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>

      <GridRule />

      <section className="bz-compare" aria-labelledby="bz-compare-title">
        <div className="bz-compare-head">
          <p className="bz-kicker">How it differs</p>
          <h2 id="bz-compare-title">One-off jobs stay. Standing routes sit on top.</h2>
        </div>

        <div className="bz-ledger" role="table" aria-label="One-off delivery versus a standing route">
          <div className="bz-ledger-row bz-ledger-labels" role="row">
            <span role="columnheader" className="sr-only">
              Detail
            </span>
            <span role="columnheader">One-off</span>
            <span role="columnheader">Standing route</span>
          </div>
          {comparison.map((row) => (
            <div key={row.label} className="bz-ledger-row" role="row">
              <span className="bz-ledger-key" role="rowheader">
                {row.label}
              </span>
              <span role="cell">{row.oneOff}</span>
              <span className="bz-ledger-stand" role="cell">
                {row.standing}
              </span>
            </div>
          ))}
        </div>
      </section>

      <GridRule />

      <section className="bz-trades" aria-labelledby="bz-trades-title">
        <div className="bz-trades-head">
          <p className="bz-kicker">Who uses it</p>
          <h2 id="bz-trades-title">Built for counters that don&apos;t stop.</h2>
        </div>

        <ul className="bz-trade-grid">
          {trades.map((trade) => (
            <li key={trade.name} className="bz-trade">
              <img src={trade.image} alt="" />
              <div>
                <h3>{trade.name}</h3>
                <p>{trade.line}</p>
                <span>{trade.need}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <GridRule />

      <section className="bz-brief" aria-labelledby="bz-brief-title">
        <div className="bz-brief-copy">
          <p className="bz-kicker">Getting a route</p>
          <h2 id="bz-brief-title">Write us like you would a supplier.</h2>
          <p>
            No portal to learn. Send the four things below to{" "}
            <a href={mailHref}>{BUSINESS_EMAIL}</a> and we come back with a
            plan for the corridor.
          </p>
        </div>

        <ol className="bz-brief-list">
          {brief.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item}
            </li>
          ))}
        </ol>
      </section>

      <section className="bz-close">
        <div className="bz-close-panel">
          <p className="bz-close-kicker">Diatel for businesses</p>
          <h2>Tell us where you ship.</h2>
          <a href={mailHref} className="bz-close-email">
            {BUSINESS_EMAIL}
          </a>
          <div className="bz-close-actions">
            <a href={mailHref} className="btn btn-primary bz-close-btn">
              Open in your email
              <ChevronRight />
            </a>
            <Link href="/request-delivery" className="bz-close-link">
              Or send a one-off now
              <ChevronRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
