import { randomUUID } from "node:crypto"

import { sql } from "@/lib/db"
import { ensureDeliverySchema } from "./schema"
import type {
  Delivery,
  DeliveryEvent,
  DeliveryStatus,
  PackageSize,
  PaymentStatus,
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
  recipient_email?: string | null
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
  payment_status?: string | null
  payment_reference?: string | null
  paid_at?: string | Date | null
  paid_by?: string | null
  payment_channel?: string | null
  tookan_job_id?: string | null
  tookan_pickup_job_id?: string | null
  tookan_delivery_job_id?: string | null
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
    recipientEmail: row.recipient_email || "",
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
    paymentStatus: (row.payment_status as PaymentStatus) || "unpaid",
    paymentReference: row.payment_reference ?? null,
    paidAt: toIso(row.paid_at),
    paidBy: (row.paid_by as Delivery["paidBy"]) || null,
    paymentChannel: row.payment_channel ?? null,
    tookanJobId: row.tookan_job_id ?? null,
    tookanPickupJobId: row.tookan_pickup_job_id ?? null,
    tookanDeliveryJobId: row.tookan_delivery_job_id ?? null,
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

export async function deleteDeliveryByTrackingId(trackingId: string) {
  await ready()
  const db = sql()
  const rows = (await db`
    DELETE FROM deliveries
    WHERE UPPER(tracking_id) = ${trackingId.trim().toUpperCase()}
    RETURNING id
  `) as { id: string }[]
  return rows.length > 0
}

export async function getDeliveryByTookanJobId(jobId: string | number) {
  await ready()
  const db = sql()
  const needle = String(jobId)
  const rows = (await db`
    SELECT *
    FROM deliveries
    WHERE tookan_job_id = ${needle}
       OR tookan_pickup_job_id = ${needle}
       OR tookan_delivery_job_id = ${needle}
    LIMIT 1
  `) as DeliveryRow[]
  return rows[0] ? mapRow(rows[0]) : null
}

export async function getDeliveryByPaymentReference(reference: string) {
  await ready()
  const db = sql()
  const needle = reference.trim()
  if (!needle) return null
  const rows = (await db`
    SELECT *
    FROM deliveries
    WHERE payment_reference = ${needle}
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
      recipient_email,
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
      payment_status,
      payment_reference,
      paid_at,
      paid_by,
      payment_channel,
      tookan_job_id,
      tookan_pickup_job_id,
      tookan_delivery_job_id,
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
      ${delivery.recipientEmail},
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
      ${delivery.paymentStatus},
      ${delivery.paymentReference},
      ${delivery.paidAt},
      ${delivery.paidBy},
      ${delivery.paymentChannel},
      ${delivery.tookanJobId ? String(delivery.tookanJobId) : null},
      ${delivery.tookanPickupJobId ? String(delivery.tookanPickupJobId) : null},
      ${delivery.tookanDeliveryJobId ? String(delivery.tookanDeliveryJobId) : null},
      ${delivery.tookanTrackingLink || null},
      ${JSON.stringify(delivery.events)}::jsonb,
      ${delivery.createdAt},
      ${delivery.updatedAt}
    )
  `
  return delivery
}

async function persistDeliveryUpdate(next: Delivery) {
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
      recipient_email = ${next.recipientEmail},
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
      payment_status = ${next.paymentStatus},
      payment_reference = ${next.paymentReference},
      paid_at = ${next.paidAt},
      paid_by = ${next.paidBy},
      payment_channel = ${next.paymentChannel},
      tookan_job_id = ${next.tookanJobId ? String(next.tookanJobId) : null},
      tookan_pickup_job_id = ${
        next.tookanPickupJobId ? String(next.tookanPickupJobId) : null
      },
      tookan_delivery_job_id = ${
        next.tookanDeliveryJobId ? String(next.tookanDeliveryJobId) : null
      },
      tookan_tracking_link = ${next.tookanTrackingLink || null},
      events = ${JSON.stringify(next.events)}::jsonb,
      updated_at = ${next.updatedAt}
    WHERE id = ${next.id}
  `
  return next
}

export async function updateDelivery(
  trackingId: string,
  updater: (current: Delivery) => Delivery
) {
  const current = await getDeliveryByTrackingId(trackingId)
  if (!current) return null
  return persistDeliveryUpdate(updater(current))
}

export async function updateDeliveryRecord(
  current: Delivery,
  updater: (current: Delivery) => Delivery
) {
  return persistDeliveryUpdate(updater(current))
}

export type HandoverState = {
  code: string | null
  attempts: number
  confirmedAt: string | null
}

/** The handover code and its check state — server-only, never part of Delivery. */
export async function getHandoverState(trackingId: string): Promise<HandoverState | null> {
  await ready()
  const db = sql()
  const rows = (await db`
    SELECT handover_code, handover_attempts, handover_confirmed_at
    FROM deliveries
    WHERE UPPER(tracking_id) = ${trackingId.trim().toUpperCase()}
    LIMIT 1
  `) as {
    handover_code: string | null
    handover_attempts: number | null
    handover_confirmed_at: string | Date | null
  }[]
  const row = rows[0]
  if (!row) return null
  return {
    code: row.handover_code,
    attempts: row.handover_attempts ?? 0,
    confirmedAt: toIso(row.handover_confirmed_at),
  }
}

export async function saveHandoverCode(trackingId: string, code: string) {
  await ready()
  const db = sql()
  await db`
    UPDATE deliveries
    SET handover_code = ${code}, handover_attempts = 0, handover_confirmed_at = NULL
    WHERE UPPER(tracking_id) = ${trackingId.trim().toUpperCase()}
  `
}

/** Records one check: a wrong code adds an attempt, the right one confirms. */
export async function recordHandoverAttempt(
  trackingId: string,
  outcome: "wrong" | "confirmed",
) {
  await ready()
  const db = sql()
  const needle = trackingId.trim().toUpperCase()
  if (outcome === "wrong") {
    await db`
      UPDATE deliveries
      SET handover_attempts = handover_attempts + 1
      WHERE UPPER(tracking_id) = ${needle}
    `
    return
  }
  await db`
    UPDATE deliveries
    SET handover_confirmed_at = NOW()
    WHERE UPPER(tracking_id) = ${needle}
  `
}

export function createId() {
  return randomUUID()
}

export function createTrackingId(seed = Date.now()) {
  const time = seed.toString(36).toUpperCase().slice(-5)
  const rand = Math.floor(Math.random() * 36 ** 3)
    .toString(36)
    .toUpperCase()
    .padStart(3, "0")
  return `DT-${time}${rand}`
}
