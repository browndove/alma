import type { Metadata } from "next"

import { TrackingServicePage } from "@/components/services-topics"

export const metadata: Metadata = {
  title: "Tracking | Services | Diatel",
  description:
    "Share a Diatel tracking link so senders and recipients see every stop until drop-off.",
}

export default function TrackingServiceRoute() {
  return <TrackingServicePage />
}
