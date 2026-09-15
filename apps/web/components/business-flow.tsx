"use client"

import Link from "next/link"
import { RequestDeliveryWave } from "./request-delivery-wave"

export function BusinessFlowSection() {
  return (
    <section className="business-flow-section" aria-labelledby="business-flow-title">
      <RequestDeliveryWave fit="contain" />

      <div className="business-flow-guides" aria-hidden="true">
        <span className="business-flow-guide business-flow-guide-left" />
        <span className="business-flow-guide business-flow-guide-right" />
      </div>

      <div className="business-flow-inner">
        <div className="business-flow-header">
          <h2 id="business-flow-title" className="business-flow-title">
            Powering every delivery from request to doorstep.
          </h2>
          <p className="business-flow-support">
            From pickup to drop-off, Diatel keeps every step connected — matching
            you with a rider, tracking your package, and keeping you updated along
            the way.
          </p>
          <div className="business-flow-actions">
            <Link href="/request-delivery" className="business-flow-cta">
              Request a Delivery
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/how-it-works" className="business-flow-secondary">
              See how it works
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <p className="business-flow-aside">
          <span className="business-flow-aside-lead">Fast Delivery Services. </span>
          We bridge the gap between your business and existing delivery software.
          Our expert integration services ensure your customers receive their
          orders efficiently and your operations run smoothly.
        </p>
      </div>
    </section>
  )
}
