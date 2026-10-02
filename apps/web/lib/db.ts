import { neon } from "@neondatabase/serverless"

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      "DATABASE_URL is missing. Add your Neon connection string to apps/web/.env.local"
    )
  }
  return url
}

export function sql() {
  return neon(getDatabaseUrl())
}
