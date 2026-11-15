import type { Metadata } from "next"

import { PayReturnPage } from "@/components/pay-return-page"

export const metadata: Metadata = {
  title: "Payment result | Diatel",
  robots: { index: false, follow: false },
}

type PageProps = {
  searchParams: Promise<{ reference?: string; trxref?: string }>
}

export default async function PayReturnRoute({ searchParams }: PageProps) {
  const params = await searchParams
  const reference = params.reference?.trim() || params.trxref?.trim() || null
  return <PayReturnPage reference={reference} />
}
