import type { Metadata } from "next"

import { AboutPage } from "@/components/about-page"

export const metadata: Metadata = {
  title: "About | Diatel",
  description:
    "Diatel is Ghana's delivery network — same-day pickup, live tracking, and verified riders across Accra and beyond.",
}

export default function AboutRoute() {
  return <AboutPage />
}
