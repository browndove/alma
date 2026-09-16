"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

type Testimonial = {
  id: string
  quote: string
  name: string
  role: string
  storyHref: string
  logoLabel: string
  logoClass: string
  avatarInitials: string
  avatarHue: number
}

const testimonials: Testimonial[] = [
  {
    id: "kutana",
    quote:
      "Diatel made it easy to offer same-day delivery without hiring a fleet. Our customers get live updates, and our team spends less time chasing riders.",
    name: "Kwame Asante",
    role: "Owner, Kutana Kitchen",
    storyHref: "/stories/kutana",
    logoLabel: "kutana",
    logoClass: "testimonial-logo-kutana",
    avatarInitials: "KA",
    avatarHue: 168,
  },
  {
    id: "fieldpro",
    quote:
      "Without Diatel, coordinating city-wide drop-offs would have slowed us down. Live tracking and reliable riders keep FieldPro deliveries on schedule every day.",
    name: "Ama Mensah",
    role: "Director of Operations, FieldPro",
    storyHref: "/stories/fieldpro",
    logoLabel: "FIELDPRO",
    logoClass: "testimonial-logo-fieldpro",
    avatarInitials: "AM",
    avatarHue: 248,
  },
  {
    id: "sellerstack",
    quote:
      "Instagram sellers on our platform book deliveries in minutes. Diatel tracking links give buyers confidence without us building logistics from scratch.",
    name: "Efua Boateng",
    role: "Head of Seller Success, SellerStack",
    storyHref: "/stories/sellerstack",
    logoLabel: "sellerstack",
    logoClass: "testimonial-logo-sellerstack",
    avatarInitials: "EB",
    avatarHue: 12,
  },
  {
    id: "quickcart",
    quote:
      "Peak-hour orders used to overwhelm our dispatch desk. Diatel routes riders faster and keeps our retail partners informed every step of the way.",
    name: "Daniel Osei",
    role: "COO, QuickCart",
    storyHref: "/stories/quickcart",
    logoLabel: "quickcart",
    logoClass: "testimonial-logo-quickcart",
    avatarInitials: "DO",
    avatarHue: 210,
  },
]

export function TestimonialSection() {
  const [activeIndex, setActiveIndex] = useState(1)
  const logoRefs = useRef<(HTMLButtonElement | null)[]>([])
  const active = testimonials[activeIndex] ?? testimonials[0]!

  useEffect(() => {
    const button = logoRefs.current[activeIndex]
    button?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    })
  }, [activeIndex])

  return (
    <section
      className="testimonial-section"
      aria-labelledby="testimonial-quote"
      style={{ ["--testimonial-active" as string]: activeIndex }}
    >
      <div className="testimonial-panel">
        <div
          className="testimonial-avatar"
          style={{
            background: `linear-gradient(145deg, hsl(${active.avatarHue} 62% 42%), hsl(${active.avatarHue} 48% 58%))`,
          }}
          aria-hidden="true"
        >
          {active.avatarInitials}
        </div>

        <blockquote id="testimonial-quote" className="testimonial-quote">
          {active.quote}
        </blockquote>

        <p className="testimonial-attribution">
          <span className="testimonial-name">{active.name}</span>
          <span className="testimonial-role">, {active.role}</span>
        </p>

        <Link href={active.storyHref} className="testimonial-story-link">
          Read the story
          <span className="testimonial-story-chevron" aria-hidden="true">›</span>
        </Link>
      </div>

      <div className="testimonial-divider" role="presentation" />

      <div className="testimonial-nav">
        <div className="testimonial-indicator-track" aria-hidden="true">
          <span className="testimonial-indicator" />
        </div>

        <div className="testimonial-logos">
          {testimonials.map((item, index) => (
            <button
              key={item.id}
              ref={(el) => {
                logoRefs.current[index] = el
              }}
              type="button"
              className={`testimonial-logo-btn${index === activeIndex ? " is-active" : ""}`}
              aria-pressed={index === activeIndex}
              aria-label={`Show testimonial from ${item.logoLabel}`}
              onClick={() => setActiveIndex(index)}
            >
              <span className={`testimonial-logo ${item.logoClass}`}>
                {item.logoLabel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
