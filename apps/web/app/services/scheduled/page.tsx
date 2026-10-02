import type { Metadata } from "next"

import { ScheduledPage } from "@/components/services-topics"

export const metadata: Metadata = {
  title: "Scheduled | Services | Diatel",
  description:
    "Choose a pickup window so a Diatel rider arrives when the package is ready.",
}

export default function ScheduledRoute() {
  return <ScheduledPage />
}
