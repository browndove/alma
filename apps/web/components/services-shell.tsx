"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { GridRule, PageGrid } from "@/components/page-grid"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const servicesNav = [
  { href: "/services", label: "Overview" },
  { href: "/services/same-day", label: "Same-day" },
  { href: "/services/scheduled", label: "Scheduled" },
  { href: "/services/business", label: "Business" },
  { href: "/services/bulk", label: "Bulk" },
  { href: "/services/tracking", label: "Tracking" },
] as const

function isActive(pathname: string, href: string) {
  if (href === "/services") {
    return pathname === "/services"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function ServicesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="page-shell about-page relative min-h-svh bg-white">
      <SiteHeader />

      <div className="relative">
        <PageGrid>
          <div className="about-subnav">
            <nav className="about-subnav-inner about-subnav-links" aria-label="Services">
                {servicesNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      isActive(pathname, item.href)
                        ? "about-subnav-link is-active"
                        : "about-subnav-link"
                    }
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>
          </div>

          {children}

          <GridRule />

          <SiteFooter />
        </PageGrid>
      </div>
    </div>
  )
}
