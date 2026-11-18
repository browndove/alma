import type { Metadata } from "next"

import { HandoverCheck } from "@/components/handover-check"

export const metadata: Metadata = {
  title: "Confirm handover | Diatel",
  robots: { index: false },
}

export default async function HandoverPage(props: PageProps<"/handover/[trackingId]">) {
  const { trackingId } = await props.params
  return <HandoverCheck trackingId={decodeURIComponent(trackingId).toUpperCase()} />
}
