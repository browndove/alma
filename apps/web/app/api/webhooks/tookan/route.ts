import { NextResponse } from "next/server"
import { updateDelivery } from "@/lib/deliveries/store"
import type { DeliveryStatus } from "@/lib/deliveries/types"

export const runtime = "nodejs"

/**
 * Tookan Job Status Mapping:
 * 0: Unassigned / Free
 * 1: Assigned (Rider matched)
 * 2: Started / Picked Up
 * 3: Successful (Delivered)
 * 4: Failed / Refused
 * 6: Arrived / In Transit
 * 7: Deleted
 * 9: Cancelled
 */
const STATUS_MAP: Record<
  number,
  { status: DeliveryStatus; step: number; title: string; detail: string }
> = {
  1: {
    status: "matched",
    step: 1,
    title: "Rider assigned via Tookan",
    detail: "Tookan driver has accepted the dispatch",
  },
  2: {
    status: "picked_up",
    step: 2,
    title: "Picked up",
    detail: "Tookan driver collected package from pickup location",
  },
  6: {
    status: "in_transit",
    step: 3,
    title: "In transit",
    detail: "Tookan driver is en route to drop-off location",
  },
  3: {
    status: "delivered",
    step: 4,
    title: "Delivered",
    detail: "Package delivered successfully to recipient",
  },
  4: {
    status: "cancelled",
    step: 0,
    title: "Delivery Failed",
    detail: "Tookan reported delivery failure",
  },
  9: {
    status: "cancelled",
    step: 0,
    title: "Delivery Cancelled",
    detail: "Tookan job was cancelled",
  },
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Tookan webhooks send tracking_id inside meta_data array or job_pickup_name
    let trackingId: string | null = null
    if (Array.isArray(body.meta_data)) {
      const match = body.meta_data.find(
        (m: { label?: string; data?: string }) =>
          m.label?.toLowerCase() === "tracking_id"
      )
      if (match?.data) {
        trackingId = match.data
      }
    }

    if (!trackingId && typeof body.job_pickup_name === "string") {
      trackingId = body.job_pickup_name
    }

    const jobStatus = Number(body.job_status)
    const fleetName = body.fleet_name || body.driver_name || null
    const mapInfo = STATUS_MAP[jobStatus]

    if (!trackingId || !mapInfo) {
      return NextResponse.json(
        { status: "ignored", reason: "Missing tracking ID or unhandled status" },
        { status: 200 }
      )
    }

    const updated = await updateDelivery(trackingId, (current) => {
      const updatedAt = new Date().toISOString()
      const newEvent = {
        id: `tookan-evt-${Date.now()}`,
        title: mapInfo.title,
        detail: fleetName
          ? `${mapInfo.detail} (Rider: ${fleetName})`
          : mapInfo.detail,
        place: null,
        at: updatedAt,
      }

      return {
        ...current,
        status: mapInfo.status,
        progressStep: Math.max(current.progressStep, mapInfo.step),
        riderName: fleetName || current.riderName,
        updatedAt,
        events: [...current.events, newEvent],
      }
    })

    if (!updated) {
      return NextResponse.json(
        { status: "not_found", trackingId },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: "success",
      trackingId,
      newStatus: mapInfo.status,
    })
  } catch (err) {
    console.error("[Tookan Webhook Error]", err)
    return NextResponse.json(
      { error: "Invalid JSON or internal webhook processing error" },
      { status: 400 }
    )
  }
}
