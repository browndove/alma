import Link from "next/link"

import { ChevronRight } from "@/components/about-icons"
import { GridRule } from "@/components/page-grid"

const custodyLog = [
  {
    time: "10:31",
    title: "Rider verified",
    detail: "Kwame A. · ID checked · Express bike",
    state: "done",
  },
  {
    time: "10:42",
    title: "Pickup logged",
    detail: "Accra Mall · package tied to DT-94821",
    state: "done",
  },
  {
    time: "10:58",
    title: "Live location on",
    detail: "Sender and recipient see the same route",
    state: "current",
  },
  {
    time: "—",
    title: "Handover PIN",
    detail: "Recipient confirms with a four-digit code",
    state: "pending",
  },
] as const

const promises = [
  { title: "Verified riders", body: "Identity checked before the first job." },
  { title: "One tracking ID", body: "Pickup to drop-off sits on a single record." },
  { title: "A human when it slips", body: "Exceptions reach support, not a dead end." },
] as const

type SafeguardIcon = "id" | "chain" | "pin" | "support"

const safeguards: { icon: SafeguardIcon; title: string; body: string }[] = [
  {
    icon: "id",
    title: "Rider verification",
    body: "Every rider is identity-checked and named on the job, so you always know who has your parcel.",
  },
  {
    icon: "chain",
    title: "Chain of custody",
    body: "The package is logged into the job at pickup and closed at drop-off. A missed stop shows on the tracking page.",
  },
  {
    icon: "pin",
    title: "PIN handover",
    body: "The recipient reads out a four-digit code before the rider lets go. No code, no handover.",
  },
  {
    icon: "support",
    title: "Support on the record",
    body: "Report a problem against the tracking ID and our team acts on the live job, not a guess.",
  },
]

const helpSteps = [
  {
    title: "Open your tracking link",
    body: "See exactly where the job is and what the rider last reported.",
  },
  {
    title: "Raise it with the tracking ID",
    body: "Delayed, damaged, or missing — tell us the ID and what happened.",
  },
  {
    title: "We act on the live record",
    body: "Operations contacts the rider and keeps you updated until it's resolved.",
  },
] as const

const notCarried = [
  "Cash or high-value jewellery",
  "Weapons or ammunition",
  "Illegal or controlled substances",
  "Flammable or hazardous materials",
  "Live animals",
] as const

function SafeguardGlyph({ icon }: { icon: SafeguardIcon }) {
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
    case "id":
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
          <circle cx="9" cy="11" r="2" />
          <path d="M6.2 15.5c.6-1.4 1.6-2 2.8-2s2.2.6 2.8 2M14 10h3.5M14 13h2.5" />
        </svg>
      )
    case "chain":
      return (
        <svg {...common}>
          <path d="M10 14a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1 1" />
          <path d="M14 10a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1-1" />
        </svg>
      )
    case "pin":
      return (
        <svg {...common}>
          <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
          <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.2v2" />
        </svg>
      )
    case "support":
      return (
        <svg {...common}>
          <path d="M5 13v-1a7 7 0 0 1 14 0v1" />
          <rect x="3.5" y="13" width="4" height="5.5" rx="1.5" />
          <rect x="16.5" y="13" width="4" height="5.5" rx="1.5" />
          <path d="M18.5 18.5c0 1.4-1.6 2-4 2h-2" />
        </svg>
      )
  }
}

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

function CustodyCard() {
  return (
    <div className="about-hero-mock" aria-hidden="true">
      <div className="sf-log">
        <div className="sf-log-head">
          <div>
            <span className="sf-log-kicker">Chain of custody</span>
            <strong className="sf-log-id">DT-94821</strong>
          </div>
          <span className="sf-log-badge">
            <CheckGlyph />
            Protected
          </span>
        </div>

        <ol className="sf-log-list">
          {custodyLog.map((entry) => (
            <li key={entry.title} className={`sf-log-item is-${entry.state}`}>
              <span className="sf-log-dot">
                {entry.state === "done" ? <CheckGlyph /> : null}
              </span>
              <div className="sf-log-copy">
                <strong>{entry.title}</strong>
                <span>{entry.detail}</span>
              </div>
              <time className="sf-log-time">{entry.time}</time>
            </li>
          ))}
        </ol>

        <div className="sf-log-pin">
          <span>Recipient PIN</span>
          <span className="tm-pin-digits">
            {"••••".split("").map((digit, index) => (
              <span key={index}>{digit}</span>
            ))}
          </span>
        </div>
      </div>
    </div>
  )
}

export function AboutSafetyPage() {
  return (
    <>
      <section className="about-hero ab-hero">
        <div className="about-hero-copy">
          <span className="about-eyebrow">Safety</span>
          <h1 className="about-hero-title ab-hero-title">
            Every parcel accounted for, door to door.
          </h1>
          <p className="about-hero-body">
            Named riders, a logged handover at every step, and a real person
            when a delivery doesn&apos;t go to plan.
          </p>
          <div className="about-hero-actions">
            <Link
              href="/request-delivery"
              className="btn btn-primary about-hero-cta"
            >
              Request a delivery
              <ChevronRight />
            </Link>
            <Link href="/contact?topic=support" className="about-hero-link">
              Contact support
              <ChevronRight />
            </Link>
          </div>
        </div>

        <CustodyCard />
      </section>

      <GridRule />

      <section className="ab-facts sf-promises" aria-label="Our safety promises">
        {promises.map((promise) => (
          <div key={promise.title} className="ab-fact">
            <strong>{promise.title}</strong>
            <span>{promise.body}</span>
          </div>
        ))}
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="ab-section-head">
          <span className="about-eyebrow">Safeguards</span>
          <h2 className="about-features-title">How we protect a delivery</h2>
          <p className="about-section-body">
            Four checks run on every job, from the moment a rider accepts to
            the moment the recipient says the code.
          </p>
        </div>

        <div className="sf-grid">
          {safeguards.map((item) => (
            <article key={item.title} className="sf-card">
              <span className="ab-card-icon">
                <SafeguardGlyph icon={item.icon} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <GridRule />

      <section className="ab-section">
        <div className="sf-split">
          <div>
            <span className="about-eyebrow">When something goes wrong</span>
            <h2 className="about-features-title">Three steps to a fix</h2>
            <p className="about-section-body">
              Lost, late, or damaged — every issue is handled against the
              tracking ID, so support sees the same picture you do.
            </p>

            <ol className="sf-steps">
              {helpSteps.map((step, index) => (
                <li key={step.title} className="sf-step">
                  <span className="sf-step-num">{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="sf-dont">
            <span className="sf-dont-kicker">Items we don&apos;t carry</span>
            <p className="sf-dont-lead">
              To keep riders and recipients safe, these can&apos;t be booked:
            </p>
            <ul className="sf-dont-list">
              {notCarried.map((item) => (
                <li key={item}>
                  <span className="sf-dont-icon">
                    <CrossGlyph />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/contact?topic=support" className="about-hero-link">
              Not sure? Ask us first
              <ChevronRight />
            </Link>
          </aside>
        </div>
      </section>

      <GridRule />

      <section className="ab-cta">
        <div className="ab-cta-panel">
          <div>
            <h2 className="ab-cta-title">Something wrong with a delivery?</h2>
            <p className="ab-cta-body">
              Have your tracking ID ready and we&apos;ll take it from there.
            </p>
          </div>
          <div className="ab-cta-actions">
            <Link href="/contact?topic=support" className="btn btn-primary ab-cta-btn">
              Contact support
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
