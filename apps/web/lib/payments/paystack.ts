import { createHmac, timingSafeEqual } from "node:crypto"

const PAYSTACK_BASE = "https://api.paystack.co"

export function getPaystackSecretKey() {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || ""
}

export function getPaystackPublicKey() {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() || ""
}

export function fareToPesewas(fareGhs: number) {
  return Math.round(fareGhs * 100)
}

type PaystackResponse<T> = {
  status: boolean
  message: string
  data: T
}

export type PaystackInitializeData = {
  authorization_url: string
  access_code: string
  reference: string
}

export type PaystackVerifyData = {
  status: string
  reference: string
  amount: number
  currency: string
  paid_at: string | null
  channel: string | null
  customer?: { email?: string }
  metadata?: Record<string, unknown> | null
}

async function paystackFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<PaystackResponse<T>> {
  const secret = getPaystackSecretKey()
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured")
  }

  const response = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })

  const json = (await response.json()) as PaystackResponse<T>
  if (!response.ok || !json.status) {
    throw new Error(json.message || "Paystack request failed")
  }
  return json
}

export async function initializePaystackPayment(input: {
  email: string
  amountPesewas: number
  reference: string
  callbackUrl: string
  metadata: Record<string, unknown>
}) {
  return paystackFetch<PaystackInitializeData>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountPesewas,
      currency: "GHS",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
      channels: ["mobile_money", "card", "bank", "ussd", "bank_transfer"],
    }),
  })
}

export async function verifyPaystackPayment(reference: string) {
  return paystackFetch<PaystackVerifyData>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  )
}

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | null,
) {
  const secret = getPaystackSecretKey()
  if (!secret || !signature) return false
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex")
  try {
    const left = Buffer.from(hash)
    const right = Buffer.from(signature)
    if (left.length !== right.length) return false
    return timingSafeEqual(left, right)
  } catch {
    return false
  }
}

export function buildPaymentReference(trackingId: string) {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `DTPAY-${trackingId.replace(/^DT-/, "")}-${stamp}${rand}`.slice(0, 48)
}
