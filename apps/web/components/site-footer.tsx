import Link from "next/link"

function ChevronRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="site-footer-chevron" fill="none">
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

const columns = [
  {
    title: "Products",
    links: [
      { href: "/request-delivery", label: "Request a delivery" },
      { href: "/services", label: "Same-day delivery" },
      { href: "/services", label: "Scheduled pickup" },
      { href: "/services", label: "Business deliveries" },
      { href: "/services", label: "Bulk orders" },
      { href: "/services", label: "Live tracking" },
      { href: "/services", label: "Rider cards" },
      { href: "/services", label: "API access" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { href: "/services", label: "Individuals" },
      { href: "/services", label: "Small businesses" },
      { href: "/services", label: "Restaurants" },
      { href: "/services", label: "Retail shops" },
      { href: "/services", label: "Pharmacies" },
      { href: "/services", label: "E-commerce" },
      { href: "/services", label: "Marketplaces" },
      { href: "/services", label: "Enterprises" },
      { href: "/about", label: "Riders" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/guide", label: "Getting started" },
      { href: "/guide", label: "Delivery guide" },
      { href: "/about", label: "Coverage zones" },
      { href: "/about", label: "Customer stories" },
      { href: "/contact", label: "Help center" },
      { href: "/about", label: "Blog" },
      { href: "/about", label: "Safety" },
      { href: "/contact", label: "Privacy and terms" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Diatel" },
      { href: "/about", label: "Careers" },
      { href: "/contact", label: "Newsroom" },
      { href: "/contact", label: "Contact sales" },
      { href: "/contact", label: "Support" },
      { href: "/signin", label: "Sign in" },
    ],
  },
] as const

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-cta">
        <div className="site-footer-cta-main">
          <h2 className="site-footer-cta-title">Ready to get started?</h2>
          <p className="site-footer-cta-copy">
            Create an account instantly, or contact us to design a custom
            delivery setup for your business.
          </p>
          <div className="site-footer-cta-actions">
            <Link href="/request-delivery" className="btn btn-primary site-footer-btn">
              Start now
              <ChevronRight />
            </Link>
            <Link href="/contact" className="btn site-footer-btn-outline">
              Contact sales
            </Link>
          </div>
        </div>
      </div>

      <div className="site-footer-divider" />

      <nav className="site-footer-nav" aria-label="Footer">
        {columns.map((column) => (
          <div key={column.title} className="site-footer-column">
            <h3 className="site-footer-column-title">{column.title}</h3>
            <ul className="site-footer-list">
              {column.links.map((link) => (
                <li key={`${column.title}-${link.label}`}>
                  <Link href={link.href} className="site-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="site-footer-bottom">
        <p className="site-footer-legal">© {new Date().getFullYear()} Diatel</p>
        <Link href="/signin" className="site-footer-feature-link">
          Sign in
          <ChevronRight />
        </Link>
      </div>
    </footer>
  )
}
