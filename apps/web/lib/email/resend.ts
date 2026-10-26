import { Resend } from "resend"

let client: Resend | null = null
let cachedKey: string | null = null

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return null
  if (!client || cachedKey !== apiKey) {
    client = new Resend(apiKey)
    cachedKey = apiKey
  }
  return client
}

export function getResendFrom() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Diatel Delivery <deliveries@diateldelivery.com>"
  )
}

export function getAppUrl() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "http://localhost:3001"
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "")
  }
  return `https://${raw.replace(/\/$/, "")}`
}

export function getLogoUrl() {
  return `${getAppUrl()}/diatel-logo.png`
}
