import type { Metadata } from "next"

import { SameDayPage } from "@/components/services-topics"

export const metadata: Metadata = {
  title: "Same-day | Services | Diatel",
  description:
    "Match a Diatel rider in minutes for documents, parcels, and food across Accra.",
}

export default function SameDayRoute() {
  return <SameDayPage />
}
