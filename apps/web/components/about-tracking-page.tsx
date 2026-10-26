import Link from "next/link"

import { ChevronRight } from "@/components/about-icons"
import { GridRule } from "@/components/page-grid"
import { TOOKAN_TRACK_STEPS } from "@/lib/deliveries/tookan-status"

type StepId = (typeof TOOKAN_TRACK_STEPS)[number]["id"]

const stepDetail: Record<StepId, string> = {
  requested: "Your booking is in.",
  unassigned: "We're finding the nearest rider.",
  assigned: "A rider has been given the job.",
  accepted: "The rider confirmed and is getting ready.",
  to_pickup: "Heading to the pickup address.",
  at_pickup: "The rider is at the pickup.",
  picked_up: "Your package is with the rider.",
  delivering: "On the way to the drop-off.",
  at_dropoff: "The rider has arrived.",
  delivered: "Handed over with the PIN.",
}

const groups = [
  { title: "Finding a rider", from: 0, to: 4 },
  { title: "Pickup", from: 4, to: 7 },
  { title: "Delivery", from: 7, to: 10 },
] as const

const CURRENT_INDEX = TOOKAN_TRACK_STEPS.findIndex((step) => step.id === "delivering")

const exceptions = [
  {
    title: "Declined",
    body: "A rider turned the job down. Our team assigns it to another rider.",
  },
  {
    title: "Failed",
    body: "The rider couldn't complete the stop. The link shows it, and support follows up.",
  },
  {
    title: "Cancelled",
    body: "The job was stopped before delivery. The link shows when it happened.",
  },
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

function stateFor(index: number) {
  if (index < CURRENT_INDEX) return "done"
  if (index === CURRENT_INDEX) return "current"
  return "pending"
}

function PhoneMock() {
  const visible = TOOKAN_TRACK_STEPS.slice(4)

  return (
    <div className="about-hero-mock" aria-hidden="true">
      <div className="tk-phone">
        <span className="tk-phone-notch" />
        <div className="tk-phone-screen">
          <div className="tk-phone-url">diateldelivery.com/track</div>

          <div className="tk-phone-eta">
            <span>Arriving in</span>
            <strong>12 min</strong>
            <em>DT-94821 · Oxford Street, Osu</em>
          </div>

          <div className="tk-phone-bar">
            <span style={{ width: `${((CURRENT_INDEX + 0.5) / TOOKAN_TRACK_STEPS.length) * 100}%` }} />
          </div>

          <ol className="tk-phone-steps">
            {visible.map((step, offset) => {
              const index = offset + 4
              const state = stateFor(index)
              return (
                <li key={step.id} className={`tk-phone-step is-${state}`}>
                  <span className="tk-phone-dot">
                    {state === "done" ? <CheckGlyph /> : null}
                  </span>
                  <span>{step.label}</span>
                  {state === "current" ? <em>Now</em> : null}
                </li>
              )
            })}
          </ol>

          <div className="tk-phone-rider">
            <span className="tm-avatar">KA</span>
            <div>
              <strong>Kwame Asante</strong>
              <span>Express bike</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AboutTrackingPage() {
  return (
    <>
      <section className="about-hero ab-hero">
        <div className="about-hero-copy">
          <span className="about-eyebrow">Tracking</span>
          <h1 className="about-hero-title ab-hero-title">
            Know where it is. Every minute.
          </h1>
          <p className="about-hero-body">
            Every Diatel delivery comes with a live link. Open it in any
            browser to see the rider, the ETA, and exactly which stage your
            package is at.
          </p>

          <form action="/track" method="get" className="tk-form">
            <input
              name="id"
              className="tk-form-input"
              placeholder="Enter tracking ID, e.g. DT-94821"
              aria-label="Tracking ID"
              autoComplete="off"
              required
            />
            <button type="submit" className="btn btn-primary tk-form-btn">
              Track
              <ChevronRight />
            </button>
          </form>
        </div>

        <PhoneMock />
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="ab-section-head">
          <span className="about-eyebrow">Every stage</span>
          <h2 className="about-features-title">
            {TOOKAN_TRACK_STEPS.length} stages, straight from the rider&apos;s app
          </h2>
          <p className="about-section-body">
            Status updates come from the rider in real time — not from someone
            typing them in later.
          </p>
        </div>

        <div className="tk-groups">
          {groups.map((group) => (
            <div key={group.title} className="tk-group">
              <span className="tk-group-title">{group.title}</span>
              <ol className="tk-group-steps">
                {TOOKAN_TRACK_STEPS.slice(group.from, group.to).map((step, offset) => (
                  <li key={step.id} className="tk-group-step">
                    <span className="tk-group-num">
                      {String(group.from + offset + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>{step.label}</strong>
                      <span>{stepDetail[step.id]}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="sf-split tk-share">
          <div>
            <span className="about-eyebrow">A link, not an app</span>
            <h2 className="about-features-title">Share it like any message</h2>
            <p className="about-section-body">
              Send the link to your recipient on WhatsApp or SMS. They open it
              in the browser — no download, no account, no password.
            </p>
            <ul className="tk-points">
              <li>Works on any phone with a browser</li>
              <li>Sender and recipient see the same live status</li>
              <li>The four-digit PIN shows only on the tracking page</li>
            </ul>
          </div>

          <div className="tk-share-visual" aria-hidden="true">
            <div className="tk-chat">
              <div className="tk-chat-bubble">
                Your parcel is on the way.
                <span className="tk-chat-link">
                  <span className="tk-chat-link-favicon">
                    <img src="/diatel-logo.png" alt="" />
                  </span>
                  <span>
                    <strong>Track DT-94821</strong>
                    <em>diateldelivery.com/track?id=DT-94821</em>
                  </span>
                </span>
              </div>
              <div className="tk-chat-bubble is-reply">Thanks! I can see the rider</div>
            </div>
          </div>
        </div>
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="ab-section-head">
          <span className="about-eyebrow">When plans change</span>
          <h2 className="about-features-title">Exceptions show up too</h2>
          <p className="about-section-body">
            If something goes off-plan, the link says so — you&apos;re never
            left staring at a status that stopped moving.
          </p>
        </div>

        <div className="tk-exceptions">
          {exceptions.map((item) => (
            <article key={item.title} className="tk-exception">
              <span className="tk-exception-tag">{item.title}</span>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <GridRule />

      <section className="ab-cta">
        <div className="ab-cta-panel">
          <div>
            <h2 className="ab-cta-title">Have a tracking ID?</h2>
            <p className="ab-cta-body">See exactly where your package is right now.</p>
          </div>
          <div className="ab-cta-actions">
            <Link href="/track" className="btn btn-primary ab-cta-btn">
              Track a delivery
              <ChevronRight />
            </Link>
            <Link href="/request-delivery" className="ab-cta-link">
              Send a package
              <ChevronRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
