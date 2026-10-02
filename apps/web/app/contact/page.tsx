import type { Metadata } from "next"

import { ContactPage } from "@/components/contact-page"

export const metadata: Metadata = {
  title: "Contact | Diatel",
  description:
    "Talk to Diatel about a delivery, business routes, riding, or press. We reply on weekdays.",
}

export default async function ContactRoute({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>
}) {
  const params = await searchParams
  return <ContactPage initialTopic={params.topic} />
}
