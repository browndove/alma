import {
  HUBS,
  LARGE_SURCHARGE_GHS,
  PRICE_AREAS,
  TRAFFIC_WINDOWS,
  type Hub,
  type HubId,
  type PriceArea,
  type PriceRange,
} from "./price-list"
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

/** Lowest price on the list — used for "From GH₵…" copy across the site. */
export const MIN_FARE_GHS = Math.min(
  ...PRICE_AREAS.flatMap((item) => [item.prices.makola[0], item.prices.ablekuma[0]]),
)

/** A pinned drop-off within this distance of a listed area takes its price. */
const DROPOFF_MATCH_KM = 2
/** A pickup must be this close to a listed area to be in our coverage. */
const PICKUP_COVERAGE_KM = 3

/** Rough mainland Ghana bounding box (blocks foreign map pins). */
const GHANA_BOUNDS = {
  minLat: 4.5,
  maxLat: 11.2,
  minLng: -3.35,
  maxLng: 1.3,
}

const OUTSIDE_GHANA =
  /\b(nigeria|lagos|abuja|togo|lome|ivory coast|cote d.?ivoire|abidjan|burkina|ouagadougou|benin|cotonou|berlin|london|dubai|japan|tokyo|usa|new york)\b/i

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

/** Place gazetteer: name → lat/lng only. Never used for fare bands. */
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
  // Wider Ghana cities (typed names → Tookan pins)
  area("Kumasi", 6.6885, -1.6244, ["kejetia", "aduato"]),
  area("Tamale", 9.4034, -0.8424),
  area("Takoradi", 4.9016, -1.7831, ["sekondi", "sekondi takoradi"]),
  area("Cape Coast", 5.1053, -1.2466),
  area("Sunyani", 7.3399, -2.3268),
  area("Bolgatanga", 10.7856, -0.8514),
  area("Koforidua", 6.0941, -0.2591),
  area("Techiman", 7.5836, -1.9395),
  area("Ho", 6.6009, 0.4713),
  area("Wa", 10.0601, -2.5099),
  area("Obuasi", 6.2023, -1.6641),
]

/** Listed price-list areas also resolve typed names to coordinates. */
const GAZETTEER: Area[] = [
  ...PRICE_AREAS.map((item) =>
    area(item.name, item.lat, item.lng, [...item.aliases])
  ),
  ...AREAS,
]

/** Every area on the price list, for coverage displays. */
export const COVERAGE_AREAS = PRICE_AREAS.map(({ name, lat, lng, section }) => ({
  name,
  lat,
  lng,
  section,
}))

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

function inGhanaBounds(lat: number, lng: number) {
  return (
    lat >= GHANA_BOUNDS.minLat &&
    lat <= GHANA_BOUNDS.maxLat &&
    lng >= GHANA_BOUNDS.minLng &&
    lng <= GHANA_BOUNDS.maxLng
  )
}

function mentionsGhana(value: string) {
  return /\b(ghana|accra|kumasi|tamale|takoradi|tema|kasoa|cape coast|sunyani)\b/i.test(
    value
  )
}

function isOutsideGhana(value: string) {
  const coords = parseCoords(value)
  // A pinned point decides on its own — "Lagos Avenue, East Legon" is in Accra.
  if (coords) return !inGhanaBounds(coords.lat, coords.lng)
  if (OUTSIDE_GHANA.test(value) && !mentionsGhana(value)) return true
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
  return aliasPattern(alias).test(text)
}

