import { beforeEach, describe, expect, it, vi } from "vitest"

import { payLinkStatus, PAY_LINK_FAILED_TITLE, PAY_LINK_SENT_TITLE } from "@/lib/deliveries/pay-link"
import type { Delivery } from "@/lib/deliveries/types"

const sendMock = vi.fn()

vi.mock("./resend", () => ({
  getResend: () => ({ emails: { send: sendMock } }),
  getResendFrom: () => "Diatel Delivery <deliveries@diateldelivery.com>",
  getAppUrl: () => "https://diateldelivery.com",
  getLogoUrl: () => "https://diateldelivery.com/diatel-logo.png",
}))

function delivery(overrides: Partial<Delivery> = {}): Delivery {
  return {
    id: "d1",
    trackingId: "DT-MAIL0002",
    status: "unassigned",
    senderName: "Ama Boateng",
    senderPhone: "0244000001",
    senderEmail: "ama@shop.gh",
    pickup: "Osu Oxford Street · 5.55600, -0.18200",
    dropoff: "East Legon <b>House</b>",
    packageType: "Documents",
    size: "small",
    notes: "",
    fragile: false,
    perishable: false,
    recipientName: "Kojo Mensah",
    recipientPhone: "0244000002",
    recipientEmail: "kojo@example.com",
    payer: "recipient",
    estimatedValue: "",
    photoName: null,
    pickupWindow: "now",
    scheduledAt: null,
    fareGhs: 33,
    etaMinutes: 44,
    etaLabel: "40–55 min",
    riderName: null,
    progressStep: 1,
    paymentStatus: "unpaid",
    paymentReference: null,
    paidAt: null,
    paidBy: null,
    paymentChannel: null,
    tookanJobId: null,
    tookanPickupJobId: null,
    tookanDeliveryJobId: null,
    tookanTrackingLink: null,
    events: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe("transactional emails", () => {
  beforeEach(() => {
    sendMock.mockReset()
    sendMock.mockResolvedValue({ data: { id: "email_1" }, error: null })
  })

  it("does not send recipient-paid recipients a second booking email", async () => {
    const { sendDeliveryBookingEmails } = await import("./delivery-emails")
    await sendDeliveryBookingEmails(delivery())
    const recipients = sendMock.mock.calls.map((call) => (call[0] as { to: string }).to)
    expect(recipients).toEqual(
      expect.arrayContaining(["ama@shop.gh", "hrdiateldelivery@gmail.com"]),
    )
    expect(recipients).not.toContain("kojo@example.com")
  })

  it("reports a Resend error instead of claiming the pay link was sent", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "Domain not verified" } })
    const { sendRecipientPayLinkEmail } = await import("./payment-emails")
    await expect(sendRecipientPayLinkEmail(delivery())).resolves.toEqual({
      ok: false,
      reason: "Domain not verified",
    })
  })

  it("sends a responsive, escaped pay request to the recipient", async () => {
    const { sendRecipientPayLinkEmail } = await import("./payment-emails")
    const result = await sendRecipientPayLinkEmail(delivery())
    expect(result).toEqual({ ok: true, to: "kojo@example.com", id: "email_1" })

    const message = sendMock.mock.calls[0]![0] as { html: string; text: string }
    expect(message.html).toContain("@media (max-width: 600px)")
    expect(message.html).toContain("https://diateldelivery.com/pay?id=DT-MAIL0002")
    expect(message.html).toContain("East Legon &lt;b&gt;House&lt;/b&gt;")
    expect(message.html).not.toContain("5.55600")
    expect(message.text).toContain("Pay GHS 33")
  })

  it("puts the handover code only in the recipient's email", async () => {
    const { sendRecipientPayLinkEmail } = await import("./payment-emails")
    const { sendDeliveryBookingEmails } = await import("./delivery-emails")
    await sendRecipientPayLinkEmail(delivery(), { handoverCode: "0427" })
    await sendDeliveryBookingEmails(delivery({ payer: "sender" }), { handoverCode: "0427" })
    for (const call of sendMock.mock.calls) {
      const message = call[0] as { to: string; html: string; text: string }
      const hasCode = message.html.includes(">0<") && message.text.includes("0427")
      expect(hasCode).toBe(message.to === "kojo@example.com")
    }
  })
})

describe("one email per person per booking", () => {
  beforeEach(() => {
    sendMock.mockReset()
    sendMock.mockResolvedValue({ data: { id: "email_1" }, error: null })
  })

  const sentTo = () =>
    sendMock.mock.calls.map((call) => (call[0] as { to: string }).to)
  const keys = () =>
    sendMock.mock.calls.map(
      (call) => (call[1] as { idempotencyKey?: string } | undefined)?.idempotencyKey,
    )

  it("sender pays: admin, sender and recipient each get exactly one", async () => {
    const { sendDeliveryBookingEmails } = await import("./delivery-emails")
    await sendDeliveryBookingEmails(delivery({ payer: "sender" }))
    expect(sentTo().sort()).toEqual(
      ["ama@shop.gh", "hrdiateldelivery@gmail.com", "kojo@example.com"].sort(),
    )
    expect(new Set(keys()).size).toBe(3)
    expect(keys()).toContain("booking/DT-MAIL0002/sender")
  })

  it("recipient pays: the pay request is the recipient's only email", async () => {
    const { sendDeliveryBookingEmails } = await import("./delivery-emails")
    const { sendRecipientPayLinkEmail } = await import("./payment-emails")
    const order = delivery({ payer: "recipient" })
    await sendDeliveryBookingEmails(order)
    await sendRecipientPayLinkEmail(order, { idempotencyKey: "pay-link/DT-MAIL0002/1" })
    const counts = sentTo().reduce<Record<string, number>>((acc, to) => {
      acc[to] = (acc[to] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({
      "ama@shop.gh": 1,
      "hrdiateldelivery@gmail.com": 1,
      "kojo@example.com": 1,
    })
  })
})

describe("Tookan job", () => {
  it("never carries customer emails, so Tookan can't email them on every update", async () => {
    vi.stubEnv("TOOKAN_API_KEY", "test-key")
    vi.stubEnv("TOOKAN_TEAM_ID", "1")
    const fetchMock = vi.fn(async () =>
      Response.json({ status: 200, data: { job_id: 1, pickup_job_id: 1, delivery_job_id: 2 } }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const { createTookanTask } = await import("@/lib/deliveries/tookan")
    await createTookanTask({
      trackingId: "DT-MAIL0002",
      senderName: "Ama Boateng",
      senderPhone: "0244000001",
      senderEmail: "ama@shop.gh",
      pickupAddress: "Osu · 5.55600, -0.18200",
      recipientName: "Kojo Mensah",
      recipientPhone: "0244000002",
      recipientEmail: "kojo@example.com",
      deliveryAddress: "East Legon · 5.63650, -0.16090",
    })
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.job_pickup_email).toBe("")
    expect(body.customer_email).toBe("")
    expect(body.job_pickup_phone).toBe("0244000001")
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })
})

describe("payLinkStatus", () => {
  it("returns the latest pay-link outcome", () => {
    const at = new Date().toISOString()
    const event = (title: string, detail: string) => ({ id: title, title, detail, place: null, at })
    expect(payLinkStatus({ events: [] })).toEqual({ state: "none" })
    expect(
      payLinkStatus({
        events: [event(PAY_LINK_FAILED_TITLE, "Domain not verified"), event(PAY_LINK_SENT_TITLE, "kojo@example.com")],
      }),
    ).toEqual({ state: "sent", to: "kojo@example.com", at })
  })
})
