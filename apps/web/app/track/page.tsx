import type { Metadata } from "next"

import { TrackPage } from "@/components/track-page"

export const metadata: Metadata = {
  title: "Track delivery | Diatel",
  description:
    "Live tracking for your Diatel delivery — pickup, rider progress, and ETA.",
}

export default function TrackRoute() {
  return <TrackPage />
}
