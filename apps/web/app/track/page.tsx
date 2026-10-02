import type { Metadata } from "next"

import { TrackPage } from "@/components/track-page"

export const metadata: Metadata = {
  title: "Track delivery | Diatel",
  description:
    "Follow your Diatel delivery status, courier details, and handover code.",
}

type PageProps = {
  searchParams: Promise<{ id?: string }>
}

export default async function TrackRoute({ searchParams }: PageProps) {
  const params = await searchParams
  return <TrackPage initialTrackingId={params.id?.trim() || null} />
}
