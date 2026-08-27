import Link from "next/link"

import { BentoGrid } from "@/components/bento-grid"
import { GridRule, PageGrid } from "@/components/page-grid"
import { HeroGlow } from "@/components/hero-glow"
import { LogoMarquee } from "@/components/logo-marquee"
import { SiteHeader } from "@/components/site-header"

function ChevronRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className="size-3"
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

export default function Page() {
  return (
    <div className="relative min-h-svh overflow-x-hidden bg-white">
      <HeroGlow />
      <SiteHeader />

      <div className="relative">
        <PageGrid>
          <GridRule />

          <section className="relative z-20 px-5 pb-10 pt-8 md:min-h-[480px] md:px-6 md:py-20">
            <p className="text-[12px] font-medium tracking-[0.01em] text-[#5a6472] md:hidden">
              Deliveries completed today: 1,284
            </p>

            <h1 className="mt-3 max-w-[16ch] text-[34px] font-semibold leading-[1.12] tracking-[-0.035em] text-[#0a2540] md:mt-0 md:max-w-[28ch] md:text-[48px] md:tracking-[-0.03em] md:text-[#2b2a26]">
              <span className="md:hidden">
                Send it. Track it.{" "}
                <span className="text-[#0a2540]">Relax.</span>
              </span>
              <span className="hidden md:inline">
                Send it. Track it. Relax.{" "}
                <span className="bg-gradient-to-r from-[#9a8fb8] to-[#c4a8b8] bg-clip-text text-transparent">
                  Diatel connects you with a rider in minutes and keeps you
                  updated until it&apos;s in the right hands.
                </span>
              </span>
            </h1>

            <div className="mt-8 flex items-center gap-2 md:mt-8">
              <Link
                href="/request-delivery"
                className="btn btn-primary h-11 flex-1 px-4 text-[14px] md:h-8 md:flex-none md:px-3.5"
              >
                Request a Delivery
                <ChevronRight />
              </Link>
              <Link
                href="/signin"
                className="btn btn-glass h-11 flex-1 px-4 text-[14px] md:hidden"
              >
                Sign in
              </Link>
            </div>
          </section>

          <GridRule />

          <LogoMarquee />

          <GridRule />

          <section className="relative z-20 px-6 py-16 md:py-24">
            <p className="max-w-[42ch] text-[22px] leading-[1.28] tracking-[-0.025em] md:max-w-[48ch] md:text-[26px] md:leading-[1.25] md:tracking-[-0.03em]">
              <span className="font-semibold text-[#0a2540]">
                Delivery that scales with you.{" "}
              </span>
              <span className="font-medium text-[#8898aa]">
                Whether it&apos;s a single package or your whole business&apos;s
                daily orders, Diatel handles it with the same speed and
                reliability.
              </span>
            </p>

            <div className="mt-10 md:mt-14">
              <BentoGrid />
            </div>
          </section>
        </PageGrid>
      </div>
    </div>
  )
}
