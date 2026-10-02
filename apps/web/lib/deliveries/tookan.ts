const TOOKAN_API_KEY = process.env.TOOKAN_API_KEY
const TOOKAN_API_URL = process.env.TOOKAN_API_URL || "https://api.tookanapp.com/v2"

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
}

export interface TookanTaskResult {
  jobId: number | string
  pickupJobId?: number | string
  deliveryJobId?: number | string
  trackingLink?: string
}

export async function createTookanTask(
  params: TookanTaskParams
): Promise<TookanTaskResult | null> {
  if (!TOOKAN_API_KEY) {
    console.log("[Tookan] TOOKAN_API_KEY missing, skipping task dispatch.")
    return null
  }

  const payload = {
    api_key: TOOKAN_API_KEY,
    customer_email: params.senderEmail || "",
    customer_username: params.senderName,
    customer_phone: params.senderPhone,
    customer_address: params.pickupAddress,
    latitude: params.pickupLatitude ?? "",
    longitude: params.pickupLongitude ?? "",
    job_description: params.jobDescription || "Standard Parcel Delivery",
    job_pickup_datetime: new Date().toISOString().slice(0, 19).replace("T", " "),
    job_delivery_datetime: new Date(Date.now() + 2 * 3600 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " "),
    has_pickup: "1",
    has_delivery: "1",
    layout_type: "0",
    tracking_link: 1,
    timezone: "-60",
    meta_data: [{ label: "tracking_id", data: params.trackingId }],
    pickup_address: params.pickupAddress,
    pickup_latitude: params.pickupLatitude ?? "",
    pickup_longitude: params.pickupLongitude ?? "",
    pickup_phone_number: params.senderPhone,
    pickup_name: params.senderName,
    delivery_address: params.deliveryAddress,
    delivery_latitude: params.deliveryLatitude ?? "",
    delivery_longitude: params.deliveryLongitude ?? "",
    ref_images: [],
    auto_assignment: "1",
  }

  try {
    const res = await fetch(`${TOOKAN_API_URL}/create_task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (data.status === 200 && data.data) {
      return {
        jobId: data.data.job_id,
        pickupJobId: data.data.pickup_job_id,
        deliveryJobId: data.data.delivery_job_id,
        trackingLink: data.data.tracking_link || `https://tkng.io/${data.data.job_id}`,
      }
    }
    console.error("[Tookan] Failed to create task:", data.message || data)
    return null
  } catch (error) {
    console.error("[Tookan] Network error during task creation:", error)
    return null
  }
}

export async function getTookanJobDetails(jobId: string | number) {
  if (!TOOKAN_API_KEY) return null

  try {
    const res = await fetch(`${TOOKAN_API_URL}/get_job_details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TOOKAN_API_KEY,
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

export async function cancelTookanTask(jobId: string | number, reason = "Cancelled by user") {
  if (!TOOKAN_API_KEY) return false

  try {
    const res = await fetch(`${TOOKAN_API_URL}/cancel_task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TOOKAN_API_KEY,
        job_id: jobId,
        job_status: 9, // Tookan Status 9: Cancelled
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
