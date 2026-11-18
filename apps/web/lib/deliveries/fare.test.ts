import { describe, expect, it } from "vitest"

import { quoteDeliveryFare, trafficBand } from "./fare"
import { LARGE_SURCHARGE_GHS } from "./price-list"

describe("quoteDeliveryFare coverage", () => {
  it("trusts in-Ghana map coords over an outside-Ghana place name", () => {
    const quote = quoteDeliveryFare(
      "Lagos Avenue, East Legon · 5.63650, -0.16090",
      "Osu Oxford Street · 5.55600, -0.18200",
      "small",
    )
    expect(quote.covered).toBe(true)
  })

  it("blocks pins outside Ghana even when the label mentions Accra", () => {
    const quote = quoteDeliveryFare(
      "Accra Road, Lagos · 6.52440, 3.37920",
      "Osu Oxford Street · 5.55600, -0.18200",
      "small",
    )
    expect(quote.covered).toBe(false)
  })

  it("still blocks plain-text foreign addresses", () => {
    const quote = quoteDeliveryFare("Lekki, Lagos", "Osu", "small")
    expect(quote.covered).toBe(false)
  })
})

describe("quoteDeliveryFare price list", () => {
  const MAKOLA = "Makola Market, Accra Central · 5.54807, -0.20693"
  const AWOSHIE = "Awoshie, Kwashieman · 5.58730, -0.27810"

  // Accra is GMT all year. 18 Nov 2026 is a Wednesday, 21 Nov a Saturday.
  const RUSH = new Date(Date.UTC(2026, 10, 18, 8, 0))
  const DAYTIME = new Date(Date.UTC(2026, 10, 18, 12, 0))
  const QUIET = new Date(Date.UTC(2026, 10, 18, 21, 0))
  const WEEKEND_MORNING = new Date(Date.UTC(2026, 10, 21, 8, 0))

  it("prices from the hub closest to the pickup, by drop-off area and traffic", () => {
    const rush = quoteDeliveryFare(MAKOLA, "Osu, Ringway Estates, La, Accra · 5.56060, -0.18240", "small", RUSH)
    expect(rush.hub?.id).toBe("makola")
    expect(rush.area?.name).toBe("Osu")
    expect(rush.range).toEqual([30, 40])
    expect(rush.traffic).toBe("rush")
    expect(rush.fareGhs).toBe(40)
    expect(quoteDeliveryFare(MAKOLA, "Osu", "small", DAYTIME).fareGhs).toBe(35)
    expect(quoteDeliveryFare(MAKOLA, "Osu", "small", QUIET).fareGhs).toBe(30)
    expect(quoteDeliveryFare(MAKOLA, "Osu", "small", WEEKEND_MORNING).traffic).toBe("quiet")
  })

  it("adds the large-parcel surcharge on top of the traffic price", () => {
    const large = quoteDeliveryFare(MAKOLA, "Osu", "large", QUIET)
    expect(large.surchargeGhs).toBe(LARGE_SURCHARGE_GHS)
    expect(large.fareGhs).toBe(30 + LARGE_SURCHARGE_GHS)
    expect(quoteDeliveryFare(MAKOLA, "Osu", "medium", QUIET).fareGhs).toBe(30)
  })

  it("draws the traffic boundaries in Accra time", () => {
    expect(trafficBand(new Date(Date.UTC(2026, 10, 18, 6, 29)))).toBe("quiet")
    expect(trafficBand(new Date(Date.UTC(2026, 10, 18, 6, 30)))).toBe("rush")
    expect(trafficBand(new Date(Date.UTC(2026, 10, 18, 9, 30)))).toBe("daytime")
    expect(trafficBand(new Date(Date.UTC(2026, 10, 18, 16, 0)))).toBe("rush")
    expect(trafficBand(new Date(Date.UTC(2026, 10, 18, 19, 30)))).toBe("quiet")
  })

  it("uses the Ablekuma hub when the pickup is nearer to it", () => {
    const quote = quoteDeliveryFare(AWOSHIE, "Dansoman", "small")
    expect(quote.hub?.id).toBe("ablekuma")
    expect(quote.range).toEqual([25, 35])
  })

  it("matches the most specific place in a map label", () => {
    expect(quoteDeliveryFare(MAKOLA, "La Bawaleshie, East Legon Extension", "small").area?.name).toBe("Bawaleshie")
    expect(quoteDeliveryFare(MAKOLA, "37 Military Hospital, Cantonments, La", "small").area?.name).toBe("37")
    expect(quoteDeliveryFare(MAKOLA, "Plot 37, Dansoman", "small").area?.name).toBe("Dansoman")
    expect(quoteDeliveryFare(MAKOLA, "Tema Community 18", "small").area?.name).toBe("Tema Community 18")
  })

  it("prices a bare map pin by the nearest listed area", () => {
    // A pin in East Legon with only coordinates in the text.
    const quote = quoteDeliveryFare(MAKOLA, "Selected location · 5.63550, -0.16170", "small")
    expect(quote.needsQuote).toBe(false)
    expect(quote.area?.name).toBe("East Legon")
  })

  it("asks for a quote outside the listed coverage", () => {
    const farDropoff = quoteDeliveryFare(MAKOLA, "Kejetia, Kumasi", "small")
    expect(farDropoff.needsQuote).toBe(true)
    expect(farDropoff.quoteReason).toBe("dropoff")

    const farPickup = quoteDeliveryFare("Kejetia, Kumasi", "Osu", "small")
    expect(farPickup.needsQuote).toBe(true)
    expect(farPickup.quoteReason).toBe("pickup")
  })
})
