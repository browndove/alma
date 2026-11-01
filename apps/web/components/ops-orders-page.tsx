"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

import {
  assignOpsRider,
  fetchOpsAgents,
  fetchRecentDeliveries,
  type OpsAgent,
} from "@/lib/client-api"
import type { Delivery } from "@/lib/deliveries/types"
import { parseCoordsFromAddress } from "@/lib/deliveries/tookan"
import { OpsRiderSelect } from "@/components/ops-rider-select"

const SECRET_KEY = "diatel_ops_admin_secret"

function place(address: string) {
  return parseCoordsFromAddress(address).label || address
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GH", {
    timeZone: "Africa/Accra",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function OpsOrdersPage() {
  const [secret, setSecret] = useState("")
  const [draft, setDraft] = useState("")
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [agents, setAgents] = useState<OpsAgent[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [selectedFleet, setSelectedFleet] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    const saved = window.sessionStorage.getItem(SECRET_KEY)
    if (saved) {
      setSecret(saved)
      setDraft(saved)
    }
  }, [])

  const load = useCallback(async (adminSecret: string) => {
    if (!adminSecret.trim()) return
    setLoading(true)
    setError(null)
    try {
      const [{ deliveries: rows }, { agents: riderList }] = await Promise.all([
        fetchRecentDeliveries(adminSecret.trim(), 75),
        fetchOpsAgents(adminSecret.trim()),
      ])
      setDeliveries(rows)
      setAgents(riderList.filter((agent) => agent.isActive))
      setUpdatedAt(new Date().toISOString())
      window.sessionStorage.setItem(SECRET_KEY, adminSecret.trim())
      setSecret(adminSecret.trim())
    } catch (err) {
      setDeliveries([])
      setError(err instanceof Error ? err.message : "Could not load orders")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!secret) return
    void load(secret)
    const timer = window.setInterval(() => void load(secret), 20000)
    return () => window.clearInterval(timer)
  }, [secret, load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return deliveries
    return deliveries.filter((d) =>
      [
        d.trackingId,
        d.status,
        d.senderName,
        d.recipientName,
        d.pickup,
        d.dropoff,
        d.riderName || "",
        String(d.tookanJobId ?? ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [deliveries, query])

  async function assignRider(delivery: Delivery) {
    const fleetRaw = selectedFleet[delivery.trackingId]
    const fleetId = Number(fleetRaw)
    if (!Number.isFinite(fleetId) || fleetId <= 0) {
      setError("Pick a rider before assigning.")
      return
    }
    setAssigningId(delivery.trackingId)
    setError(null)
    setNotice(null)
    try {
      const result = await assignOpsRider(secret, delivery.trackingId, fleetId)
      setDeliveries((current) =>
        current.map((row) =>
          row.trackingId === delivery.trackingId ? result.delivery! : row,
        ),
      )
      setNotice(
        `Assigned ${result.agent.name} to ${delivery.trackingId} on Tookan.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed")
    } finally {
      setAssigningId(null)
    }
  }

  if (!secret) {
    return (
      <main className="ops-page">
        <div className="ops-gate">
          <p className="ops-kicker">Diatel ops</p>
          <h1 className="ops-title">Orders desk</h1>
          <p className="ops-lede">
            Enter the admin secret from production env (
            <code>DELIVERIES_ADMIN_SECRET</code>). Assign riders here — it
            updates Tookan for you.
          </p>
          <form
            className="ops-gate-form"
            onSubmit={(event) => {
              event.preventDefault()
              void load(draft)
            }}
          >
            <input
              className="ops-input"
              type="password"
              autoComplete="current-password"
              placeholder="Admin secret"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              required
            />
            <button className="ops-btn" type="submit" disabled={loading}>
              {loading ? "Opening…" : "Open orders"}
            </button>
          </form>
          {error ? (
            <p className="ops-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </main>
    )
  }

  return (
    <main className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Diatel ops</p>
          <h1 className="ops-title">Orders</h1>
          <p className="ops-meta">
            {filtered.length} shown · {agents.length} riders
            {updatedAt ? ` · updated ${formatWhen(updatedAt)} Accra` : null}
            {" · "}
            auto-refreshes every 20s
          </p>
        </div>
        <div className="ops-header-actions">
          <input
            className="ops-input ops-search"
            type="search"
            placeholder="Search tracking, name, place…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            className="ops-btn ops-btn-ghost"
            onClick={() => void load(secret)}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            className="ops-btn ops-btn-ghost"
            onClick={() => {
              window.sessionStorage.removeItem(SECRET_KEY)
              setSecret("")
              setDeliveries([])
              setAgents([])
            }}
          >
            Lock
          </button>
        </div>
      </header>

      {error ? (
        <p className="ops-error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="ops-notice" role="status">
          {notice}
        </p>
      ) : null}

      <p className="ops-hint">
        Pick a rider and click <strong>Assign</strong> — pickup and delivery
        tasks are assigned in Tookan, and the customer track page updates.
      </p>

      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Tracking</th>
              <th>Status</th>
              <th>Route</th>
              <th>When</th>
              <th>Tookan</th>
              <th>Assign rider</th>
              <th>Fare</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="ops-empty">
                  {loading ? "Loading orders…" : "No orders match."}
                </td>
              </tr>
            ) : (
              filtered.map((d) => {
                const canAssign = Boolean(
                  d.tookanJobId || d.tookanPickupJobId || d.tookanDeliveryJobId,
                )
                const busy = assigningId === d.trackingId
                return (
                  <tr key={d.id}>
                    <td>
                      <strong className="ops-code">{d.trackingId}</strong>
                      <div className="ops-sub">
                        {d.senderName} → {d.recipientName}
                      </div>
                    </td>
                    <td>
                      <span className={`ops-status is-${d.status}`}>
                        {d.status}
                      </span>
                      {d.riderName ? (
                        <div className="ops-sub">{d.riderName}</div>
                      ) : null}
                    </td>
                    <td>
                      <div>{place(d.pickup)}</div>
                      <div className="ops-sub">{place(d.dropoff)}</div>
                    </td>
                    <td>
                      <div>
                        {d.pickupWindow === "schedule" ? "Scheduled" : "Same day"}
                      </div>
                      <div className="ops-sub">
                        {d.pickupWindow === "schedule" && d.scheduledAt
                          ? formatWhen(d.scheduledAt)
                          : formatWhen(d.createdAt)}
                      </div>
                      <div className="ops-sub">{d.etaLabel}</div>
                    </td>
                    <td>
                      {canAssign ? (
                        <>
                          <div className="ops-sub">
                            P {d.tookanPickupJobId ?? "—"} · D{" "}
                            {d.tookanDeliveryJobId ?? d.tookanJobId}
                          </div>
                          {d.tookanTrackingLink ? (
                            <a
                              className="ops-link"
                              href={d.tookanTrackingLink}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Live map
                            </a>
                          ) : null}
                        </>
                      ) : (
                        <span className="ops-sub">Not on Tookan</span>
                      )}
                    </td>
                    <td>
                      {canAssign ? (
                        <div className="ops-assign">
                          <OpsRiderSelect
                            agents={agents}
                            value={selectedFleet[d.trackingId] || ""}
                            disabled={busy}
                            onChange={(fleetId) =>
                              setSelectedFleet((current) => ({
                                ...current,
                                [d.trackingId]: fleetId,
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="ops-btn ops-btn-sm"
                            disabled={busy || !selectedFleet[d.trackingId]}
                            onClick={() => void assignRider(d)}
                          >
                            {busy ? "Assigning…" : "Assign"}
                          </button>
                        </div>
                      ) : (
                        <span className="ops-sub">—</span>
                      )}
                    </td>
                    <td>GHS {d.fareGhs}</td>
                    <td>
                      <Link
                        className="ops-link"
                        href={`/track?id=${encodeURIComponent(d.trackingId)}`}
                      >
                        Track
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
