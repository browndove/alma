import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  insertDeliveryMock,
  getDeliveryByTrackingIdMock,
  createTookanTaskMock,
  sendDeliveryBookingEmailsMock,
  quoteDeliveryFareMock,
  formatEtaLabelMock,
} = vi.hoisted(() => ({
  insertDeliveryMock: vi.fn(),
  getDeliveryByTrackingIdMock: vi.fn(),
  createTookanTaskMock: vi.fn(),
  sendDeliveryBookingEmailsMock: vi.fn(),
  quoteDeliveryFareMock: vi.fn(),
  formatEtaLabelMock: vi.fn(),
}))

vi.mock("./store", async () => {
  const actual = await vi.importActual<typeof import("./store")>("./store")
  return {
    ...actual,
    insertDelivery: insertDeliveryMock,
    getDeliveryByTrackingId: getDeliveryByTrackingIdMock,
    listDeliveries: vi.fn(),
    updateDelivery: vi.fn(),
    updateDeliveryRecord: vi.fn(),
    getDeliveryByTookanJobId: vi.fn(),
  }
})

vi.mock("./tookan", async () => {
  const actual = await vi.importActual<typeof import("./tookan")>("./tookan")
  return {
    ...actual,
    createTookanTask: createTookanTaskMock,
  }
})

vi.mock("@/lib/email/delivery-emails", () => ({
  sendDeliveryBookingEmails: sendDeliveryBookingEmailsMock,
  ORDERS_NOTIFY_EMAIL: "hrdiateldelivery@gmail.com",
}))

vi.mock("./fare", () => ({
  quoteDeliveryFare: quoteDeliveryFareMock,
  formatEtaLabel: formatEtaLabelMock,
  MIN_FARE_GHS: 20,
  RATE_PER_KM_GHS: 1.5,
  RATE_PER_MIN_GHS: 0.25,
}))

import { createDeliverySchema } from "./types"
import { createDelivery } from "./service"
import { parseCoordsFromAddress } from "./tookan"
import {
  mapTookanWebhook,
  TOOKAN_TRACK_STEP_COUNT,
  TOOKAN_TRACK_STEPS,
} from "./tookan-status"
import { createTrackingId } from "./store"

const validInput = {
  senderName: "Ama Boateng",
  senderPhone: "0244000001",
  senderEmail: "ama@shop.gh",
  pickup: "Accra Mall, Tetteh Quarshie · 5.62250, -0.17330",
  dropoff: "Oxford Street, Osu · 5.55570, -0.18200",
  packageType: "Documents",
  size: "small" as const,
  notes: "",
  fragile: false,
  perishable: false,
  recipientName: "Kojo Mensah",
  recipientPhone: "0244000002",
  recipientEmail: "kojo@example.com",
  payer: "sender" as const,
  estimatedValue: "",
  photoName: null,
  pickupWindow: "now" as const,
  scheduledAt: null,
}

