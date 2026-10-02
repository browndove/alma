import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { neon } from "@neondatabase/serverless"

const envPath = resolve(process.cwd(), ".env.local")
const env = readFileSync(envPath, "utf8")
const match = env.match(/DATABASE_URL="([^"]+)"/)
if (!match) {
  throw new Error("DATABASE_URL missing in .env.local")
}

const sql = neon(match[1])

await sql`
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
    events JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`
await sql`CREATE INDEX IF NOT EXISTS deliveries_tracking_id_idx ON deliveries (tracking_id)`
await sql`CREATE INDEX IF NOT EXISTS deliveries_created_at_idx ON deliveries (created_at DESC)`

const rows = await sql`SELECT COUNT(*)::int AS count FROM deliveries`
console.log("Neon deliveries table ready.", rows[0])
