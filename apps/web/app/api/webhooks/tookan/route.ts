import { NextResponse } from "next/server"
import {
  getDeliveryByTookanJobId,
  getDeliveryByTrackingId,
  updateDeliveryRecord,
} from "@/lib/deliveries/store"
import { mapTookanWebhook } from "@/lib/deliveries/tookan-status"
import type { Delivery } from "@/lib/deliveries/types"

export const runtime = "nodejs"

function extractTrackingId(body: Record<string, unknown>): string | null {
  if (Array.isArray(body.meta_data)) {
    const match = body.meta_data.find(
      (m: { label?: string; data?: string }) =>
        m.label?.toLowerCase() === "tracking_id"
    )
    if (match?.data) return String(match.data)
  }

  if (typeof body.job_pickup_name === "string") {
    const name = body.job_pickup_name.trim()
    if (/^DT-\d+/i.test(name)) return name
  }

  if (typeof body.order_id === "string" && body.order_id.trim()) {
    return body.order_id.trim()
  }

  return null
}

async function findDelivery(body: Record<string, unknown>): Promise<Delivery | null> {
  const trackingId = extractTrackingId(body)
  if (trackingId) {
    const byTracking = await getDeliveryByTrackingId(trackingId)
    if (byTracking) return byTracking
  }

  if (body.job_id != null) {
    const byJob = await getDeliveryByTookanJobId(String(body.job_id))
    if (byJob) return byJob
  }

  return null
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>

    const delivery = await findDelivery(body)
    const jobStatus = Number(body.job_status)
    const jobType =
      body.job_type === undefined || body.job_type === null || body.job_type === ""
        ? null
        : Number(body.job_type)
    const fleetName =
      (typeof body.fleet_name === "string" && body.fleet_name) ||
      (typeof body.driver_name === "string" && body.driver_name) ||
      null

    if (!delivery) {
      return NextResponse.json(
        { status: "ignored", reason: "Delivery not found" },
        { status: 200 }
      )
    }

    const mapInfo = mapTookanWebhook({
      jobStatus,
      jobType,
      jobId: body.job_id as string | number | undefined,
      pickupJobId: delivery.tookanPickupJobId,
      deliveryJobId: delivery.tookanDeliveryJobId,
      currentStep: delivery.progressStep,
    })

    if (!mapInfo) {
      return NextResponse.json(
        { status: "ignored", reason: "Unhandled Tookan status" },
        { status: 200 }
      )
    }

    const updated = await updateDeliveryRecord(delivery, (current) => {
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

      // Never regress progress when the other P&D leg sends an older status
      if (
        !mapInfo.terminal &&
        mapInfo.step != null &&
        mapInfo.step < current.progressStep
      ) {
        return {
          ...current,
          riderName: fleetName || current.riderName,
          updatedAt,
          events: [...current.events, newEvent],
        }
      }

      const nextStep =
        mapInfo.step == null
          ? current.progressStep
          : Math.max(current.progressStep, mapInfo.step)

      return {
        ...current,
        status: mapInfo.status,
        progressStep: nextStep,
        riderName: fleetName || current.riderName,
        updatedAt,
        events: [...current.events, newEvent],
      }
    })

    return NextResponse.json({
      status: "success",
      trackingId: updated.trackingId,
      newStatus: mapInfo.status,
      tookanJobStatus: jobStatus,
      tookanJobType: jobType,
    })
  } catch (err) {
    console.error("[Tookan Webhook Error]", err)
    return NextResponse.json(
      { error: "Invalid JSON or internal webhook processing error" },
      { status: 400 }
    )
  }
}
