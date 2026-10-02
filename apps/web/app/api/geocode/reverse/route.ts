import { z } from "zod"

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api"

export const runtime = "nodejs"

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
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

type NominatimResponse = {
  display_name?: string
  address?: NominatimAddress
}

function formatAddress(data: NominatimResponse): string {
  const address = data.address
  if (!address) {
    return data.display_name?.trim() || "Current location"
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
  return data.display_name?.trim() || "Current location"
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
  })

  if (!parsed.success) {
    return zodErrorResponse(parsed.error)
  }

  const { lat, lng } = parsed.data
  const url = new URL("https://nominatim.openstreetmap.org/reverse")
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("lat", String(lat))
  url.searchParams.set("lon", String(lng))
  url.searchParams.set("zoom", "18")
  url.searchParams.set("addressdetails", "1")

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "DiatelDelivery/1.0 (https://diatel.app)",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return jsonError("Could not look up that location", 502)
    }

    const data = (await response.json()) as NominatimResponse
    const label = formatAddress(data)

    return jsonOk({
      label,
      lat,
      lng,
      displayName: data.display_name ?? label,
    })
  } catch {
    return jsonError("Location lookup failed", 502)
  }
}