describe("delivery end-to-end", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.TOOKAN_API_KEY = "test-tookan-key"
    process.env.TOOKAN_API_URL = "https://api.tookanapp.com/v2"
    process.env.RESEND_API_KEY = "re_test"
    process.env.RESEND_FROM_EMAIL =
      "Diatel Delivery <deliveries@diateldelivery.com>"
    process.env.ORDERS_NOTIFY_EMAIL = "hrdiateldelivery@gmail.com"
    process.env.NEXT_PUBLIC_APP_URL = "https://diateldelivery.com"

    getDeliveryByTrackingIdMock.mockResolvedValue(null)
    quoteDeliveryFareMock.mockReturnValue({
      fareGhs: 25,
      etaMinutes: 32,
      covered: true,
      resolved: true,
      distanceKm: 9.2,
    })
    formatEtaLabelMock.mockReturnValue("25–40 min")
    sendDeliveryBookingEmailsMock.mockResolvedValue(undefined)
    insertDeliveryMock.mockImplementation(async (delivery: unknown) => delivery)
    createTookanTaskMock.mockResolvedValue({
      jobId: 900002,
      pickupJobId: 900001,
      deliveryJobId: 900002,
      trackingLink: "https://jungl.ml/test",
    })
  })

  it("1. accepts a complete booking payload", () => {
    const parsed = createDeliverySchema.safeParse(validInput)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.senderName).toBe("Ama Boateng")
      expect(parsed.data.pickupWindow).toBe("now")
    }
  })

  it("2. rejects an incomplete booking payload", () => {
    const parsed = createDeliverySchema.safeParse({
      ...validInput,
      senderPhone: "123",
      recipientEmail: "not-an-email",
    })
    expect(parsed.success).toBe(false)
  })

  it("3. parses map-picker coordinates from address labels", () => {
    const parsed = parseCoordsFromAddress(
      "Bukhari Street, New Mamprobi, Accra · 5.55329, -0.24256",
    )
    expect(parsed.label).toBe("Bukhari Street, New Mamprobi, Accra")
    expect(parsed.lat).toBeCloseTo(5.55329)
    expect(parsed.lng).toBeCloseTo(-0.24256)
  })

  it("4. creates Tookan pickup and delivery jobs with official fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({
        status: 200,
        message: "The task has been created.",
        data: {
          job_id: 111,
          pickup_job_id: 111,
          delivery_job_id: 222,
          delivery_tracing_link: "https://jungl.ml/abc",
        },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const actual = await vi.importActual<typeof import("./tookan")>("./tookan")
    const result = await actual.createTookanTask({
      trackingId: "DT-E2E0001",
      senderName: "Ama Boateng",
      senderPhone: "0244000001",
      senderEmail: "ama@shop.gh",
      pickupAddress: "Accra Mall · 5.62250, -0.17330",
      recipientName: "Kojo Mensah",
      recipientPhone: "0244000002",
      recipientEmail: "kojo@example.com",
      deliveryAddress: "Oxford Street, Osu · 5.55570, -0.18200",
      jobDescription: "Tracking: DT-E2E0001 · Documents (small)",
    })

    expect(result).toEqual({
      jobId: 222,
      pickupJobId: 111,
      deliveryJobId: 222,
      trackingLink: "https://jungl.ml/abc",
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [, init] = fetchMock.mock.calls[0]!
    const body = JSON.parse(String((init as RequestInit).body)) as Record<
      string,
      unknown
    >
    expect(body.has_pickup).toBe(1)
    expect(body.has_delivery).toBe(1)
    expect(body.job_pickup_address).toBe("Accra Mall")
    expect(body.customer_address).toBe("Oxford Street, Osu")
    expect(body.job_pickup_latitude).toBe("5.6225")
    expect(body.latitude).toBe("5.5557")
    expect(body.order_id).toBe("DT-E2E0001")
  })

  it("5. skips Tookan when the API key is missing", async () => {
    delete process.env.TOOKAN_API_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const actual = await vi.importActual<typeof import("./tookan")>("./tookan")
    const result = await actual.createTookanTask({
      trackingId: "DT-E2E0002",
      senderName: "Ama",
      senderPhone: "0244000001",
      pickupAddress: "Accra Mall",
      recipientName: "Kojo",
      recipientPhone: "0244000002",
      deliveryAddress: "Osu",
    })
    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("6. books a delivery end-to-end with Tookan ids and emails", async () => {
    const saved = await createDelivery(validInput)

    expect(createTookanTaskMock).toHaveBeenCalledOnce()
    expect(createTookanTaskMock.mock.calls[0]![0]).toMatchObject({
      pickupAddress: validInput.pickup,
      deliveryAddress: validInput.dropoff,
      recipientEmail: "kojo@example.com",
    })
    expect(insertDeliveryMock).toHaveBeenCalledOnce()
    expect(sendDeliveryBookingEmailsMock).toHaveBeenCalledOnce()
    expect(saved.trackingId).toMatch(/^DT-/)
    expect(saved.tookanJobId).toBe(900002)
    expect(saved.tookanPickupJobId).toBe(900001)
    expect(saved.tookanDeliveryJobId).toBe(900002)
    expect(saved.status).toBe("unassigned")
    expect(saved.fareGhs).toBe(25)
    expect(saved.events.some((event) => event.title === "Unassigned")).toBe(
      true,
    )
  })

  it("7. keeps the order when Tookan fails and records dispatch pending", async () => {
    createTookanTaskMock.mockResolvedValueOnce(null)
    const saved = await createDelivery(validInput)

    expect(saved.tookanJobId).toBeNull()
    expect(saved.status).toBe("requested")
    expect(
      saved.events.some((event) => event.title === "Dispatch pending"),
    ).toBe(true)
    expect(sendDeliveryBookingEmailsMock).toHaveBeenCalledOnce()
  })

  it("8. maps Tookan pickup successful to picked_up on the 10-step rail", () => {
    expect(TOOKAN_TRACK_STEP_COUNT).toBe(10)
    expect(TOOKAN_TRACK_STEPS[6]?.id).toBe("picked_up")

    const mapped = mapTookanWebhook({
      jobStatus: 2,
      jobType: 0,
      currentStep: 4,
    })
    expect(mapped).toMatchObject({
      status: "picked_up",
      step: 6,
      title: "Picked up",
    })
  })

  it("9. maps Tookan delivery successful to delivered", () => {
    const mapped = mapTookanWebhook({
      jobStatus: 2,
      jobType: 1,
      currentStep: 7,
    })
    expect(mapped).toMatchObject({
      status: "delivered",
      step: 9,
      title: "Delivered",
    })
  })

  it("10. maps unassigned and assigned webhook codes", () => {
    expect(mapTookanWebhook({ jobStatus: 6 })?.status).toBe("unassigned")
    expect(mapTookanWebhook({ jobStatus: 0 })?.status).toBe("assigned")
    expect(mapTookanWebhook({ jobStatus: 7 })?.status).toBe("accepted")
  })

  it("11. notifies ops inbox plus sender and recipient after booking", async () => {
    const sendMock = vi
      .fn()
      .mockResolvedValue({ data: { id: "email_1" }, error: null })

    vi.resetModules()
    vi.doUnmock("@/lib/email/delivery-emails")
    vi.doMock("@/lib/email/resend", () => ({
      getResend: () => ({ emails: { send: sendMock } }),
      getResendFrom: () => "Diatel Delivery <deliveries@diateldelivery.com>",
      getAppUrl: () => "https://diateldelivery.com",
      getLogoUrl: () => "https://diateldelivery.com/diatel-logo.png",
    }))

    const { sendDeliveryBookingEmails, ORDERS_NOTIFY_EMAIL } = await import(
      "@/lib/email/delivery-emails"
    )

    await sendDeliveryBookingEmails({
      id: "d1",
      trackingId: "DT-MAIL0001",
      status: "unassigned",
      senderName: "Ama Boateng",
      senderPhone: "0244000001",
      senderEmail: "ama@shop.gh",
      pickup: "Accra Mall",
      dropoff: "Oxford Street, Osu",
      packageType: "Documents",
      size: "small",
      notes: "",
      fragile: false,
      perishable: false,
      recipientName: "Kojo Mensah",
      recipientPhone: "0244000002",
      recipientEmail: "kojo@example.com",
      payer: "sender",
      estimatedValue: "",
      photoName: null,
      pickupWindow: "now",
      scheduledAt: null,
      fareGhs: 25,
      etaMinutes: 32,
      etaLabel: "25–40 min",
      riderName: null,
      progressStep: 1,
      tookanJobId: 900002,
      tookanPickupJobId: 900001,
      tookanDeliveryJobId: 900002,
      tookanTrackingLink: "https://jungl.ml/test",
      events: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    expect(ORDERS_NOTIFY_EMAIL).toBe("hrdiateldelivery@gmail.com")
    expect(sendMock).toHaveBeenCalledTimes(3)
    const recipients = sendMock.mock.calls.map(
      (call) => (call[0] as { to: string }).to,
    )
    expect(recipients).toEqual(
      expect.arrayContaining([
        "hrdiateldelivery@gmail.com",
        "ama@shop.gh",
        "kojo@example.com",
      ]),
    )
  })

  it("12. generates DT tracking codes for the booking flow", () => {
    const id = createTrackingId(Date.now())
    expect(id).toMatch(/^DT-[A-Z0-9]+$/)
    expect(id.length).toBeGreaterThan(6)
  })
})
