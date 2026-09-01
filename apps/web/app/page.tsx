import Link from "next/link"
import Image from "next/image"

import { EnterpriseSection } from "@/components/enterprise-section"
import { GrowthSection } from "@/components/growth-section"
import { BentoGrid } from "@/components/bento-grid"
import { FlowField } from "@/components/flow-field"
import { GridRule, PageGrid } from "@/components/page-grid"
import { HeroGlow } from "@/components/hero-glow"
import { LogoMarquee } from "@/components/logo-marquee"
import { RecommendationPrompt } from "@/components/recommendation-prompt"
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
    <div className="page-shell relative min-h-svh bg-white">
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

            <RecommendationPrompt />

            <section className="delivery-image-section" aria-label="Diatel delivery">
              <Image
                src="/delivery-image.png"
                alt="Diatel rider handing a package to a customer"
                fill
                sizes="(max-width: 767px) calc(100vw - 32px), min(1233px, calc(100vw - 30px))"
                className="delivery-image"
              />
            </section>

            <section className="flow-field-section" aria-labelledby="flow-field-title">
              <div className="flow-field-header">
                <h2 id="flow-field-title" className="flow-field-title">
                  <span>The backbone</span>
                  <span>of everyday commerce.</span>
                </h2>
                <div className="flow-field-stats">
                  <div className="flow-field-stat">
                    <strong>24/7</strong>
                    <span>Request delivery anytime</span>
                  </div>
                  <div className="flow-field-stat">
                    <strong>No app</strong>
                    <span>Book directly from your browser</span>
                  </div>
                  <div className="flow-field-stat">
                    <strong>Live</strong>
                    <span>Delivery tracking from pickup to drop-off</span>
                  </div>
                  <div className="flow-field-stat">
                    <strong>4+</strong>
                    <span>Delivery zones across Accra</span>
                  </div>
                </div>
              </div>
              <div className="flow-field-art">
                <Link
                  href="/services"
                  className="flow-field-control"
                  aria-label="Explore the Diatel delivery network"
                >
                  <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="2" fill="currentColor" />
                    <path
                      d="M8 1.75v2M8 12.25v2M1.75 8h2M12.25 8h2M3.58 3.58l1.42 1.42M11 11l1.42 1.42M12.42 3.58 11 5M5 11l-1.42 1.42"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </Link>
                <FlowField />
              </div>
            </section>

            <EnterpriseSection />

            <GrowthSection />
          </section>
        </PageGrid>
      </div>
    </div>
  )
}
