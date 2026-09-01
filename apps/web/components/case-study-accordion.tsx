"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

const MOBILE_HEADER_HEIGHT = 56

type CaseStudyStat = {
  value: string
  label: string
}

type CaseStudy = {
  id: string
  logoLabel: string
  logoBg: string
  logoColor: string
  title: string
  storyHref: string
  imageSrc: string
  imageAlt: string
  stats: CaseStudyStat[]
  productsUsed?: string
}

const caseStudies: CaseStudy[] = [
  {
    id: "network",
    logoLabel: "D",
    logoBg: "#0f172a",
    logoColor: "#ffffff",
    title: "Diatel connects riders and customers across Accra in minutes.",
    storyHref: "/business",
    imageSrc: "/delivery-image.png",
    imageAlt: "Aerial view of deliveries moving across a city",
    stats: [
      { value: "4+", label: "delivery zones across Accra" },
      { value: "1,200+", label: "deliveries completed daily" },
    ],
    productsUsed:
      "Live tracking, SMS updates, business dashboards, and scheduled pickups",
  },
  {
    id: "restaurants",
    logoLabel: "RK",
    logoBg: "#14665e",
    logoColor: "#ffffff",
    title: "Restaurants keep lunch rush orders moving with Diatel.",
    storyHref: "/stories/restaurants",
    imageSrc: "/delivery-image.png",
    imageAlt: "Restaurant staff preparing orders for delivery",
    stats: [
      { value: "12 min", label: "average delivery time at peak" },
      { value: "3x", label: "more repeat orders with live updates" },
    ],
    productsUsed: "Request portal, live tracking, and customer SMS alerts",
  },
  {
    id: "sellers",
    logoLabel: "SG",
    logoBg: "#ff5a00",
    logoColor: "#ffffff",
    title: "Online sellers ship Instagram orders without leaving their inbox.",
    storyHref: "/stories/sellers",
    imageSrc: "/delivery-image.png",
    imageAlt: "Small business seller packing an online order",
    stats: [
      { value: "85%", label: "of orders booked in under two minutes" },
      { value: "24/7", label: "request window for sellers" },
    ],
    productsUsed:
      "Browser booking, shareable tracking links, and delivery history",
  },
  {
    id: "clinics",
    logoLabel: "MC",
    logoBg: "#4c1d95",
    logoColor: "#ffffff",
    title: "Clinics send samples and documents with reliable same-day delivery.",
    storyHref: "/stories/clinics",
    imageSrc: "/delivery-image.png",
    imageAlt: "Medical courier delivering a package",
    stats: [
      { value: "Same-day", label: "pickup to drop-off across town" },
      { value: "100%", label: "tracked from hub to recipient" },
    ],
    productsUsed: "Priority dispatch, proof of delivery, and route visibility",
  },
]

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="case-study-plus-icon">
      <path
        d="M6 2.25v7.5M2.25 6h7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CaseStudyLogo({
  label,
  bg,
  color,
}: {
  label: string
  bg: string
  color: string
}) {
  return (
    <span
      className="case-study-logo"
      style={{ backgroundColor: bg, color }}
      aria-hidden="true"
    >
      {label}
    </span>
  )
}

function CaseStudyHero({ study }: { study: CaseStudy }) {
  return (
    <div className="case-study-hero" aria-label={study.imageAlt}>
      <div className="enterprise-image-wash" aria-hidden="true" />
      <Image
        src={study.imageSrc}
        alt={study.imageAlt}
        fill
        sizes="(max-width: 767px) calc(100vw - 48px), min(1235px, calc(100vw - 48px))"
        className="enterprise-image"
      />
    </div>
  )
}

function CaseStudyStats({ study }: { study: CaseStudy }) {
  return (
    <div className="case-study-stats" role="list">
      {study.stats.map((stat) => (
        <div key={stat.label} className="case-study-stat" role="listitem">
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
      {study.productsUsed && (
        <div className="case-study-stat case-study-stat-wide" role="listitem">
          <strong>Products used</strong>
          <span>{study.productsUsed}</span>
        </div>
      )}
    </div>
  )
}

function CaseStudyReadLink({ study }: { study: CaseStudy }) {
  return (
    <Link href={study.storyHref} className="case-study-read-link">
      Read the story
      <span className="enterprise-arrow" aria-hidden="true">→</span>
    </Link>
  )
}

function CaseStudyMobileStack() {
  return (
    <div className="case-study-mobile-stack">
      {caseStudies.flatMap((study, index) => [
        <div
          key={`${study.id}-header`}
          className={`case-study-mobile-header${
            index > 0 ? " case-study-mobile-header-divided" : ""
          }`}
          style={{
            ["--case-study-stack-top" as string]: `${index * MOBILE_HEADER_HEIGHT}px`,
            zIndex: index + 10,
          }}
          id={`case-mobile-${study.id}`}
        >
          <CaseStudyLogo
            label={study.logoLabel}
            bg={study.logoBg}
            color={study.logoColor}
          />
          <p className="case-study-row-title">{study.title}</p>
        </div>,
        <article
          key={`${study.id}-body`}
          className="case-study-mobile-body"
          aria-labelledby={`case-mobile-${study.id}`}
        >
          <CaseStudyHero study={study} />
          <CaseStudyStats study={study} />
          <div className="case-study-mobile-cta">
            <CaseStudyReadLink study={study} />
          </div>
        </article>,
      ])}
    </div>
  )
}

function CaseStudyDesktopAccordion() {
  const [expandedId, setExpandedId] = useState<string | null>(
    caseStudies[0]?.id ?? null,
  )

  function expand(id: string) {
    setExpandedId(id)
  }

  return (
    <div className="case-study-list">
      {caseStudies.map((study) => {
        const isExpanded = study.id === expandedId

        return (
          <div key={study.id} className="case-study-list-item">
            {isExpanded ? (
              <article
                id={`case-panel-${study.id}`}
                className="case-study-expanded"
                aria-labelledby={`case-${study.id}`}
              >
                <div className="case-study-row case-study-row-expanded">
                  <CaseStudyLogo
                    label={study.logoLabel}
                    bg={study.logoBg}
                    color={study.logoColor}
                  />
                  <p id={`case-${study.id}`} className="case-study-row-title">
                    {study.title}
                  </p>
                  <CaseStudyReadLink study={study} />
                </div>

                <CaseStudyHero study={study} />
                <CaseStudyStats study={study} />
              </article>
            ) : (
              <div className="case-study-row">
                <CaseStudyLogo
                  label={study.logoLabel}
                  bg={study.logoBg}
                  color={study.logoColor}
                />
                <p className="case-study-row-title">{study.title}</p>
                <button
                  type="button"
                  className="case-study-expand-btn"
                  aria-expanded={false}
                  aria-controls={`case-panel-${study.id}`}
                  onClick={() => expand(study.id)}
                >
                  <span className="sr-only">Expand {study.title}</span>
                  <PlusIcon />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function CaseStudyAccordion() {
  return (
    <div className="case-study-accordion">
      <div className="case-study-desktop">
        <CaseStudyDesktopAccordion />
      </div>
      <CaseStudyMobileStack />
    </div>
  )
}
