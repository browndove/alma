import { z } from "zod"

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api"

export const runtime = "nodejs"

/** Greater Accra viewbox: left, top, right, bottom (lon/lat). */
const ACCRA_VIEWBOX = "-0.55,5.9,0.12,5.4"

const querySchema = z.object({
  q: z.string().trim().min(2).max(120),
})

type NominatimAddress = {
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
  display_name?: string
  address?: NominatimAddress
}

function formatAddress(item: NominatimSearchItem): string {
  const address = item.address
  if (!address) {
    return item.display_name?.trim() || "Selected location"
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
  const parts = [street, area, city].filter(
    (part, index, list) => Boolean(part) && list.indexOf(part) === index
  )

  if (parts.length > 0) return parts.join(", ")
  return item.display_name?.trim() || "Selected location"
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    q: searchParams.get("q"),
  })

  if (!parsed.success) {
    return zodErrorResponse(parsed.error)
  }

  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("q", parsed.data.q)
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("limit", "6")
  url.searchParams.set("viewbox", ACCRA_VIEWBOX)
  url.searchParams.set("bounded", "1")
  url.searchParams.set("countrycodes", "gh")

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "DiatelDelivery/1.0 (https://diatel.app)",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return jsonError("Could not search locations", 502)
    }

    const data = (await response.json()) as NominatimSearchItem[]
    const results = (Array.isArray(data) ? data : [])
      .map((item) => {
        const lat = Number(item.lat)
        const lng = Number(item.lon)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
        const label = formatAddress(item)
        return {
          label,
          lat,
          lng,
          displayName: item.display_name ?? label,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))

    return jsonOk({ results })
  } catch {
    return jsonError("Location search failed", 502)
  }
}
