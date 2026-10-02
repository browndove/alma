import type { Metadata } from "next"

import { ServicesPage } from "@/components/services-page"

export const metadata: Metadata = {
  title: "Services | Diatel",
  description:
    "Same-day pickup, scheduled windows, business routes, bulk orders, and tracking across Accra.",
}

export default function ServicesRoute() {
  return <ServicesPage />
}
