import Link from "next/link"

import { ChevronRight } from "@/components/about-icons"
import { GridRule } from "@/components/page-grid"

const thread = [
  { from: "you", text: "Can you take a parcel from Accra Mall to Osu?" },
  { from: "diatel", text: "Yes — GHS 25, rider there in about 10 min.", meta: "Quote" },
  { from: "you", text: "Book it, thanks." },
  { from: "diatel", text: "Kwame picked it up. Follow along live →", meta: "Picked up" },
  { from: "diatel", text: "Delivered to Kojo · PIN confirmed ✓", meta: "Delivered" },
] as const

const principles = [
  {
    number: "01",
    title: "Speed without the chase",
    body: "Book in a minute and a nearby rider is on the way. No calling around, no waiting on a dispatcher to pick up.",
  },
  {
    number: "02",
    title: "Everyone sees the same thing",
    body: "Sender, recipient, and our support team all look at one live tracking link — so nobody has to ask “where is it?”",
  },
  {
    number: "03",
    title: "Trust you can check",
    body: "Named riders, a logged pickup, and a PIN at the door. Every promise leaves a record you can see.",
  },
] as const

const before = [
  "Call three riders to find one who's free",
  "Haggle the price on the phone",
  "Call again to ask where the package is",
  "Hope it reached the right person",
] as const

const after = [
  "A nearby rider accepts in minutes",
  "A fair price shown before you book",
  "A live link that shows every stage",
  "A four-digit PIN confirms the handover",
] as const

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

function CrossGlyph() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="m3.5 3.5 5 5m0-5-5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MessageThread() {
  return (
    <div className="about-hero-mock" aria-hidden="true">
      <div className="ms-phone">
        <div className="ms-phone-head">
          <span className="ms-phone-avatar">
            <img src="/diatel-logo.png" alt="" />
          </span>
          <div>
            <strong>Diatel</strong>
            <span>Usually replies instantly</span>
          </div>
        </div>
        <ol className="ms-thread">
          {thread.map((message, index) => (
            <li key={index} className={`ms-bubble is-${message.from}`}>
              {"meta" in message ? (
                <span className="ms-bubble-meta">{message.meta}</span>
              ) : null}
              {message.text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export function AboutMissionPage() {
  return (
    <>
      <section className="about-hero ab-hero">
        <div className="about-hero-copy">
          <span className="about-eyebrow">Mission</span>
          <h1 className="about-hero-title ms-title">
            Sending a package should be as simple as sending a message.
          </h1>
          <p className="about-hero-body">
            That&apos;s the whole idea behind Diatel. Tell us where it&apos;s
            going, see the price, and follow it to the door — no phone calls,
            no guesswork.
          </p>
          <div className="about-hero-actions">
            <Link
              href="/request-delivery"
              className="btn btn-primary about-hero-cta"
            >
              Send a package
              <ChevronRight />
            </Link>
            <Link href="/about/riders" className="about-hero-link">
              Meet the riders
              <ChevronRight />
            </Link>
          </div>
        </div>

        <MessageThread />
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="ab-section-head">
          <span className="about-eyebrow">What we believe</span>
          <h2 className="about-features-title">Three ideas behind every delivery</h2>
        </div>

        <ol className="ms-principles">
          {principles.map((item) => (
            <li key={item.number} className="ms-principle">
              <span className="ms-principle-num">{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="ab-section-head">
          <span className="about-eyebrow">Why we exist</span>
          <h2 className="about-features-title">Delivery in Accra, before and after</h2>
          <p className="about-section-body">
            Sending something across the city used to mean a string of phone
            calls. We replaced each one with something you can see.
          </p>
        </div>

        <div className="ms-compare">
          <div className="ms-compare-col is-before">
            <span className="ms-compare-label">The old way</span>
            <ul>
              {before.map((item) => (
                <li key={item}>
                  <span className="ms-compare-icon">
                    <CrossGlyph />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="ms-compare-col is-after">
            <span className="ms-compare-label">With Diatel</span>
            <ul>
              {after.map((item) => (
                <li key={item}>
                  <span className="ms-compare-icon">
                    <CheckGlyph />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <GridRule />

      <section className="ms-quote-band">
        <blockquote className="ms-quote">
          <p>
            “We&apos;re building the delivery network Accra deserves — one where
            every parcel has a name, a price, and a place on the map.”
          </p>
          <footer>The Diatel team</footer>
        </blockquote>
      </section>

      <GridRule />

      <section className="ab-cta">
        <div className="ab-cta-panel">
          <div>
            <h2 className="ab-cta-title">Try it on your next send.</h2>
            <p className="ab-cta-body">
              One parcel or a whole day&apos;s orders — it takes about a minute.
            </p>
          </div>
          <div className="ab-cta-actions">
            <Link href="/request-delivery" className="btn btn-primary ab-cta-btn">
              Request a delivery
              <ChevronRight />
            </Link>
            <Link href="/contact?topic=business" className="ab-cta-link">
              Talk to us
              <ChevronRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
