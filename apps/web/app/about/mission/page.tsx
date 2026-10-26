import type { Metadata } from "next"

import { AboutMissionPage } from "@/components/about-mission-page"

export const metadata: Metadata = {
  title: "Mission | About | Diatel",
  description:
    "Make sending a package as simple as sending a message — live tracking, verified riders, and coverage that keeps Ghana moving.",
}

export default function AboutMissionRoute() {
  return <AboutMissionPage />
}
