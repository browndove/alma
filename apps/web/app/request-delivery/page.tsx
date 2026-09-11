import type { Metadata } from "next"

import { RequestDeliveryForm } from "@/components/request-delivery-form"

export const metadata: Metadata = {
  title: "Request a Delivery | Diatel",
  description: "Tell us a few details and we'll get your delivery set up.",
}

export default function RequestDeliveryPage() {
  return <RequestDeliveryForm />
}
