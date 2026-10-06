import Link from "next/link"

export function TestimonialSection() {
  return (
    <section className="testimonial-section" aria-labelledby="testimonial-quote">
      <div className="testimonial-panel">
        <div
          className="testimonial-avatar"
          style={{
            background:
              "linear-gradient(145deg, hsl(248 62% 42%), hsl(248 48% 58%))",
          }}
          aria-hidden="true"
        >
          AM
        </div>

        <blockquote id="testimonial-quote" className="testimonial-quote">
          Without Diatel, coordinating city-wide drop-offs would have slowed us
          down. Live tracking and reliable riders keep FieldPro deliveries on
          schedule every day.
        </blockquote>

        <p className="testimonial-attribution">
          <span className="testimonial-name">Ama Mensah</span>
          <span className="testimonial-role">, Director of Operations, FieldPro</span>
        </p>

        <Link href="/stories/fieldpro" className="testimonial-story-link">
          Read the story
          <span className="testimonial-story-chevron" aria-hidden="true">
            ›
          </span>
        </Link>
      </div>
    </section>
  )
}
