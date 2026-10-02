import { sql } from "@/lib/db"

export async function ensureDeliverySchema() {
  const db = sql()
  await db`
    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      tracking_id TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_phone TEXT NOT NULL,
      sender_email TEXT NOT NULL DEFAULT '',
      pickup TEXT NOT NULL,
      dropoff TEXT NOT NULL,
      package_type TEXT NOT NULL,
      size TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      fragile BOOLEAN NOT NULL DEFAULT FALSE,
      perishable BOOLEAN NOT NULL DEFAULT FALSE,
      recipient_name TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      payer TEXT NOT NULL,
      estimated_value TEXT NOT NULL DEFAULT '',
      photo_name TEXT,
      pickup_window TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ,
      fare_ghs INTEGER NOT NULL,
      eta_minutes INTEGER NOT NULL,
      eta_label TEXT NOT NULL,
      rider_name TEXT,
      progress_step INTEGER NOT NULL DEFAULT 0,
      tookan_job_id TEXT,
      tookan_tracking_link TEXT,
      events JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await db`
    ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS tookan_job_id TEXT;
  `
  await db`
    ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS tookan_tracking_link TEXT;
  `
  await db`
    CREATE INDEX IF NOT EXISTS deliveries_tracking_id_idx
    ON deliveries (tracking_id)
  `
  await db`
    CREATE INDEX IF NOT EXISTS deliveries_created_at_idx
    ON deliveries (created_at DESC)
  `
}
