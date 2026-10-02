import type { Metadata } from "next"

import { AboutNetworkPage } from "@/components/about-topics"

export const metadata: Metadata = {
  title: "Network | About | Diatel",
  description:
    "Same-day pickup, live tracking, scheduled business routes, and verified riders across Accra.",
}

export default function AboutNetworkRoute() {
  return <AboutNetworkPage />
}
