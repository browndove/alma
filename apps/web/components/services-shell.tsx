import { GridRule, PageGrid } from "@/components/page-grid"
import { SectionExplore } from "@/components/section-explore"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { servicesLinks } from "@/lib/site-sections"

export function ServicesShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell about-page relative min-h-svh bg-white">
      <SiteHeader />

      <div className="relative">
        <PageGrid>
          {children}

          <SectionExplore title="Other ways to send" links={servicesLinks} />

          <GridRule />

          <SiteFooter />
        </PageGrid>
      </div>
    </div>
  )
}
