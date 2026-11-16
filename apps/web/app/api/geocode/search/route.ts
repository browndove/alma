import { z } from "zod"

import { jsonError, jsonOk, siteLockResponse, zodErrorResponse } from "@/lib/api"

export const runtime = "nodejs"

/** Greater Accra soft bias (lon/lat): left, top, right, bottom. */
const ACCRA_VIEWBOX = "-0.55,5.95,0.15,5.35"

/** Hard filter after a broader Ghana search. */
const ACCRA_BOUNDS = {
  minLat: 5.3,
  maxLat: 5.95,
  minLng: -0.55,
  maxLng: 0.2,
}

const querySchema = z.object({
  q: z.string().trim().min(2).max(120),
})

type NominatimAddress = {
  amenity?: string
  shop?: string
  tourism?: string
  building?: string
  office?: string
  leisure?: string
  house_number?: string
  road?: string
  pedestrian?: string
  neighbourhood?: string
  suburb?: string
  city_district?: string
  city?: string
  town?: string
  village?: string
  county?: string
  state?: string
  country?: string
}

type NominatimSearchItem = {
  lat: string
  lon: string
  name?: string
  display_name?: string
  address?: NominatimAddress
  importance?: number
}

const ABBREVIATIONS: Array<[RegExp, string]> = [
  [/\bpresby\b/gi, "presbyterian"],
  [/\buniv\b/gi, "university"],
  [/\bst\.?\b/gi, "street"],
  [/\brd\.?\b/gi, "road"],
  [/\bave\.?\b/gi, "avenue"],
  [/\bjnc\b/gi, "junction"],
  [/\bmkt\b/gi, "market"],
]

function expandQuery(raw: string) {
  let next = raw.trim().replace(/\s+/g, " ")
  for (const [pattern, replacement] of ABBREVIATIONS) {
    next = next.replace(pattern, replacement)
  }
  return next
}

function buildQueries(query: string) {
  const lower = query.toLowerCase()
  const hasGhana = lower.includes("ghana")
  const hasAccra =
    lower.includes("accra") ||
    lower.includes("tema") ||
    lower.includes("kumasi")

  const queries: string[] = []

  // Prefer the shortest Accra-local form first so places like Adenta /
  // Madina resolve in one Nominatim call instead of waiting on fallbacks.
  if (!hasAccra && !hasGhana) {
    queries.push(`${query}, Greater Accra, Ghana`)
    queries.push(`${query}, Accra, Ghana`)
  } else if (!hasGhana) {
    queries.push(`${query}, Ghana`)
  }
  queries.push(query)
  if (!hasGhana) queries.push(`${query} Ghana`)

  return Array.from(new Set(queries))
}

function formatAddress(item: NominatimSearchItem): string {
  const address = item.address
  const poi =
    item.name ||
    address?.amenity ||
    address?.shop ||
    address?.tourism ||
    address?.building ||
    address?.office ||
    address?.leisure

  if (!address) {
    return poi || item.display_name?.trim() || "Selected location"
  }

  const street = [address.house_number, address.road || address.pedestrian]
    .filter(Boolean)
    .join(" ")
  const area =
    address.neighbourhood ||
    address.suburb ||
    address.city_district ||
    address.village ||
    address.town
  const city = address.city || address.town || address.county || address.state
  const parts = [poi, street, area, city].filter(
    (part, index, list) => Boolean(part) && list.indexOf(part) === index,
  )

  if (parts.length > 0) return parts.join(", ")
  return item.display_name?.trim() || "Selected location"
}

function inAccra(lat: number, lng: number) {
  return (
    lat >= ACCRA_BOUNDS.minLat &&
    lat <= ACCRA_BOUNDS.maxLat &&
    lng >= ACCRA_BOUNDS.minLng &&
    lng <= ACCRA_BOUNDS.maxLng
  )
}

async function nominatimSearch(query: string, limit = 10) {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("q", query)
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("countrycodes", "gh")
  // Soft Accra bias — hard bounded=1 was dropping churches / landmarks.
  url.searchParams.set("viewbox", ACCRA_VIEWBOX)
  url.searchParams.set("bounded", "0")

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "DiatelDelivery/1.0 (https://diateldelivery.com)",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Nominatim ${response.status}`)
  }

  const data = (await response.json()) as NominatimSearchItem[]
  return Array.isArray(data) ? data : []
}

function mapResults(items: NominatimSearchItem[]) {
  const seen = new Set<string>()
  const mapped = []

  const ranked = [...items].sort(
    (a, b) => (b.importance ?? 0) - (a.importance ?? 0),
  )

  for (const item of ranked) {
    const lat = Number(item.lat)
    const lng = Number(item.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    if (!inAccra(lat, lng)) continue
    const label = formatAddress(item)
    const key = `${label.toLowerCase()}|${lat.toFixed(4)}|${lng.toFixed(4)}`
    if (seen.has(key)) continue
    seen.add(key)
    mapped.push({
      label,
      lat,
      lng,
      displayName: item.display_name ?? label,
    })
  }

  return mapped
}

export async function GET(request: Request) {
  const locked = siteLockResponse()
  if (locked) return locked

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    q: searchParams.get("q"),
  })

  if (!parsed.success) {
    return zodErrorResponse(parsed.error)
  }

  const expanded = expandQuery(parsed.data.q)
  const queries = buildQueries(expanded)

  try {
    let results: ReturnType<typeof mapResults> = []
    let lastError: unknown = null

    // Cap fallbacks so a slow Nominatim chain can't outlive the next keystroke
    // and return empty after a better later query already succeeded.
    for (let index = 0; index < Math.min(queries.length, 2); index++) {
      const query = queries[index]!
      if (index > 0) {
        await new Promise((resolve) => setTimeout(resolve, 900))
      }
      try {
        results = mapResults(await nominatimSearch(query))
        if (results.length > 0) break
      } catch (error) {
        lastError = error
      }
    }

    if (results.length === 0 && lastError && queries.length === 1) {
      throw lastError
    }

    return jsonOk({ results: results.slice(0, 8) })
  } catch {
    return jsonError("Location search failed", 502)
  }
}
