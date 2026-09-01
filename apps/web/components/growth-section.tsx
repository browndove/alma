"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useRef, useState } from "react"

type GrowthFeature = {
  id: string
  icon: "grid" | "people" | "chat"
  lead: string
  body: string
  href: string
  linkLabel: string
}

type ShowcaseCard = {
  id: string
  brand: string
  title: string
  imageSrc: string
  imageAlt: string
  href: string
}

const GROWTH_CARD_WIDTH = 331
const GROWTH_CARD_GAP = 16

const features: GrowthFeature[] = [
  {
    id: "onboarding",
    icon: "grid",
    lead: "Business onboarding.",
    body: "Get tailored guidance to set up deliveries, rider zones, and tracking for your team.",
    href: "/business",
    linkLabel: "View services",
  },
  {
    id: "partners",
    icon: "people",
    lead: "Partner network.",
    body: "Connect with verified riders and local logistics partners across Accra and beyond.",
    href: "/partners",
    linkLabel: "Meet partners",
  },
  {
    id: "support",
    icon: "chat",
    lead: "Dedicated support.",
    body: "Reach our team anytime for booking help, route issues, or account questions.",
    href: "/support",
    linkLabel: "Contact support",
  },
]

const showcaseCards: ShowcaseCard[] = [
  {
    id: "hearts",
    brand: "Lovable",
    title: "Lovable uses Diatel to ship creator merch across Accra.",
    imageSrc: "/growth/hearts.png",
    imageAlt: "Glowing neon heart petals on a dark background",
    href: "/stories/lovable",
  },
  {
    id: "illustration",
    brand: "Gamma",
    title: "Gamma keeps lunch rush orders moving with live rider updates.",
    imageSrc: "/growth/illustration.png",
    imageAlt: "Illustrated portrait with floating interface cards",
    href: "/stories/gamma",
  },
  {
    id: "river",
    brand: "Runway",
    title: "Runway delivers client samples the same day with Diatel.",
    imageSrc: "/growth/river.png",
    imageAlt: "White logo mark over flowing water",
    href: "/stories/runway",
  },
  {
    id: "lightning",
    brand: "Supabase",
    title: "Supabase sellers onboard faster with tracked Diatel deliveries.",
    imageSrc: "/growth/lightning.png",
    imageAlt: "Green lightning logo on a dark grid background",
    href: "/stories/supabase",
  },
  {
    id: "pause",
    brand: "Pause",
    title: "Pause shares live delivery updates with every customer order.",
    imageSrc: "/growth/pause.png",
    imageAlt: "Glass pause icon over purple and pink waves",
    href: "/stories/pause",
  },
  {
    id: "sphere",
    brand: "Sphere",
    title: "Sphere routes clinic samples with reliable same-day delivery.",
    imageSrc: "/growth/sphere.png",
    imageAlt: "Purple sphere with diagonal bands on a dark background",
    href: "/stories/sphere",
  },
  {
    id: "cube-b",
    brand: "Bold",
    title: "Bold brands keep pop-up drops moving on delivery day.",
    imageSrc: "/growth/cube-b.png",
    imageAlt: "Isometric cube with a B logo and hand gesture icon",
    href: "/stories/bold",
  },
  {
    id: "hex-s",
    brand: "Platform",
    title: "Platform partners scale seller deliveries across Ghana.",
    imageSrc: "/growth/hex-s.png",
    imageAlt: "White geometric S logo on a blue gradient background",
    href: "/stories/platform",
  },
]

const promoCards = [
  {
    id: "startups",
    lead: "Diatel Startups program.",
    body: "Access delivery credits, a focused seller community, and expert resources to help you grow your business.",
    href: "/startups",
    linkLabel: "Apply now",
    artClass: "growth-promo-art-purple",
  },
  {
    id: "launch",
    lead: "Diatel Launch.",
    body: "Set up seller deliveries, tracking links, and rider pickups in two business days.",
    href: "/launch",
    linkLabel: "Start your business",
    artClass: "growth-promo-art-amber",
  },
]

function GrowthPromoCards() {
  return (
    <div className="growth-promo-grid">
      {promoCards.map((card) => (
        <article key={card.id} className="growth-promo-card">
          <div className="growth-promo-copy">
            <p className="growth-promo-text">
              <strong>{card.lead}</strong> {card.body}
            </p>
            <Link href={card.href} className="growth-promo-link">
              {card.linkLabel}
              <span className="growth-promo-link-chevron" aria-hidden="true">
                {card.id === "launch" ? "›" : "→"}
              </span>
            </Link>
          </div>
          <div
            className={`growth-promo-art ${card.artClass}`}
            aria-hidden="true"
          />
        </article>
      ))}
    </div>
  )
}

