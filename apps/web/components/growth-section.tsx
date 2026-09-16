"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

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
  overlayLabel?: string
}

const GROWTH_CARD_WIDTH = 331
const GROWTH_CARD_GAP = 16

const features: GrowthFeature[] = [
  {
    id: "onboarding",
    icon: "grid",
    lead: "Business delivery setup.",
    body: "Get help launching same-day routes, bulk pickups, and tracked deliveries for your shop or restaurant.",
    href: "/business",
    linkLabel: "View services",
  },
  {
    id: "partners",
    icon: "people",
    lead: "Trusted rider network.",
    body: "Work with verified Diatel riders who know Accra routes and keep packages moving end to end.",
    href: "/partners",
    linkLabel: "Meet riders",
  },
  {
    id: "support",
    icon: "chat",
    lead: "Delivery support.",
    body: "Get help with tracking issues, failed attempts, and day-to-day questions with plans that fit your volume.",
    href: "/support",
    linkLabel: "View plans",
  },
]

const showcaseCards: ShowcaseCard[] = [
  {
    id: "hearts",
    brand: "City Merch",
    title: "City Merch ships creator drops across Accra with Diatel.",
    imageSrc: "/growth/hearts.png",
    imageAlt: "Glowing neon heart petals on a dark background",
    href: "/stories/city-merch",
    overlayLabel: "Reliable",
  },
  {
    id: "illustration",
    brand: "Chop House",
    title: "Chop House keeps lunch rush orders moving with live rider updates.",
    imageSrc: "/growth/illustration.png",
    imageAlt: "Illustrated portrait with floating interface cards",
    href: "/stories/chop-house",
    overlayLabel: "Fast",
  },
  {
    id: "river",
    brand: "Studio North",
    title: "Studio North delivers client samples the same day with Diatel.",
    imageSrc: "/growth/river.png",
    imageAlt: "White logo mark over flowing water",
    href: "/stories/studio-north",
    overlayLabel: "Same-day",
  },
  {
    id: "lightning",
    brand: "MarketLane",
    title: "MarketLane sellers go live faster with tracked Diatel deliveries.",
    imageSrc: "/growth/lightning.png",
    imageAlt: "Green lightning logo on a dark grid background",
    href: "/stories/marketlane",
    overlayLabel: "Express",
  },
  {
    id: "pause",
    brand: "PharmaLink",
    title: "PharmaLink shares live delivery updates with every customer order.",
    imageSrc: "/growth/pause.png",
    imageAlt: "Glass pause icon over purple and pink waves",
    href: "/stories/pharmalink",
    overlayLabel: "Tracked",
  },
  {
    id: "sphere",
    brand: "ClinicLink",
    title: "ClinicLink routes lab samples with on-time same-day delivery.",
    imageSrc: "/growth/sphere.png",
    imageAlt: "Purple sphere with diagonal bands on a dark background",
    href: "/stories/cliniclink",
    overlayLabel: "On-time",
  },
  {
    id: "cube-b",
    brand: "Pop Drop",
    title: "Pop Drop keeps event packages moving on delivery day.",
    imageSrc: "/growth/cube-b.png",
    imageAlt: "Isometric cube with a B logo and hand gesture icon",
    href: "/stories/pop-drop",
    overlayLabel: "Secure",
  },
  {
    id: "hex-s",
    brand: "Seller Hub",
    title: "Seller Hub partners scale deliveries across Ghana with Diatel.",
    imageSrc: "/growth/hex-s.png",
    imageAlt: "White geometric S logo on a blue gradient background",
    href: "/stories/seller-hub",
    overlayLabel: "Nationwide",
  },
]

const promoCards = [
  {
    id: "startups",
    lead: "Diatel for growing shops.",
    body: "Get delivery credits, rider priority, and setup help so your first orders arrive on time.",
    href: "/startups",
    linkLabel: "Apply now",
    artClass: "growth-promo-art-purple",
  },
  {
    id: "launch",
    lead: "Business launch.",
    body: "Go live with pickups, tracking links, and same-day drop-offs in two business days.",
    href: "/launch",
    linkLabel: "Start shipping",
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
        d="M12 20.5c4.14 0 7.5-2.91 7.5-6.5S16.14 7.5 12 7.5 4.5 10.41 4.5 14c0 1.35.43 2.6 1.17 3.65L4.5 20.5l3.85-.92"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11v2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15.25" r="0.75" fill="currentColor" />
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
  const [frontIndex, setFrontIndex] = useState(0)

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

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let frame = 0

    const updateFront = () => {
      const items = track.querySelectorAll<HTMLElement>(".growth-carousel-item")
      if (!items.length) return

      const center = track.scrollLeft + track.clientWidth / 2
      let best = 0
      let bestDist = Number.POSITIVE_INFINITY

      items.forEach((item, index) => {
        const mid = item.offsetLeft + item.offsetWidth / 2
        const dist = Math.abs(mid - center)
        if (dist < bestDist) {
          bestDist = dist
          best = index
        }
      })

      setFrontIndex((current) => (current === best ? current : best))
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(updateFront)
    }

    updateFront()
    track.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", updateFront)

    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", updateFront)
    }
  }, [])

  function getItemClass(index: number) {
    const frontClass = index === frontIndex ? " is-front" : ""

    if (hoveredIndex === null) {
      return `growth-carousel-item${frontClass}`
    }

    if (index === hoveredIndex) {
      return `growth-carousel-item is-hovered${frontClass}`
    }

    if (index === hoveredIndex - 1 || index === hoveredIndex + 1) {
      return `growth-carousel-item is-adjacent${frontClass}`
    }

    return `growth-carousel-item is-distant${frontClass}`
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
            <Link
              href={card.href}
              className="growth-carousel-media"
              aria-label={card.title}
            >
              <Image
                src={card.imageSrc}
                alt={card.imageAlt}
                fill
                sizes="(max-width: 767px) calc(100vw - 64px), 331px"
                className="growth-carousel-image"
              />
              {card.overlayLabel ? (
                <span className="growth-carousel-overlay" aria-hidden="true">
                  {card.overlayLabel}
                </span>
              ) : null}
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
          Ship with experts who know every route
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
            Build delivery operations that scale with your business
          </h3>
          <Link href="/startups" className="growth-startup-cta">
            Diatel for businesses
            <span className="enterprise-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="growth-startup-body">
          From online shops to restaurant chains and clinic networks, Diatel
          helps growing businesses move packages faster with pickup, tracking,
          and rider coverage built for Ghana.
        </p>
      </div>

      <GrowthShowcaseCarousel />

      <GrowthPromoCards />
    </section>
  )
}
