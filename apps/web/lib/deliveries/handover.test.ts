import { beforeEach, describe, expect, it, vi } from "vitest"

const { state, recordMock, updateMock } = vi.hoisted(() => ({
  state: { value: null as null | { code: string | null; attempts: number; confirmedAt: string | null } },
  recordMock: vi.fn(),
  updateMock: vi.fn(),
}))

vi.mock("./store", () => ({
  createId: () => "evt_1",
  getHandoverState: vi.fn(async () => state.value),
  recordHandoverAttempt: recordMock,
  updateDelivery: updateMock,
}))
vi.mock("@/lib/email/resend", () => ({ getAppUrl: () => "https://diateldelivery.com" }))

import {
  checkHandoverCode,
  generateHandoverCode,
  handoverCheckUrl,
  HANDOVER_MAX_ATTEMPTS,
} from "./handover"

describe("handover code", () => {
  beforeEach(() => {
    recordMock.mockReset()
    updateMock.mockReset()
    state.value = { code: "0427", attempts: 0, confirmedAt: null }
  })

  it("generates random 4-digit codes, keeping leading zeros", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateHandoverCode()))
    for (const code of codes) expect(code).toMatch(/^\d{4}$/)
    expect(codes.size).toBeGreaterThan(150)
  })

  it("links the rider to our check page", () => {
    expect(handoverCheckUrl("DT-ABC123")).toBe("https://diateldelivery.com/handover/DT-ABC123")
  })

  it("confirms the right code once and records it on the order", async () => {
    await expect(checkHandoverCode("DT-1", "0427")).resolves.toEqual({
      status: "confirmed",
      alreadyConfirmed: false,
    })
    expect(recordMock).toHaveBeenCalledWith("DT-1", "confirmed")
    expect(updateMock).toHaveBeenCalledTimes(1)
  })

  it("counts wrong codes down and locks after the limit", async () => {
    await expect(checkHandoverCode("DT-1", "1111")).resolves.toEqual({
      status: "wrong",
      attemptsLeft: HANDOVER_MAX_ATTEMPTS - 1,
    })
    expect(recordMock).toHaveBeenCalledWith("DT-1", "wrong")

    state.value = { code: "0427", attempts: HANDOVER_MAX_ATTEMPTS - 1, confirmedAt: null }
    await expect(checkHandoverCode("DT-1", "1111")).resolves.toEqual({ status: "locked" })

    state.value = { code: "0427", attempts: HANDOVER_MAX_ATTEMPTS, confirmedAt: null }
    // Even the right code is refused once locked — ops has to step in.
    await expect(checkHandoverCode("DT-1", "0427")).resolves.toEqual({ status: "locked" })
  })
})
