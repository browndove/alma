import { randomUUID } from "node:crypto"

import { sql } from "@/lib/db"
import { ensureDeliverySchema } from "./schema"
import type {
  Delivery,
  DeliveryEvent,
  DeliveryStatus,
  PackageSize,
} from "./types"

type DeliveryRow = {
  id: string
  tracking_id: string
  status: string
  sender_name: string
  sender_phone: string
  sender_email: string
  pickup: string
  dropoff: string
  package_type: string
  size: string
  notes: string
  fragile: boolean
  perishable: boolean
  recipient_name: string
  recipient_phone: string
  payer: string
  estimated_value: string
  photo_name: string | null
  pickup_window: string
  scheduled_at: string | Date | null
  fare_ghs: number
  eta_minutes: number
  eta_label: string
  rider_name: string | null
  progress_step: number
  tookan_job_id?: string | null
  tookan_tracking_link?: string | null
  events: DeliveryEvent[] | string
  created_at: string | Date
  updated_at: string | Date
}

let schemaReady: Promise<void> | null = null

function ready() {
  if (!schemaReady) {
    schemaReady = ensureDeliverySchema().catch((error) => {
      schemaReady = null
      throw error
    })
  }
  return schemaReady
}

function toIso(value: string | Date | null | undefined) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

function mapRow(row: DeliveryRow): Delivery {
  const events =
    typeof row.events === "string"
      ? (JSON.parse(row.events) as DeliveryEvent[])
      : row.events

  return {
    id: row.id,
    trackingId: row.tracking_id,
    status: row.status as DeliveryStatus,
    senderName: row.sender_name,
    senderPhone: row.sender_phone,
    senderEmail: row.sender_email,
    pickup: row.pickup,
    dropoff: row.dropoff,
    packageType: row.package_type,
    size: row.size as PackageSize,
    notes: row.notes,
    fragile: row.fragile,
    perishable: row.perishable,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    payer: row.payer as Delivery["payer"],
    estimatedValue: row.estimated_value,
    photoName: row.photo_name,
    pickupWindow: row.pickup_window as Delivery["pickupWindow"],
    scheduledAt: toIso(row.scheduled_at),
    fareGhs: row.fare_ghs,
    etaMinutes: row.eta_minutes,
    etaLabel: row.eta_label,
    riderName: row.rider_name,
    progressStep: row.progress_step,
    tookanJobId: row.tookan_job_id ?? null,
    tookanTrackingLink: row.tookan_tracking_link ?? null,
    events: Array.isArray(events) ? events : [],
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  }
}

export async function listDeliveries() {
  await ready()
  const db = sql()
  const rows = (await db`
    SELECT *
    FROM deliveries
    ORDER BY created_at DESC
  `) as DeliveryRow[]
  return rows.map(mapRow)
}

export async function getDeliveryByTrackingId(trackingId: string) {
  await ready()
  const db = sql()
  const needle = trackingId.trim().toUpperCase()
  const rows = (await db`
    SELECT *
    FROM deliveries
    WHERE UPPER(tracking_id) = ${needle}
    LIMIT 1
  `) as DeliveryRow[]
  return rows[0] ? mapRow(rows[0]) : null
}

export async function insertDelivery(delivery: Delivery) {
  await ready()
  const db = sql()
  await db`
    INSERT INTO deliveries (
      id,
      tracking_id,
      status,
      sender_name,
      sender_phone,
      sender_email,
      pickup,
      dropoff,
      package_type,
      size,
      notes,
      fragile,
      perishable,
      recipient_name,
      recipient_phone,
      payer,
      estimated_value,
      photo_name,
      pickup_window,
      scheduled_at,
      fare_ghs,
      eta_minutes,
      eta_label,
      rider_name,
      progress_step,
      tookan_job_id,
      tookan_tracking_link,
      events,
      created_at,
      updated_at
    ) VALUES (
      ${delivery.id},
      ${delivery.trackingId},
      ${delivery.status},
      ${delivery.senderName},
      ${delivery.senderPhone},
      ${delivery.senderEmail},
      ${delivery.pickup},
      ${delivery.dropoff},
      ${delivery.packageType},
      ${delivery.size},
      ${delivery.notes},
      ${delivery.fragile},
      ${delivery.perishable},
      ${delivery.recipientName},
      ${delivery.recipientPhone},
      ${delivery.payer},
      ${delivery.estimatedValue},
      ${delivery.photoName},
      ${delivery.pickupWindow},
      ${delivery.scheduledAt},
      ${delivery.fareGhs},
      ${delivery.etaMinutes},
      ${delivery.etaLabel},
      ${delivery.riderName},
      ${delivery.progressStep},
      ${delivery.tookanJobId ? String(delivery.tookanJobId) : null},
      ${delivery.tookanTrackingLink || null},
      ${JSON.stringify(delivery.events)}::jsonb,
      ${delivery.createdAt},
      ${delivery.updatedAt}
    )
  `
  return delivery
}

export async function updateDelivery(
  trackingId: string,
  updater: (current: Delivery) => Delivery
) {
  const current = await getDeliveryByTrackingId(trackingId)
  if (!current) return null

  const next = updater(current)
  const db = sql()
  await db`
    UPDATE deliveries
    SET
      status = ${next.status},
      sender_name = ${next.senderName},
      sender_phone = ${next.senderPhone},
      sender_email = ${next.senderEmail},
      pickup = ${next.pickup},
      dropoff = ${next.dropoff},
      package_type = ${next.packageType},
      size = ${next.size},
      notes = ${next.notes},
      fragile = ${next.fragile},
      perishable = ${next.perishable},
      recipient_name = ${next.recipientName},
      recipient_phone = ${next.recipientPhone},
      payer = ${next.payer},
      estimated_value = ${next.estimatedValue},
      photo_name = ${next.photoName},
      pickup_window = ${next.pickupWindow},
      scheduled_at = ${next.scheduledAt},
      fare_ghs = ${next.fareGhs},
      eta_minutes = ${next.etaMinutes},
      eta_label = ${next.etaLabel},
      rider_name = ${next.riderName},
      progress_step = ${next.progressStep},
      tookan_job_id = ${next.tookanJobId ? String(next.tookanJobId) : null},
      tookan_tracking_link = ${next.tookanTrackingLink || null},
      events = ${JSON.stringify(next.events)}::jsonb,
      updated_at = ${next.updatedAt}
    WHERE id = ${next.id}
  `
  return next
}

export function createId() {
  return randomUUID()
}

export function createTrackingId(seed = Date.now()) {
  const n = 94000 + (seed % 5000)
  return `DT-${n}`
}
