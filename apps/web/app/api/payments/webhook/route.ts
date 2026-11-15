import { NextResponse } from "next/server"

import {
  DeliveryBookingError,
  markDeliveryPaid,
} from "@/lib/deliveries/service"
import { verifyPaystackWebhookSignature } from "@/lib/payments/paystack"

export const runtime = "nodejs"

export async function POST(request: Request) {
  // Keep reachable even when the public site is locked.
  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature")
  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: {
    event?: string
    data?: {
      reference?: string
      status?: string
      channel?: string
      paid_at?: string
      metadata?: { trackingId?: string }
    }
  }
  try {
    payload = JSON.parse(rawBody) as typeof payload
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (payload.event !== "charge.success") {
    return NextResponse.json({ received: true })
  }

  const reference = payload.data?.reference?.trim()
  if (!reference || payload.data?.status !== "success") {
    return NextResponse.json({ received: true })
  }

  try {
    await markDeliveryPaid({
      trackingId: payload.data?.metadata?.trackingId,
      reference,
      channel: payload.data?.channel ?? null,
      paidAt: payload.data?.paid_at ?? null,
    })
    return NextResponse.json({ received: true, ok: true })
  } catch (error) {
    if (error instanceof DeliveryBookingError && error.status === 404) {
      console.error("[payments] webhook delivery missing", reference)
      return NextResponse.json({ received: true, missing: true })
    }
    console.error("[payments] webhook failed", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}
