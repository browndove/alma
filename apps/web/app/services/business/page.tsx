import type { Metadata } from "next"

import { ServicesBusinessPage } from "@/components/services-business-page"

export const metadata: Metadata = {
  title: "Business | Services | Diatel",
  description:
    "Repeating delivery routes for restaurants, retail shops, clinics, and warehouses.",
}

export default function BusinessRoute() {
  return <ServicesBusinessPage />
}
