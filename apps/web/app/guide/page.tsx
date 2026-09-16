import type { Metadata } from "next"

import { GuideMePage } from "@/components/guide-me"

export const metadata: Metadata = {
  title: "Guide me | Diatel",
  description:
    "Tell us where it's going and what you're sending — get the right Diatel delivery option.",
}

export default function GuidePage() {
  return <GuideMePage />
}
