import { describe, expect, it } from "vitest"

import { createDeliverySchema } from "@/lib/deliveries/types"

import { formatGhanaPhone, ghanaPhoneError, normalizeGhanaPhone } from "./phone"

describe("Ghana phone numbers", () => {
  it.each([
    ["0241234567", "0241234567"],
    ["024 123 4567", "0241234567"],
    ["241234567", "0241234567"],
    ["+233 24 123 4567", "0241234567"],
    ["233541234567", "0541234567"],
    ["+233 (0) 20 123 4567", "0201234567"],
    ["050-123-4567", "0501234567"],
  ])("accepts %s", (input, expected) => {
    expect(ghanaPhoneError(input)).toBeNull()
    expect(normalizeGhanaPhone(input)).toBe(expected)
  })

  it.each([
    ["024123456", "Ghana numbers have 10 digits"],
    ["02412345678", "too many digits"],
    ["0301234567", "Ghana mobile number"],
    ["0811234567", "Ghana mobile number"],
    ["+234 803 123 4567", "Only Ghana numbers"],
    ["024-ABC-4567", "digits only"],
  ])("rejects %s", (input, message) => {
    expect(ghanaPhoneError(input)).toContain(message)
    expect(normalizeGhanaPhone(input)).toBeNull()
  })

  it("formats for display", () => {
    expect(formatGhanaPhone("0241234567")).toBe("024 123 4567")
  })

  it("normalises phones in the booking schema and rejects non-Ghana numbers", () => {
    const base = {
      senderName: "Kwame Asante",
      senderPhone: "+233 24 123 4567",
      senderEmail: "kwame@example.com",
      pickup: "Osu",
      dropoff: "East Legon",
      packageType: "Documents",
      size: "small",
      recipientName: "Ama Mensah",
      recipientPhone: "054 765 4321",
      recipientEmail: "ama@example.com",
      payer: "sender",
      pickupWindow: "now",
    }
    const ok = createDeliverySchema.safeParse(base)
    expect(ok.success && ok.data.senderPhone).toBe("0241234567")
    expect(ok.success && ok.data.recipientPhone).toBe("0547654321")

    const bad = createDeliverySchema.safeParse({ ...base, recipientPhone: "0811234567" })
    expect(bad.success).toBe(false)
  })

  it("rejects a recipient with the sender's phone or email", () => {
    const base = {
      senderName: "Kwame Asante",
      senderPhone: "0241234567",
      senderEmail: "Kwame@Example.com",
      pickup: "Osu",
      dropoff: "East Legon",
      packageType: "Documents",
      size: "small",
      recipientName: "Ama Mensah",
      recipientPhone: "054 765 4321",
      recipientEmail: "ama@example.com",
      payer: "sender",
      pickupWindow: "now",
    }
    const samePhone = createDeliverySchema.safeParse({ ...base, recipientPhone: "+233 24 123 4567" })
    expect(samePhone.success).toBe(false)
    expect(samePhone.error?.issues.map((issue) => issue.path[0])).toContain("recipientPhone")

    const sameEmail = createDeliverySchema.safeParse({ ...base, recipientEmail: "kwame@example.com " })
    expect(sameEmail.success).toBe(false)
    expect(sameEmail.error?.issues.map((issue) => issue.path[0])).toContain("recipientEmail")
  })
})
