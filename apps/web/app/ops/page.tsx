import type { Metadata } from "next"

import { OpsOrdersPage } from "@/components/ops-orders-page"

export const metadata: Metadata = {
  title: "Ops orders | Diatel",
  description: "Track and manage Diatel bookings — always available, map-independent.",
  robots: { index: false, follow: false },
}

export default function OpsPage() {
  return <OpsOrdersPage />
}
