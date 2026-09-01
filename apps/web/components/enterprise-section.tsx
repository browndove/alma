import Link from "next/link"

import { CaseStudyAccordion } from "@/components/case-study-accordion"

function ArrowRight() {
  return (
    <span className="enterprise-arrow" aria-hidden="true">
      →
    </span>
  )
}

export function EnterpriseSection() {
  return (
    <section className="enterprise-section" aria-labelledby="enterprise-intro">
      <h2 id="enterprise-intro" className="enterprise-intro">
        <span className="enterprise-intro-lead">
          Delivery that grows with your business.
        </span>
        <span className="enterprise-intro-support">
          From your first customer to your busiest days, Diatel keeps every
          delivery moving.
        </span>
      </h2>

      <div className="enterprise-divider" role="presentation" />

      <div className="enterprise-split">
        <div className="enterprise-split-left">
          <h3 className="enterprise-split-heading">
            Built for sellers who need things moving.
          </h3>
          <Link href="/request-delivery" className="enterprise-cta">
            Request a Delivery
            <ArrowRight />
          </Link>
        </div>
        <div className="enterprise-split-right">
          <p className="enterprise-split-body">
            From individual senders and online sellers to restaurants and
            growing businesses, Diatel makes it easy to request, track, and
            manage deliveries across Ghana.
          </p>
        </div>
      </div>

      <div className="enterprise-story">
        <div className="enterprise-story-copy">
          <p className="enterprise-story-label">Diatel Business</p>
          <p className="enterprise-story-title">
            From order to doorstep, without the hassle.
          </p>
        </div>
      </div>

      <CaseStudyAccordion />
    </section>
  )
}
