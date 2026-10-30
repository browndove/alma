import type { PackageSize } from "./types"

type Area = {
  name: string
  aliases: string[]
  lat: number
  lng: number
}

type AreaHit = {
  area: Area
  score: number
}

/**
 * Yango-style upfront quote for Accra parcel delivery (not taxi).
 * Lower per-km / per-min than ride-hailing; floor stays GHS 20.
 */
export const MIN_FARE_GHS = 20
export const RATE_PER_KM_GHS = 1.5
export const RATE_PER_MIN_GHS = 0.25
/** Hook for rush / courier-density surge later. */
export const DEMAND_MULTIPLIER = 1

const ACCRA_BOUNDS = {
  minLat: 5.4,
  maxLat: 5.9,
  minLng: -0.55,
  maxLng: 0.12,
}

const OUTSIDE_ACCRA =
  /\b(kumasi|tamale|takoradi|cape coast|sunyani|bolgatanga|koforidua|techiman|tarkwa|ho\b|wa\b|obuasi|sekondi)\b/i

function area(
  name: string,
  lat: number,
  lng: number,
  aliases: string[] = []
): Area {
  return {
    name,
    lat,
    lng,
    aliases: [name, ...aliases].map((item) => item.toLowerCase()),
  }
}

/** Accra gazetteer: name → lat/lng only. Never used for fare bands. */
const AREAS: Area[] = [
  area("Ablekuma", 5.5594, -0.2817, ["ablekuma fanmilk"]),
  area("Anyaa", 5.5978, -0.2794, ["anyaa market"]),
  area("Sowutuom", 5.612, -0.2715, ["sowutuom campus"]),
  area("Santa Maria", 5.5875, -0.2708),
  area("Odorkor", 5.5728, -0.2684, ["odorkor official town"]),
  area("Lapaz", 5.6075, -0.2506, ["new lapaz"]),
  area("Mallam", 5.557, -0.3012, ["mallam junction", "mallam gbawe"]),
  area("Dansoman", 5.5512, -0.2638, ["dansoman last stop"]),
  area("Weija", 5.5658, -0.3226, ["weija barrier", "west hills mall"]),
  area("Kasoa", 5.5344, -0.4168, ["kasoa toll", "kasoa new town"]),
  area("Buduburam", 5.5218, -0.4452, ["buduburam camp"]),
  area("Amasaman", 5.7032, -0.3006),
  area("East Legon", 5.6364, -0.1518, [
    "east legon hills",
    "tetteh quarshie",
    "accra mall",
  ]),
  area("Spintex", 5.6328, -0.1186, ["spintex road", "spintex rd"]),
  area("Airport Residential", 5.6056, -0.1774, [
    "airport residential area",
    "airport city",
    "kotoka",
  ]),
  area("Osu", 5.557, -0.1746, ["oxford street", "oxford st"]),
  area("Ridge", 5.56, -0.1964, ["west ridge", "north ridge"]),
  area("Kwame Nkrumah Circle", 5.5708, -0.2136, [
    "nkrumah circle",
    "circle od palomo",
    "kwame nkrumah",
  ]),
  area("Adabraka", 5.5648, -0.2088),
  area("Jamestown", 5.5356, -0.2118, ["james town", "ga mashie"]),
  area("Ministry Area", 5.55, -0.1968, [
    "ministries",
    "ministry",
    "independence avenue",
  ]),
  area("Roman Ridge", 5.5914, -0.1878),
  area("Cantonments", 5.5766, -0.1732, ["37 military hospital"]),
  area("Labone", 5.5644, -0.1668),
  area("Dzorwulu", 5.6088, -0.1994),
  area("Abelemkpe", 5.5918, -0.2062, ["abelenkpe"]),
  area("Madina", 5.6832, -0.1664, ["madina market", "madina zongo"]),
  area("Ashaley Botwe", 5.6868, -0.1368, ["ashale botwe"]),
  area("Legon Campus", 5.6506, -0.1864, [
    "university of ghana",
    "ug legon",
    "legon",
  ]),
  area("Adenta", 5.7084, -0.1546, ["adenta barrier", "adenta frafraha"]),
  area("Oyibi", 5.7846, -0.1188),
  area("Sakumono", 5.6184, -0.0668, ["sakumono estate"]),
  area("Lashibi", 5.6622, -0.0366, ["lashibi community"]),
  area("Tema", 5.6698, 0.0166, ["tema harbour", "community 1"]),
  area("Accra", 5.6037, -0.187),
]

