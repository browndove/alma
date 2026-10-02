import type { Metadata } from "next"

import { BulkPage } from "@/components/services-topics"

export const metadata: Metadata = {
  title: "Bulk | Services | Diatel",
  description:
    "Move a batch of orders in one Diatel pickup, with a tracking link for each parcel.",
}

export default function BulkRoute() {
  return <BulkPage />
}
