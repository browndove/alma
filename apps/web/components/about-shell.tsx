import { GridRule, PageGrid } from "@/components/page-grid"
import { SectionExplore } from "@/components/section-explore"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { aboutLinks } from "@/lib/site-sections"

export function AboutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell about-page relative min-h-svh">
      <div className="about-bg" aria-hidden="true" />

      <SiteHeader />

      <div className="relative z-[1]">
        <PageGrid>
          {children}

          <SectionExplore title="Keep reading" links={aboutLinks} />

          <GridRule />

          <SiteFooter />
        </PageGrid>
      </div>
    </div>
  )
}
