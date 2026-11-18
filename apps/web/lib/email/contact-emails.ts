import {
  buttonBlock,
  escapeHtml,
  factsBlock,
  firstName,
  heroBlock,
  messageBlock,
  renderEmail,
} from "./layout"
import { getResend, getResendFrom } from "./resend"

export const CONTACT_INBOX =
  process.env.CONTACT_TO_EMAIL?.trim() || "hrdiateldelivery@gmail.com"

const TOPIC_LABELS: Record<string, string> = {
  support: "Delivery support",
  business: "Business",
  riders: "Riders",
  press: "Press",
}

export type ContactEnquiry = {
  topic: string
  name: string
  email: string
  phone?: string
  message: string
}

export function buildContactHtml(enquiry: ContactEnquiry, topicLabel: string) {
  const name = firstName(enquiry.name)
  const phone = enquiry.phone?.trim()
  const mailto = `mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(`Re: ${topicLabel} enquiry`)}`

  return renderEmail({
    title: `${topicLabel} enquiry`,
    preheader: `${topicLabel} from ${enquiry.name}: ${enquiry.message.slice(0, 80)}`,
    blocks: [
      heroBlock({
        kicker: topicLabel,
        tone: "navy",
        heading: `New message from ${enquiry.name}`,
        intro: `Hit reply to answer ${escapeHtml(name)} directly — this email’s reply-to is their address.`,
      }),
      factsBlock([
        { label: "Email", value: enquiry.email },
        { label: "Phone", value: phone || "Not given" },
      ]),
      messageBlock({
        label: "Message",
        html: escapeHtml(enquiry.message).replaceAll("\n", "<br />"),
      }),
      buttonBlock({ href: mailto, label: `Reply to ${name}` }),
    ],
    footerNote: "Sent from the contact form on the Diatel website.",
  })
}

export async function sendContactEnquiry(enquiry: ContactEnquiry) {
  const resend = getResend()
  const from = getResendFrom()
  if (!resend) {
    return { ok: false as const, reason: "Email is not configured." }
  }

  const topicLabel = TOPIC_LABELS[enquiry.topic] || enquiry.topic
  const phone = enquiry.phone?.trim() || "—"

  const text = [
    `Topic: ${topicLabel}`,
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Phone: ${phone}`,
    "",
    enquiry.message,
    "",
    "— Diatel Delivery contact form",
  ].join("\n")

  const { data, error } = await resend.emails.send({
    from,
    to: CONTACT_INBOX,
    replyTo: enquiry.email,
    subject: `[${topicLabel}] ${enquiry.name}`,
    text,
    html: buildContactHtml(enquiry, topicLabel),
  })

  if (error) {
    console.error("[email] contact failed", error)
    return { ok: false as const, reason: error.message }
  }

  console.log("[email] contact sent", { id: data?.id, topic: enquiry.topic })
  return { ok: true as const, id: data?.id }
}