/** Named neighbourhoods we quote for, for coverage displays. */
export const COVERAGE_AREAS = AREAS.filter((item) => item.name !== "Accra").map(
  ({ name, lat, lng }) => ({ name, lat, lng })
)

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/·/g, " ")
    .replace(/gh[c₵]\s*\d+/g, " ")
    .replace(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function parseCoords(value: string) {
  const match = value.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/)
  if (!match) return null
  const lat = Number(match[1])
  const lng = Number(match[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function inAccraBounds(lat: number, lng: number) {
  return (
    lat >= ACCRA_BOUNDS.minLat &&
    lat <= ACCRA_BOUNDS.maxLat &&
    lng >= ACCRA_BOUNDS.minLng &&
    lng <= ACCRA_BOUNDS.maxLng
  )
}

function mentionsAccra(value: string) {
  return /\b(accra|greater accra|osu|tema|kasoa|legon|spintex|madina|adenta)\b/i.test(
    value
  )
}

function isOutsideAccra(value: string) {
  const coords = parseCoords(value)
  if (coords && !inAccraBounds(coords.lat, coords.lng)) return true
  if (OUTSIDE_ACCRA.test(value) && !mentionsAccra(value)) return true
  return false
}

function aliasMatch(text: string, alias: string) {
  if (alias === "ridge") {
    return /(?:^| )ridge(?: |$)/.test(text) && !text.includes("roman ridge")
  }
  if (alias === "legon") {
    return text.includes("legon") && !text.includes("east legon")
  }
  if (alias === "circle") {
    return /(?:^| )(?:the )?circle(?: |$)/.test(text)
  }
  const escaped = alias
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+")
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(text)
}

function kmBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const toRad = (n: number) => (n * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.min(1, Math.sqrt(s)))
}

function matchTextArea(address: string): AreaHit | null {
  const text = normalize(address)
  if (!text) return null

  const ranked: AreaHit[] = []
  for (const item of AREAS) {
    const hit = item.aliases.find((alias) => aliasMatch(text, alias))
    if (!hit) continue
    ranked.push({ area: item, score: hit.length })
  }

  if (ranked.length === 0) return null
  ranked.sort((a, b) => b.score - a.score)
  return ranked[0] ?? null
}

function matchCoordsArea(coords: { lat: number; lng: number }): AreaHit | null {
  if (!inAccraBounds(coords.lat, coords.lng)) return null

  let best: AreaHit | null = null
  for (const item of AREAS) {
    const km = kmBetween(coords, item)
    if (!best || km < best.score) {
      best = { area: item, score: km }
    }
  }
  if (!best || best.score > 8) return null
  return best
}

/** Resolve an address to coordinates. Gazetteer is location-only. */
function resolvePoint(address: string): {
  point: { lat: number; lng: number } | null
  resolved: boolean
} {
  const coords = parseCoords(address)
  if (coords && inAccraBounds(coords.lat, coords.lng)) {
    return { point: coords, resolved: true }
  }

  const byName = matchTextArea(address)
  if (byName) {
    return {
      point: { lat: byName.area.lat, lng: byName.area.lng },
      resolved: true,
    }
  }

  if (coords) {
    const nearest = matchCoordsArea(coords)
    if (nearest) {
      return { point: coords, resolved: true }
    }
    // Keep explicit map/GPS pins even when outside the Accra gazetteer.
    return { point: coords, resolved: true }
  }

  return { point: null, resolved: false }
}

/**
 * Best-effort lat/lng for Tookan. Prefer embedded map coords, then Accra
 * place-name gazetteer — never leave Tookan to geocode "Osu" globally
 * (it can land in Japan).
 */
export function resolveAddressCoords(address: string): {
  lat: number
  lng: number
} | null {
  return resolvePoint(address).point
}

function sizeSurcharge(size: PackageSize) {
  if (size === "medium") return 8
  if (size === "large") return 18
  return 0
}

function etaFromDistanceKm(km: number) {
  const eta = Math.round(12 + 3.5 * km)
  return Math.min(90, Math.max(15, eta))
}

function fareFromTrip(distanceKm: number, etaMinutes: number, size: PackageSize) {
  const trip =
    (distanceKm * RATE_PER_KM_GHS + etaMinutes * RATE_PER_MIN_GHS) *
    DEMAND_MULTIPLIER
  return Math.ceil(Math.max(MIN_FARE_GHS, trip) + sizeSurcharge(size))
}

export type FareQuote = {
  fareGhs: number
  etaMinutes: number
  covered: boolean
  resolved: boolean
  distanceKm?: number
}

export function quoteDeliveryFare(
  pickup: string,
  dropoff: string,
  size: PackageSize
): FareQuote {
  if (isOutsideAccra(pickup) || isOutsideAccra(dropoff)) {
    return {
      fareGhs: estimateFareGhs(size),
      etaMinutes: 32,
      covered: false,
      resolved: false,
    }
  }

  const origin = resolvePoint(pickup)
  const dest = resolvePoint(dropoff)

  if (origin.point && dest.point) {
    const distanceKm = kmBetween(origin.point, dest.point)
    const etaMinutes = etaFromDistanceKm(distanceKm)
    return {
      fareGhs: fareFromTrip(distanceKm, etaMinutes, size),
      etaMinutes,
      covered: true,
      resolved: origin.resolved && dest.resolved,
      distanceKm: Math.round(distanceKm * 10) / 10,
    }
  }

  // Unresolved Accra addresses: still covered, quote the floor + size.
  return {
    fareGhs: Math.ceil(MIN_FARE_GHS + sizeSurcharge(size)),
    etaMinutes: 32,
    covered: true,
    resolved: false,
  }
}

export function estimateFareGhs(size: PackageSize) {
  return Math.ceil(MIN_FARE_GHS + sizeSurcharge(size))
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
