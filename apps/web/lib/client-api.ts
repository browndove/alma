import type { Delivery, GuideRecommendation } from "@/lib/deliveries/types"

type ApiSuccess<T> = { ok: true; data: T }
type ApiFailure = { ok: false; error: string; details?: unknown }

async function parseJson<T>(response: Response): Promise<T> {
  const json = (await response.json()) as ApiSuccess<T> | ApiFailure
  if (!response.ok || !json.ok) {
    const message =
      !json.ok && "error" in json ? json.error : "Request failed"
    throw new Error(message)
  }
  return json.data
}

export async function createDeliveryRequest(payload: Record<string, unknown>) {
  const response = await fetch("/api/deliveries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return parseJson<{ delivery: Delivery }>(response)
}

export async function fetchDelivery(trackingId: string) {
  const response = await fetch(
    `/api/deliveries/${encodeURIComponent(trackingId)}`,
    { cache: "no-store" }
  )
  return parseJson<{ delivery: Delivery }>(response)
}

export async function matchDeliveryRider(trackingId: string) {
  const response = await fetch(
    `/api/deliveries/${encodeURIComponent(trackingId)}/match`,
    { method: "POST" }
  )
  return parseJson<{ delivery: Delivery }>(response)
}

export async function requestGuideRecommendation(prompt: string) {
  const response = await fetch("/api/guide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })
  return parseJson<{ recommendation: GuideRecommendation }>(response)
}

export async function reverseGeocode(lat: number, lng: number) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  })
  const response = await fetch(`/api/geocode/reverse?${params.toString()}`, {
    cache: "no-store",
  })
  return parseJson<{
    label: string
    lat: number
    lng: number
    displayName: string
  }>(response)
}
