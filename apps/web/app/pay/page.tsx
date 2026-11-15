import type { Metadata } from "next"

import { PayDeliveryPage } from "@/components/pay-delivery-page"

export const metadata: Metadata = {
  title: "Pay for delivery | Diatel",
  description: "Pay your Diatel delivery fare with MoMo, card, or bank.",
  robots: { index: false, follow: false },
}

type PageProps = {
  searchParams: Promise<{ id?: string }>
}

export default async function PayRoute({ searchParams }: PageProps) {
  const params = await searchParams
  return <PayDeliveryPage trackingId={params.id?.trim() || null} />
}
