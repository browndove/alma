"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { GridRule, PageGrid } from "@/components/page-grid"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const aboutNav = [
  { href: "/about", label: "Overview" },
  { href: "/about/mission", label: "Mission" },
  { href: "/about/network", label: "Network" },
  { href: "/about/tracking", label: "Tracking" },
  { href: "/about/riders", label: "Riders" },
  { href: "/about/safety", label: "Safety" },
] as const

function isActive(pathname: string, href: string) {
  if (href === "/about") {
    return pathname === "/about"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AboutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="page-shell about-page relative min-h-svh bg-white">
      <SiteHeader />

      <div className="relative">
        <PageGrid>
          <div className="about-subnav">
            <nav className="about-subnav-inner about-subnav-links" aria-label="About">
                {aboutNav.map((item) => (
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
