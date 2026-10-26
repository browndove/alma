/** The first entry in each list is the section overview. */
export type SectionLink = { href: string; label: string; description: string }

export const aboutLinks: readonly SectionLink[] = [
  { href: "/about", label: "Overview", description: "What Diatel is and how it works" },
  { href: "/about/mission", label: "Mission", description: "Why we're building Diatel" },
  { href: "/about/network", label: "Network", description: "Coverage across Accra and pricing" },
  { href: "/about/tracking", label: "Tracking", description: "Every stage of a delivery, live" },
  { href: "/about/riders", label: "Riders", description: "Who carries your parcel" },
  { href: "/about/safety", label: "Safety", description: "How we protect every delivery" },
]

export const servicesLinks: readonly SectionLink[] = [
  { href: "/services", label: "Overview", description: "Everything you can book" },
  { href: "/services/same-day", label: "Same-day", description: "A rider in minutes" },
  { href: "/services/scheduled", label: "Scheduled", description: "Pick a pickup window" },
  { href: "/services/business", label: "Business", description: "Repeating routes for shops" },
  { href: "/services/bulk", label: "Bulk", description: "Many orders in one request" },
  { href: "/services/tracking", label: "Tracking", description: "One link for every job" },
]
