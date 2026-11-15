import type { Metadata } from "next"

import { ServerUnreachableScreen } from "@/components/server-unreachable-screen"

export const metadata: Metadata = {
  title: "Server Unreachable",
  robots: { index: false, follow: false },
}

export default function UnavailablePage() {
  return <ServerUnreachableScreen />
}
