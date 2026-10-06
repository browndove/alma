import type { PackageSize } from "./types"

type FareBand = {
  fareGhs: number
  etaMinutes: number
  areas: string[]
}

type Hub = {
  id: "western" | "central"
  name: string
  base: string
  bands: FareBand[]
}

const HUBS: Hub[] = [
  {
    id: "western",
    name: "Hub B · Western Accra",
    base: "Ablekuma",
    bands: [
      {
        fareGhs: 20,
        etaMinutes: 22,
        areas: ["ablekuma", "anyaa", "sowutuom", "santa maria"],
      },
      {
        fareGhs: 30,
        etaMinutes: 32,
        areas: ["odorkor", "lapaz", "mallam", "dansoman", "weija"],
      },
      {
        fareGhs: 45,
        etaMinutes: 42,
        areas: ["kasoa", "buduburam", "amasaman"],
      },
      {
        fareGhs: 50,
        etaMinutes: 50,
        areas: ["east legon", "spintex", "airport residential"],
      },
    ],
  },
  {
    id: "central",
    name: "Hub A · Central Accra",
    base: "Osu",
    bands: [
      {
        fareGhs: 20,
        etaMinutes: 22,
        areas: [
          "kwame nkrumah circle",
          "nkrumah circle",
          "ministry area",
          "jamestown",
          "james town",
          "adabraka",
          "osu",
          "ridge",
        ],
      },
      {
        fareGhs: 30,
        etaMinutes: 32,
        areas: [
          "airport residential",
          "roman ridge",
          "cantonments",
          "abelemkpe",
          "dzorwulu",
          "labone",
        ],
      },
      {
        fareGhs: 40,
        etaMinutes: 42,
        areas: [
          "ashaley botwe",
          "legon campus",
          "east legon",
          "spintex",
          "madina",
          "legon",
        ],
      },
      {
        fareGhs: 55,
        etaMinutes: 55,
        areas: ["sakumono", "lashibi", "adenta", "oyibi", "tema"],
      },
    ],
  },
]

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/gh[c₵]\s*\d+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function areaMatch(haystack: string, area: string) {
  if (area === "ridge") {
    return /(?:^| )ridge(?: |$)/.test(haystack) && !haystack.includes("roman ridge")
  }
  if (area === "legon") {
    return haystack.includes("legon") && !haystack.includes("east legon")
  }
  return haystack.includes(area)
}

function matchInHub(hub: Hub, address: string) {
  const text = normalize(address)
  if (!text) return null

  const ranked = hub.bands.flatMap((band) =>
    band.areas
      .filter((area) => areaMatch(text, area))
      .map((area) => ({ hub, band, area, length: area.length }))
  )

  if (ranked.length === 0) return null
  ranked.sort((a, b) => b.length - a.length)
  return ranked[0]
}

function matchAnyHub(address: string) {
  const hits = HUBS.map((hub) => matchInHub(hub, address)).filter(
    (hit): hit is NonNullable<typeof hit> => Boolean(hit)
  )
  if (hits.length === 0) return null
  hits.sort((a, b) => a.band.fareGhs - b.band.fareGhs || b.length - a.length)
  return hits[0]
}

function sizeSurcharge(size: PackageSize) {
  if (size === "medium") return 8
  if (size === "large") return 18
  return 0
}

export function quoteDeliveryFare(
  pickup: string,
  dropoff: string,
  size: PackageSize
) {
  const origin = matchAnyHub(pickup)
  const destinationInOrigin = origin
    ? matchInHub(origin.hub, dropoff)
    : null
  const destination = destinationInOrigin ?? matchAnyHub(dropoff)

  const matched = origin ?? destination
  if (!matched) {
    const fallback = estimateFareGhs(size)
    return {
      fareGhs: fallback,
      etaMinutes: 32,
      hub: null as string | null,
      originArea: null as string | null,
      destinationArea: null as string | null,
      matched: false,
    }
  }

  const hub = origin?.hub ?? matched.hub
  const band = destination?.band ?? matched.band
  const fareGhs = band.fareGhs + sizeSurcharge(size)

  return {
    fareGhs,
    etaMinutes: band.etaMinutes,
    hub: hub.name,
    originArea: origin?.area ?? null,
    destinationArea: destination?.area ?? null,
    matched: Boolean(origin || destination),
  }
}

export function estimateFareGhs(size: PackageSize) {
  if (size === "medium") return 38
  if (size === "large") return 55
  return 25
}

export function estimateEtaMinutes(pickupWindow: "now" | "schedule") {
  return pickupWindow === "schedule" ? 0 : 32
}

export function formatEtaLabel(
  pickupWindow: "now" | "schedule",
  scheduledAt: string | null,
  etaMinutes: number
) {
  if (pickupWindow === "schedule" && scheduledAt) {
    const date = new Date(scheduledAt)
    return date.toLocaleString("en-GH", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const low = Math.max(15, etaMinutes - 7)
  const high = etaMinutes + 8
  return `${low}–${high} min`
}
