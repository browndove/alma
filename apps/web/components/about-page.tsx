import Link from "next/link"

import { GridRule, PageGrid } from "@/components/page-grid"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const subNav = [
  { href: "#overview", label: "Overview", active: true },
  { href: "#mission", label: "Mission" },
  { href: "#network", label: "Network" },
  { href: "#tracking", label: "Tracking" },
  { href: "#riders", label: "Riders" },
  { href: "#safety", label: "Safety" },
  { href: "#careers", label: "Careers" },
] as const

function ChevronRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className="size-3"
      fill="none"
    >
      <path
        d="M4.25 2.25 8.5 6 4.25 9.75"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AboutTrackingMock() {
  return (
    <div className="about-hero-mock" aria-hidden="true">
      <div className="about-mock-card">
        <div className="about-mock-package">
          <div className="about-mock-brand">
            <span className="about-mock-mark" />
            Diatel Express
          </div>
          <div className="about-mock-eta">28 min</div>
          <p className="about-mock-route">Accra Mall → Oxford Street, Osu</p>
          <div className="about-mock-box">
            <span className="about-mock-box-lid" />
            <span className="about-mock-box-body" />
            <span className="about-mock-box-tape" />
          </div>
          <div className="about-mock-status">
            <span className="about-mock-dot" />
            Rider en route · DT-94821
          </div>
          <div className="about-mock-footer">
            <span>Powered by Diatel</span>
            <span>Track</span>
            <span>Support</span>
          </div>
        </div>

        <div className="about-mock-form">
          <div className="about-mock-section-title">Delivery details</div>
          <label className="about-mock-field">
            <span>Tracking ID</span>
            <span className="about-mock-input">DT-94821</span>
          </label>
          <label className="about-mock-field">
            <span>Drop-off address</span>
            <span className="about-mock-input about-mock-input-select">
              Oxford Street, Osu
            </span>
          </label>

          <div className="about-mock-section-title">Service</div>
          <div className="about-mock-methods">
            <div className="about-mock-method">
              <span className="about-mock-radio" />
              Standard
            </div>
            <div className="about-mock-method is-active">
              <span className="about-mock-radio is-on" />
              <div>
                <strong>Same-day</strong>
                <p>Rider matched · live GPS until drop-off.</p>
              </div>
            </div>
            <div className="about-mock-method">
              <span className="about-mock-radio" />
              Scheduled
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AboutPage() {
  return (
    <div className="page-shell about-page relative min-h-svh bg-white">
      <SiteHeader />

      <div className="relative">
        <PageGrid>
          <GridRule />

          <div className="about-subnav" aria-label="About sections">
            <div className="about-subnav-inner">
              <span className="about-subnav-label">About</span>
              <nav className="about-subnav-links">
                {subNav.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={
                      item.active
                        ? "about-subnav-link is-active"
                        : "about-subnav-link"
                    }
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          <section id="overview" className="about-hero">
            <div className="about-hero-copy">
              <Link href="/guide" className="about-hero-pill">
                Delivery guide · Get matched in minutes
                <ChevronRight />
              </Link>

              <h1 className="about-hero-title">
                Reliable delivery built to move Ghana.
              </h1>

              <p className="about-hero-body">
                Pickup, track, and drop off across Accra and beyond with a
                logistics network built for people, shops, restaurants, and
                clinics — from same-day parcels to scheduled business routes.
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

            <AboutTrackingMock />

            <div className="about-hero-ribbon" aria-hidden="true">
              <span className="about-hero-ribbon-a" />
              <span className="about-hero-ribbon-b" />
              <span className="about-hero-ribbon-c" />
            </div>
          </section>

          <GridRule />

          <section id="mission" className="about-mission">
            <div className="about-mission-grid">
              <div>
                <h2 className="about-section-title">Our mission</h2>
                <p className="about-section-body">
                  Make sending a package as simple as sending a message —
                  with live tracking, verified riders, and coverage that
                  keeps Ghana moving.
                </p>
              </div>
              <div className="about-stat-list">
                <div className="about-stat">
                  <strong>1,284+</strong>
                  <span>Deliveries completed today</span>
                </div>
                <div className="about-stat">
                  <strong>28 min</strong>
                  <span>Average same-day ETA in Accra</span>
                </div>
                <div className="about-stat">
                  <strong>Citywide</strong>
                  <span>Riders across Accra corridors</span>
                </div>
              </div>
            </div>
          </section>

          <GridRule />

          <section id="network" className="about-features">
            <h2 className="about-features-title">
              What Diatel delivers out of the box
            </h2>
            <div className="about-features-grid">
              {[
                {
                  id: "tracking",
                  title: "Live tracking",
                  body: "Share a tracking link so senders and recipients see every stop until drop-off.",
                },
                {
                  id: "sameday",
                  title: "Same-day pickup",
                  body: "Match a rider in minutes for documents, parcels, and food across Accra.",
                },
                {
                  id: "business",
                  title: "Business routes",
                  body: "Schedule bulk pickups for shops, restaurants, clinics, and warehouses.",
                },
                {
                  id: "riders",
                  title: "Verified riders",
                  body: "Work with riders who know local routes and keep packages secure end to end.",
                },
              ].map((feature) => (
                <article key={feature.id} className="about-feature">
                  <span
                    className={`about-feature-icon about-feature-icon-${feature.id}`}
                    aria-hidden="true"
                  />
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>
          </section>

          <GridRule />

          <section id="careers" className="about-cta-band">
            <div>
              <h2 className="about-section-title">Join the network</h2>
              <p className="about-section-body">
                Become a rider or partner your business with Diatel — help
                Ghana ship faster, safer, and on time.
              </p>
            </div>
            <div className="about-cta-band-actions">
              <Link href="/contact" className="btn btn-primary">
                Become a rider
                <ChevronRight />
              </Link>
              <Link href="/contact" className="btn btn-secondary">
                Partner with us
              </Link>
            </div>
          </section>
        </PageGrid>
      </div>

      <SiteFooter />
    </div>
  )
}
