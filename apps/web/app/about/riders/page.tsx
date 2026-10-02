import type { Metadata } from "next"

import { AboutRidersPage } from "@/components/about-topics"

export const metadata: Metadata = {
  title: "Riders | About | Diatel",
  description:
    "Verified Diatel riders who know Accra’s corridors and keep packages secure from pickup to drop-off.",
}

export default function AboutRidersRoute() {
  return <AboutRidersPage />
}
