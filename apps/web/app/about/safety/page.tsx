import type { Metadata } from "next"

import { AboutSafetyPage } from "@/components/about-topics"

export const metadata: Metadata = {
  title: "Safety | About | Diatel",
  description:
    "Verified riders, chain of custody, and support when a delivery needs a human.",
}

export default function AboutSafetyRoute() {
  return <AboutSafetyPage />
}
