import type { Delivery, GuideRecommendation } from "@/lib/deliveries/types"
import {
  ApiRequestError,
  formatZodFlatten,
  httpStatusMessage,
  stepForFlatten,
} from "@/lib/api-errors"

type ApiSuccess<T> = { ok: true; data: T }
type ApiFailure = { ok: false; error: string; details?: unknown }

async function parseJson<T>(response: Response): Promise<T> {
  let json: ApiSuccess<T> | ApiFailure | null = null
  try {
    json = (await response.json()) as ApiSuccess<T> | ApiFailure
  } catch {
    throw new ApiRequestError(
      response.ok
        ? "Unexpected response from server"
        : httpStatusMessage(response.status),
      { status: response.status },
    )
  }

  if (!response.ok || !json.ok) {
    const raw =
      json && !json.ok && "error" in json
        ? json.error
        : httpStatusMessage(response.status)
    const details = json && !json.ok ? json.details : null
    const message =
      raw === "Validation failed"
        ? formatZodFlatten(details, "Check the form and try again")
        : raw || httpStatusMessage(response.status)

    throw new ApiRequestError(message, {
      status: response.status,
      details,
      step: stepForFlatten(details),
    })
  }

  return json.data
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(input, init)
  } catch {
    throw new ApiRequestError(
      "Couldn’t reach the server. Check your connection and try again.",
      { status: 0 },
    )
  }
  return parseJson<T>(response)
}

export async function createDeliveryRequest(payload: Record<string, unknown>) {
  return requestJson<{ delivery: Delivery }>("/api/deliveries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export type PaymentStatusPayload = {
  delivery: Delivery
  payUrl: string
}

export async function initializePayment(trackingId: string) {
  return requestJson<{
    delivery: Delivery
    authorizationUrl: string
    accessCode: string
    reference: string
  }>("/api/payments/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackingId }),
  })
}

export async function fetchPaymentStatus(trackingId: string) {
  return requestJson<PaymentStatusPayload>(
    `/api/payments/status?trackingId=${encodeURIComponent(trackingId)}`,
    { cache: "no-store" },
  )
}

export async function verifyPayment(reference: string) {
  return requestJson<{ delivery: Delivery }>("/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference }),
  })
}

export async function resendPayLink(trackingId: string) {
  return requestJson<{ sent: boolean; delivery: Delivery }>(
    "/api/payments/resend",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingId }),
    },
  )
}

export async function fetchRecentDeliveries(adminSecret: string, limit = 75) {
  return requestJson<{ deliveries: Delivery[] }>(
    `/api/deliveries?limit=${limit}`,
    {
      cache: "no-store",
      headers: { "x-admin-secret": adminSecret },
    },
  )
}

export type OpsAgent = {
  fleetId: number
  name: string
  phone: string
  email: string
  isAvailable: boolean
  isActive: boolean
  teamIds: number[]
}

export async function fetchOpsAgents(adminSecret: string) {
  return requestJson<{ agents: OpsAgent[] }>("/api/ops/agents", {
    cache: "no-store",
    headers: { "x-admin-secret": adminSecret },
  })
}

export async function assignOpsRider(
  adminSecret: string,
  trackingId: string,
  fleetId: number,
) {
  return requestJson<{
    delivery: Delivery
    agent: OpsAgent
    results: Array<{ jobId: string; ok: boolean; message: string }>
  }>("/api/ops/assign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": adminSecret,
    },
    body: JSON.stringify({ trackingId, fleetId }),
  })
}

export async function fetchDelivery(trackingId: string) {
  return requestJson<{ delivery: Delivery }>(
    `/api/deliveries/${encodeURIComponent(trackingId)}`,
    { cache: "no-store" },
  )
}

export async function matchDeliveryRider(trackingId: string) {
  return requestJson<{ delivery: Delivery }>(
    `/api/deliveries/${encodeURIComponent(trackingId)}/match`,
    { method: "POST" },
  )
}

export async function requestGuideRecommendation(prompt: string) {
  return requestJson<{ recommendation: GuideRecommendation }>("/api/guide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })
}

export async function reverseGeocode(lat: number, lng: number) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  })
  return requestJson<{
    label: string
    lat: number
    lng: number
    displayName: string
  }>(`/api/geocode/reverse?${params.toString()}`, { cache: "no-store" })
}

export type GeocodeSearchResult = {
  label: string
  lat: number
  lng: number
  displayName: string
}

export async function searchGeocode(query: string) {
  const params = new URLSearchParams({ q: query })
  return requestJson<{ results: GeocodeSearchResult[] }>(
    `/api/geocode/search?${params.toString()}`,
    { cache: "no-store" },
  )
}
