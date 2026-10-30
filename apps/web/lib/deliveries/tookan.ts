export interface TookanTaskParams {
  trackingId: string
  senderName: string
  senderPhone: string
  senderEmail?: string
  pickupAddress: string
  pickupLatitude?: number
  pickupLongitude?: number
  recipientName: string
  recipientPhone: string
  recipientEmail?: string
  deliveryAddress: string
  deliveryLatitude?: number
  deliveryLongitude?: number
  jobDescription?: string
  jobPickupDatetime?: string
  jobDeliveryDatetime?: string
}

export interface TookanTaskResult {
  jobId: number | string
  pickupJobId?: number | string
  deliveryJobId?: number | string
  trackingLink?: string
}

/** Pull "5.55329, -0.24256" out of map-picker labels like "Street · 5.55, -0.24". */
export function parseCoordsFromAddress(address: string): {
  label: string
  lat?: number
  lng?: number
} {
  const match = address.match(
    /^(.*?)(?:\s*[·•|,]\s*)?(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/,
  )
  if (!match) return { label: address.trim() }
  const lat = Number(match[2])
  const lng = Number(match[3])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { label: address.trim() }
  }
  return {
    label: (match[1] || address).trim() || address.trim(),
    lat,
    lng,
  }
}

function tookanConfig() {
  return {
    apiKey: process.env.TOOKAN_API_KEY?.trim() || "",
    apiUrl: (process.env.TOOKAN_API_URL || "https://api.tookanapp.com/v2").replace(
      /\/$/,
      "",
    ),
    // Default team from the live Diatel Tookan account.
    teamId: process.env.TOOKAN_TEAM_ID?.trim() || "1900673",
  }
}

function toTookanStamp(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ")
}

function asCoord(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : ""
}

export async function createTookanTask(
  params: TookanTaskParams,
): Promise<TookanTaskResult | null> {
  const { apiKey, apiUrl, teamId } = tookanConfig()
  if (!apiKey) {
    console.log("[Tookan] TOOKAN_API_KEY missing, skipping task dispatch.")
    return null
  }

  const now = new Date()
  const pickupParsed = parseCoordsFromAddress(params.pickupAddress)
  const deliveryParsed = parseCoordsFromAddress(params.deliveryAddress)

  const pickupLat = params.pickupLatitude ?? pickupParsed.lat
  const pickupLng = params.pickupLongitude ?? pickupParsed.lng
  const deliveryLat = params.deliveryLatitude ?? deliveryParsed.lat
  const deliveryLng = params.deliveryLongitude ?? deliveryParsed.lng

  if (
    pickupLat == null ||
    pickupLng == null ||
    deliveryLat == null ||
    deliveryLng == null
  ) {
    console.error("[Tookan] refusing task — missing coordinates", {
      trackingId: params.trackingId,
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
    })
    return null
  }

  const autoAssignment = Number(process.env.TOOKAN_AUTO_ASSIGNMENT ?? 0) === 1 ? 1 : 0

  const payload: Record<string, unknown> = {
    api_key: apiKey,
    order_id: params.trackingId,
    auto_assignment: autoAssignment,
    job_description:
      params.jobDescription || `Tracking: ${params.trackingId}`,
    // Pickup stop
    job_pickup_name: params.senderName,
    job_pickup_phone: params.senderPhone,
    job_pickup_email: params.senderEmail || "",
    job_pickup_address: pickupParsed.label || params.pickupAddress,
    job_pickup_latitude: asCoord(pickupLat),
    job_pickup_longitude: asCoord(pickupLng),
    job_pickup_datetime:
      params.jobPickupDatetime || toTookanStamp(now),
    // Delivery stop
    customer_username: params.recipientName,
    customer_phone: params.recipientPhone,
    customer_email: params.recipientEmail || "",
    customer_address: deliveryParsed.label || params.deliveryAddress,
    latitude: asCoord(deliveryLat),
    longitude: asCoord(deliveryLng),
    job_delivery_datetime:
      params.jobDeliveryDatetime ||
      toTookanStamp(new Date(now.getTime() + 2 * 3600 * 1000)),
    has_pickup: 1,
    has_delivery: 1,
    layout_type: 0,
    tracking_link: 1,
    // Tookan expects UTC offset in *minutes* (FAQ): local + timezone = UTC.
    // Ghana / GMT is 0. India would be -330; Germany CET would be -60.
    timezone: Number(process.env.TOOKAN_TIMEZONE_MINUTES ?? 0),
    meta_data: [
      { label: "tracking_id", data: params.trackingId },
      { label: "Tracking code", data: params.trackingId },
    ],
    tags: params.trackingId,
  }

  if (teamId) {
    payload.team_id = teamId
  }

  try {
    const res = await fetch(`${apiUrl}/create_task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const data = (await res.json()) as {
      status?: number
      message?: string
      data?: {
        job_id?: number | string
        pickup_job_id?: number | string
        delivery_job_id?: number | string
        tracking_link?: string
        pickup_tracking_link?: string
        delivery_tracing_link?: string
        delivery_tracking_link?: string
      }
    }

    if (data.status === 200 && data.data?.job_id != null) {
      const pickupJobId = data.data.pickup_job_id ?? data.data.job_id
      const deliveryJobId = data.data.delivery_job_id ?? data.data.job_id
      const trackingLink =
        data.data.delivery_tracking_link ||
        data.data.delivery_tracing_link ||
        data.data.tracking_link ||
        data.data.pickup_tracking_link ||
        `https://tkng.io/${data.data.job_id}`

      console.log(
        `[Tookan] created pickup=${pickupJobId} delivery=${deliveryJobId} for ${params.trackingId}`,
      )

      return {
        // Prefer delivery job as the primary id admins follow after pickup.
        jobId: deliveryJobId,
        pickupJobId,
        deliveryJobId,
        trackingLink,
      }
    }

    console.error("[Tookan] Failed to create task:", {
      http: res.status,
      status: data.status,
      message: data.message,
      data: data.data,
      trackingId: params.trackingId,
    })
    return null
  } catch (error) {
    console.error("[Tookan] Network error during task creation:", error)
    return null
  }
}

export async function getTookanJobDetails(jobId: string | number) {
  const { apiKey, apiUrl } = tookanConfig()
  if (!apiKey) return null

  try {
    const res = await fetch(`${apiUrl}/get_job_details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        job_ids: [jobId],
      }),
    })
    const data = await res.json()
    return data.status === 200 ? data.data : null
  } catch (err) {
    console.error("[Tookan] Failed to get job details:", err)
    return null
  }
}

export async function cancelTookanTask(
  jobId: string | number,
  reason = "Cancelled by user",
) {
  const { apiKey, apiUrl } = tookanConfig()
  if (!apiKey) return false

  try {
    const res = await fetch(`${apiUrl}/cancel_task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        job_id: jobId,
        job_status: 9,
        reason,
      }),
    })
    const data = await res.json()
    return data.status === 200
  } catch (err) {
    console.error("[Tookan] Failed to cancel task:", err)
    return false
  }
}
