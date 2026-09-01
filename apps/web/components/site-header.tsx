"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
] as const

const mobileLinks = [
  { href: "/", label: "Home", hasMenu: true },
  { href: "/about", label: "About", hasMenu: true },
  { href: "/services", label: "Services", hasMenu: true },
  { href: "/contact", label: "Contact", hasMenu: false },
] as const

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={className ?? "size-3"}
      fill="none"
    >
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

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill="none">
      <path
        d="M5 8h14M5 12h14M5 16h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3.5" fill="none">
      <path
        d="M1.5 1.5l9 9M10.5 1.5l-9 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="currentColor"
    >
      <path d="M8 1.2 8.95 6.1 13.8 7 8.95 7.9 8 12.8 7.05 7.9 2.2 7l4.85-.9L8 1.2Z" />
    </svg>
  )
}

function DiatelLogo() {
  return (
    <img
      src="/diatel-logo.png"
      alt="Diatel"
      className="h-8 w-auto"
    />
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <header className="site-header relative z-30">
      <div className="site-header-inner mx-auto flex h-[72px] w-full items-center justify-between px-6">
        <div className="flex min-w-0 items-center gap-10">
          <Link href="/" aria-label="Diatel home" className="shrink-0">
            <DiatelLogo />
          </Link>

          <nav className="hidden items-center gap-5 md:flex" aria-label="Primary">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
            <div className="ml-1 flex items-center gap-2.5">
              <span
                className="h-3.5 w-px shrink-0 bg-[#e3e8ef]"
                aria-hidden="true"
              />
              <Link
                href="/guide"
                className="nav-link inline-flex items-center gap-1"
              >
                <SparkleIcon />
                Guide me
              </Link>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 md:flex">
            <Link href="/signin" className="btn btn-secondary">
              Sign in
            </Link>
            <Link href="/request-delivery" className="btn btn-primary">
              Request a Delivery
              <ChevronRight />
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-[10px] bg-white text-[#fe5200] shadow-[0_2px_10px_rgba(10,37,64,0.12)] md:hidden"
            aria-expanded={open}
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
          <div className="flex h-[72px] items-center justify-between px-5">
            <Link
              href="/"
              aria-label="Diatel home"
              onClick={() => setOpen(false)}
            >
              <DiatelLogo />
            </Link>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-[6px] bg-[#f6f9ff] text-[#4f3cc9]"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col px-5" aria-label="Mobile">
            <ul className="flex flex-col">
              {mobileLinks.map((link) => (
                <li
                  key={link.href}
                  className="border-b border-dashed border-[#e3e8ef]"
                >
                  <Link
                    href={link.href}
                    className="flex items-center justify-between py-[18px] text-[16px] font-semibold leading-none tracking-normal text-[#0a2540]"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                    {link.hasMenu ? (
                      <ChevronRight className="h-3 w-2 text-[#fe5200]" />
                    ) : null}
                  </Link>
                </li>
              ))}
              <li className="border-b border-dashed border-[#e3e8ef]">
                <Link
                  href="/guide"
                  className="flex items-center gap-2 py-[18px] text-[16px] font-semibold leading-none tracking-normal text-[#0a2540]"
                  onClick={() => setOpen(false)}
                >
                  <SparkleIcon />
                  Guide me
                </Link>
              </li>
            </ul>

            <div className="border-b border-dashed border-[#e3e8ef] py-6">
              <p className="text-[15px] font-semibold leading-snug text-[#0a2540]">
                Not sure where to start?
              </p>
              <p className="mt-2 max-w-[34ch] text-[14px] font-normal leading-5 text-[#6b7c93]">
                Tell us about your business to get personalized product
                recommendations.
              </p>
              <Link
                href="/services"
                className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#635bff]"
                onClick={() => setOpen(false)}
              >
                Find what&apos;s right for you
                <ChevronRight className="h-2.5 w-[6px]" />
              </Link>
            </div>

            <div className="mt-auto flex gap-2 py-5">
              <Link
                href="/signin"
                className="btn btn-secondary flex-1"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/request-delivery"
                className="btn btn-primary flex-1"
                onClick={() => setOpen(false)}
              >
                Request a Delivery
                <ChevronRight />
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