/** Whole-word, whitespace-tolerant pattern for one place name. */
function aliasPattern(alias: string) {
  const escaped = alias
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+")
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`)
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
  for (const item of GAZETTEER) {
    const hit = item.aliases.find((alias) => aliasMatch(text, alias))
    if (!hit) continue
    ranked.push({ area: item, score: hit.length })
  }

  if (ranked.length === 0) return null
  ranked.sort((a, b) => b.score - a.score)
  return ranked[0] ?? null
}

function matchCoordsArea(coords: { lat: number; lng: number }): AreaHit | null {
  if (!inGhanaBounds(coords.lat, coords.lng)) return null

  let best: AreaHit | null = null
  for (const item of GAZETTEER) {
    const km = kmBetween(coords, item)
    if (!best || km < best.score) {
      best = { area: item, score: km }
    }
  }
  if (!best || best.score > 25) return null
  return best
}

/** Resolve an address to coordinates. Gazetteer is location-only. */
function resolvePoint(address: string): {
  point: { lat: number; lng: number } | null
  resolved: boolean
} {
  const coords = parseCoords(address)
  if (coords && inGhanaBounds(coords.lat, coords.lng)) {
    return { point: coords, resolved: true }
  }

  const byName = matchTextArea(address)
  if (byName) {
    return {
      point: { lat: byName.area.lat, lng: byName.area.lng },
      resolved: true,
    }
  }

  if (coords && inGhanaBounds(coords.lat, coords.lng)) {
    const nearest = matchCoordsArea(coords)
    if (nearest) {
      return { point: coords, resolved: true }
    }
    return { point: coords, resolved: true }
  }

  return { point: null, resolved: false }
}

/**
 * Best-effort lat/lng for Tookan. Prefer embedded map coords, then Ghana
 * place-name gazetteer — never leave Tookan to geocode "Osu" globally
 * (it can land in Japan).
 */
export function resolveAddressCoords(address: string): {
  lat: number
  lng: number
} | null {
  return resolvePoint(address).point
}

function etaFromDistanceKm(km: number) {
  const eta = Math.round(12 + 3.5 * km)
  // Allow longer ETAs for intercity Ghana trips (Accra ↔ Kumasi, etc.).
  return Math.min(480, Math.max(15, eta))
}

/**
 * Which listed area an address is in. Address labels run specific → general
 * ("Osu, Ringway Estates, La, Accra"), so the earliest match wins, then the
 * longest. Purely numeric names (the "37" area) only match via their aliases.
 */
function matchPriceAreaByText(address: string): PriceArea | null {
  const text = normalize(address)
  if (!text) return null
  let best: { item: PriceArea; index: number; length: number } | null = null
  for (const item of PRICE_AREAS) {
    const names = /[a-z]/i.test(item.name)
      ? [item.name.toLowerCase(), ...item.aliases]
      : [...item.aliases]
    for (const name of names) {
      if (!aliasMatch(text, name)) continue
      const index = text.search(aliasPattern(name))
      const candidate = { item, index: Math.max(0, index), length: name.length }
      if (
        !best ||
        candidate.index < best.index ||
        (candidate.index === best.index && candidate.length > best.length)
      ) {
        best = candidate
      }
    }
  }
  return best?.item ?? null
}

function nearestPriceArea(point: { lat: number; lng: number }) {
  let best: { item: PriceArea; km: number } | null = null
  for (const item of PRICE_AREAS) {
    const km = kmBetween(point, item)
    if (!best || km < best.km) best = { item, km }
  }
  return best
}

function nearestHub(point: { lat: number; lng: number }): Hub {
  return [...HUBS].sort((a, b) => kmBetween(point, a) - kmBetween(point, b))[0]!
}

export type TrafficBand = "quiet" | "daytime" | "rush"

export const TRAFFIC_LABELS: Record<TrafficBand, string> = {
  quiet: "Quiet hours",
  daytime: "Daytime",
  rush: "Rush hour",
}

function minutesOf(clock: string) {
  const [hours, minutes] = clock.split(":").map(Number)
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

/** Traffic band for a delivery time, read in Accra local time. */
export function trafficBand(when: Date): TrafficBand {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(when)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""
  if (get("weekday") === "Sat" || get("weekday") === "Sun") return "quiet"
  const minutes = Number(get("hour")) * 60 + Number(get("minute"))
  const inside = (window: { start: string; end: string }) =>
    minutes >= minutesOf(window.start) && minutes < minutesOf(window.end)
  if (inside(TRAFFIC_WINDOWS.morningRush) || inside(TRAFFIC_WINDOWS.eveningRush)) {
    return "rush"
  }
  if (minutes >= minutesOf(TRAFFIC_WINDOWS.morningRush.end) &&
      minutes < minutesOf(TRAFFIC_WINDOWS.eveningRush.start)) {
    return "daytime"
  }
  return "quiet"
}

/** Traffic picks the price inside the area's range: quiet = low, daytime = middle, rush = high. */
export function priceForTraffic(range: PriceRange, band: TrafficBand) {
  const [low, high] = range
  if (band === "quiet") return low
  if (band === "rush") return high
  return Math.ceil((low + high) / 2)
}

export function sizeSurchargeGhs(size: PackageSize) {
  return size === "large" ? LARGE_SURCHARGE_GHS : 0
}

export type FareQuote = {
  fareGhs: number
  etaMinutes: number
  /** Inside Ghana at all. */
  covered: boolean
  /** Both pickup and drop-off are placed on the map. */
  resolved: boolean
  /** Outside the listed areas — customer must call / WhatsApp for a price. */
  needsQuote: boolean
  quoteReason?: "pickup" | "dropoff"
  distanceKm?: number
  hub?: { id: HubId; name: string }
  area?: { name: string; section: string }
  range?: PriceRange
  traffic?: TrafficBand
  /** Area price at each traffic band (before any size surcharge). */
  bandPrices?: Record<TrafficBand, number>
  surchargeGhs?: number
}

/**
 * Price from the Diatel list: the package goes to the hub closest to the
 * pickup and is delivered from there, so the price is that hub's range for
 * the drop-off area. Traffic at `when` (the scheduled time, or now) picks the
 * price inside the range; Large parcels add a fixed surcharge.
 */
export function quoteDeliveryFare(
  pickup: string,
  dropoff: string,
  size: PackageSize,
  when: Date = new Date()
): FareQuote {
  if (isOutsideGhana(pickup) || isOutsideGhana(dropoff)) {
    return {
      fareGhs: MIN_FARE_GHS,
      etaMinutes: 32,
      covered: false,
      resolved: false,
      needsQuote: false,
    }
  }

  const origin = resolvePoint(pickup)
  const dest = resolvePoint(dropoff)
  if (!origin.point || !dest.point) {
    return {
      fareGhs: MIN_FARE_GHS,
      etaMinutes: 32,
      covered: true,
      resolved: false,
      needsQuote: false,
    }
  }

  const distanceKm = kmBetween(origin.point, dest.point)
  const etaMinutes = etaFromDistanceKm(distanceKm)
  const base = {
    etaMinutes,
    covered: true,
    resolved: true,
    distanceKm: Math.round(distanceKm * 10) / 10,
  }

  const pickupInCoverage =
    matchPriceAreaByText(pickup) !== null ||
    (nearestPriceArea(origin.point)?.km ?? Infinity) <= PICKUP_COVERAGE_KM
  if (!pickupInCoverage) {
    return { ...base, fareGhs: MIN_FARE_GHS, needsQuote: true, quoteReason: "pickup" }
  }

  const textArea = matchPriceAreaByText(dropoff)
  const nearest = textArea ? null : nearestPriceArea(dest.point)
  const area =
    textArea ?? (nearest && nearest.km <= DROPOFF_MATCH_KM ? nearest.item : null)
  if (!area) {
    return { ...base, fareGhs: MIN_FARE_GHS, needsQuote: true, quoteReason: "dropoff" }
  }

  const hub = nearestHub(origin.point)
  const range = area.prices[hub.id]
  const traffic = trafficBand(when)
  const surchargeGhs = sizeSurchargeGhs(size)
  return {
    ...base,
    fareGhs: priceForTraffic(range, traffic) + surchargeGhs,
    needsQuote: false,
    hub: { id: hub.id, name: hub.name },
    area: { name: area.name, section: area.section },
    range,
    traffic,
    bandPrices: {
      quiet: priceForTraffic(range, "quiet"),
      daytime: priceForTraffic(range, "daytime"),
      rush: priceForTraffic(range, "rush"),
    },
    surchargeGhs,
  }
}

export function formatEtaLabel(
  pickupWindow: "now" | "schedule",
  scheduledAt: string | null,
  etaMinutes: number
) {
  if (pickupWindow === "schedule" && scheduledAt) {
    const date = new Date(scheduledAt)
    return date.toLocaleString("en-GH", {
      timeZone: "Africa/Accra",
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
