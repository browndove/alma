"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { GridRule } from "@/components/page-grid"
import type { SectionLink } from "@/lib/site-sections"

export function SectionExplore({
  title,
  links,
}: {
  title: string
  links: readonly SectionLink[]
}) {
  const pathname = usePathname()

  if (pathname === links[0]?.href) return null

  return (
    <>
    <GridRule />
    <section className="sx-section" aria-label={title}>
      <h2 className="sx-title">{title}</h2>
      <ol className="sx-list">
        {links.map((link, index) => {
          const current = link.href === pathname
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={current ? "sx-row is-current" : "sx-row"}
                aria-current={current ? "page" : undefined}
              >
                <span className="sx-num">{String(index + 1).padStart(2, "0")}</span>
                <span className="sx-label">{link.label}</span>
                <span className="sx-desc">
                  {current ? "You're here" : link.description}
                </span>
                <span className="sx-arrow" aria-hidden="true">
                  ↗
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
    </>
  )
}