function FeatureIcon({ type }: { type: GrowthFeature["icon"] }) {
  if (type === "grid") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <rect
          x="4"
          y="4"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="13"
          y="4"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="4"
          y="13"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="13"
          y="13"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    )
  }

  if (type === "people") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M16 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M14.5 19c0-2.2 1.6-4 3.5-4s3.5 1.8 3.5 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 8.5a7 7 0 0 1 14 0v.6c0 1.5-.6 2.9-1.6 3.9L14 17.5V19a2 2 0 0 1-4 0v-1.5l-3.4-3.4A5.5 5.5 0 0 1 5 9.1v-.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10 19h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChevronLink() {
  return (
    <span className="growth-link-chevron" aria-hidden="true">
      ›
    </span>
  )
}

function CarouselArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next"
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="growth-carousel-nav-btn"
      aria-label={direction === "prev" ? "Previous stories" : "Next stories"}
      onClick={onClick}
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
        {direction === "prev" ? (
          <path
            d="M10.25 3.75 5.75 8l4.5 4.25"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M5.75 3.75 10.25 8l-4.5 4.25"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  )
}

function GrowthShowcaseCarousel() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const scrollByCard = useCallback((direction: "prev" | "next") => {
    const track = trackRef.current
    if (!track) return

    const card = track.querySelector<HTMLElement>(".growth-carousel-item")
    const gap = GROWTH_CARD_GAP
    const distance = (card?.offsetWidth ?? GROWTH_CARD_WIDTH) + gap

    track.scrollBy({
      left: direction === "next" ? distance : -distance,
      behavior: "smooth",
    })
  }, [])

  function getItemClass(index: number) {
    if (hoveredIndex === null) return "growth-carousel-item"

    if (index === hoveredIndex) {
      return "growth-carousel-item is-hovered"
    }

    if (index === hoveredIndex - 1 || index === hoveredIndex + 1) {
      return "growth-carousel-item is-adjacent"
    }

    return "growth-carousel-item is-distant"
  }

  return (
    <div className="growth-carousel" aria-label="Customer stories">
      <div className="growth-carousel-toolbar">
        <div className="growth-carousel-nav" aria-hidden="true">
          <CarouselArrow direction="prev" onClick={() => scrollByCard("prev")} />
          <CarouselArrow direction="next" onClick={() => scrollByCard("next")} />
        </div>
      </div>

      <div
        ref={trackRef}
        className={`growth-carousel-track${
          hoveredIndex !== null ? " is-interacting" : ""
        }`}
      >
        {showcaseCards.map((card, index) => (
          <article
            key={card.id}
            className={getItemClass(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <Link href={card.href} className="growth-carousel-media">
              <Image
                src={card.imageSrc}
                alt={card.imageAlt}
                fill
                sizes="(max-width: 767px) calc(100vw - 64px), 331px"
                className="growth-carousel-image"
              />
              <span className="growth-carousel-brand">{card.brand}</span>
            </Link>

            <p className="growth-carousel-title">{card.title}</p>

            <Link href={card.href} className="growth-carousel-story-link">
              Read {card.brand}&apos;s story
              <span className="growth-carousel-story-chevron" aria-hidden="true">
                ›
              </span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}

export function GrowthSection() {
  return (
    <section className="growth-section" aria-labelledby="growth-experts-title">
      <div className="growth-experts">
        <h2 id="growth-experts-title" className="growth-experts-title">
          Realize value faster with dedicated experts
        </h2>

        <div className="growth-features">
          {features.map((feature) => (
            <div key={feature.id} className="growth-feature">
              <div className="growth-feature-icon">
                <FeatureIcon type={feature.icon} />
              </div>
              <p className="growth-feature-copy">
                <strong>{feature.lead}</strong> {feature.body}
              </p>
              <Link href={feature.href} className="growth-feature-link">
                {feature.linkLabel}
                <ChevronLink />
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="growth-divider" role="presentation" />

      <div className="growth-startup-split">
        <div className="growth-startup-left">
          <h3 className="growth-startup-heading">
            Build a foundation for your business that enables faster growth
          </h3>
          <Link href="/startups" className="growth-startup-cta">
            Diatel for startups
            <span className="enterprise-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="growth-startup-body">
          From Instagram sellers to restaurant chains and clinic networks, Diatel
          helps growing businesses ship faster on easy-to-use delivery
          infrastructure built for Ghana.
        </p>
      </div>

      <GrowthShowcaseCarousel />

      <GrowthPromoCards />
    </section>
  )
}
