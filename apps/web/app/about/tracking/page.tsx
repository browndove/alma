import type { Metadata } from "next"

import { AboutTrackingPage } from "@/components/about-tracking-page"

export const metadata: Metadata = {
  title: "Tracking | About | Diatel",
  description:
    "Share a tracking link so senders and recipients see every stop until drop-off.",
}

export default function AboutTrackingRoute() {
  return <AboutTrackingPage />
}
