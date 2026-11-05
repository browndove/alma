"use client"

import Link from "next/link"
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  assignOpsRider,
  fetchOpsAgents,
  fetchRecentDeliveries,
  type OpsAgent,
} from "@/lib/client-api"
import type { Delivery } from "@/lib/deliveries/types"
import { parseCoordsFromAddress } from "@/lib/deliveries/tookan"
import { OpsRiderSelect } from "@/components/ops-rider-select"
import { OpsCalendarView } from "@/components/ops-calendar-view"

const SECRET_KEY = "diatel_ops_admin_secret"

type ListFilter = "all" | "unassigned" | "assigned" | "same_day" | "scheduled"
type DeskView = "calendar" | "table" | "cards"
type SortKey = "tracking" | "status" | "when" | "fare" | "rider"
type SortDir = "asc" | "desc"

const FILTERS: Array<{ id: ListFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "unassigned", label: "Unassigned" },
  { id: "assigned", label: "Assigned" },
  { id: "same_day", label: "Same day" },
  { id: "scheduled", label: "Scheduled" },
]

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

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GH", {
    timeZone: "Africa/Accra",
    hour: "numeric",
    minute: "2-digit",
  })
}

function isUnassignedOrder(d: Delivery) {
  if (d.riderName) return false
  return (
    d.status === "unassigned" ||
    d.status === "requested" ||
    d.status === "matching"
  )
}

function isAssignedOrder(d: Delivery) {
  return Boolean(d.riderName) || !isUnassignedOrder(d)
}

function isInTransit(d: Delivery) {
  return (
    d.status === "accepted" ||
    d.status === "matched" ||
    d.status === "pickup_started" ||
    d.status === "at_pickup" ||
    d.status === "picked_up" ||
    d.status === "delivering" ||
    d.status === "at_dropoff" ||
    d.status === "started" ||
    d.status === "arrived" ||
    d.status === "in_transit"
  )
}

function statusTone(
  d: Delivery,
): "amber" | "indigo" | "violet" | "slate" | "green" | "red" {
  if (d.pickupWindow === "schedule" && isUnassignedOrder(d)) return "violet"
  if (
    d.status === "unassigned" ||
    d.status === "requested" ||
    d.status === "matching"
  ) {
    return "amber"
  }
  if (d.status === "delivered") return "green"
  if (
    d.status === "failed" ||
    d.status === "cancelled" ||
    d.status === "declined"
  ) {
    return "red"
  }
  if (isInTransit(d)) return "indigo"
  if (d.status === "assigned" || d.riderName) return "indigo"
  return "slate"
}

function statusLabel(d: Delivery) {
  return d.status.replace(/_/g, " ")
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
}

function orderWhenIso(d: Delivery) {
  return d.pickupWindow === "schedule" && d.scheduledAt
    ? d.scheduledAt
    : d.createdAt
}

function canAssignDelivery(d: Delivery) {
  return Boolean(d.tookanJobId || d.tookanPickupJobId || d.tookanDeliveryJobId)
}

function StatusPill({ delivery }: { delivery: Delivery }) {
  const tone = statusTone(delivery)
  return (
    <span className={`ops-pill ops-pill-${tone}`}>
      <span className="ops-pill-dot" aria-hidden="true" />
      <span>{statusLabel(delivery)}</span>
    </span>
  )
}

function OverflowMenu({ delivery }: { delivery: Delivery }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const canTookan = canAssignDelivery(delivery)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div className={`ops-overflow${open ? " is-open" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className="ops-icon-btn"
        aria-label={`More actions for ${delivery.trackingId}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open ? (
        <div id={menuId} className="ops-overflow-menu" role="menu">
          <Link
            role="menuitem"
            className="ops-overflow-item"
            href={`/track?id=${encodeURIComponent(delivery.trackingId)}`}
            onClick={() => setOpen(false)}
          >
            Track page
          </Link>
          {delivery.tookanTrackingLink ? (
            <a
              role="menuitem"
              className="ops-overflow-item"
              href={delivery.tookanTrackingLink}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              Live map
            </a>
          ) : null}
          {canTookan ? (
            <div className="ops-overflow-meta" role="note">
              <span>Tookan</span>
              <code>
                P {delivery.tookanPickupJobId ?? "—"} · D{" "}
                {delivery.tookanDeliveryJobId ?? delivery.tookanJobId}
              </code>
            </div>
          ) : (
            <div className="ops-overflow-meta" role="note">
              Not on Tookan
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function Toast({
  kind,
  message,
  onDismiss,
}: {
  kind: "success" | "error"
  message: string
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, kind === "success" ? 4500 : 7000)
    return () => window.clearTimeout(timer)
  }, [kind, message, onDismiss])

  return (
    <div
      className={`ops-toast ops-toast-${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <span className="ops-toast-dot" aria-hidden="true" />
      <p>{message}</p>
      <button
        type="button"
        className="ops-toast-close"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  )
}

function AssignControls({
  delivery,
  agents,
  busy,
  selectedFleetId,
  showForm,
  onChangeFleet,
  onAssign,
  onReassign,
}: {
  delivery: Delivery
  agents: OpsAgent[]
  busy: boolean
  selectedFleetId: string
  showForm: boolean
  onChangeFleet: (fleetId: string) => void
  onAssign: () => void
  onReassign: () => void
}) {
  if (!canAssignDelivery(delivery)) {
    return <span className="ops-muted">Not on Tookan</span>
  }
  if (showForm) {
    return (
      <div className="ops-assign-row">
        <OpsRiderSelect
          agents={agents}
          value={selectedFleetId}
          disabled={busy}
          compact
          onChange={onChangeFleet}
        />
        <button
          type="button"
          className="ops-btn ops-btn-assign"
          disabled={busy || !selectedFleetId}
          onClick={onAssign}
        >
          {busy ? (
            <>
              <span className="ops-spinner" aria-hidden="true" />
              Assigning…
            </>
          ) : delivery.riderName ? (
            "Reassign"
          ) : (
            "Assign"
          )}
        </button>
      </div>
    )
  }
  return (
    <div className="ops-rider-chip-row">
      <span className="ops-rider-chip">
        <span className="ops-avatar" aria-hidden="true">
          {initials(delivery.riderName || "R")}
        </span>
        <span>{delivery.riderName}</span>
      </span>
      <button
        type="button"
        className="ops-btn ops-btn-ghost ops-btn-reassign"
        onClick={onReassign}
      >
        Reassign
      </button>
    </div>
  )
}

export function OpsOrdersPage() {
  const [secret, setSecret] = useState("")
  const [draft, setDraft] = useState("")
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [agents, setAgents] = useState<OpsAgent[]>([])
  const [query, setQuery] = useState("")
  const [listFilter, setListFilter] = useState<ListFilter>("all")
  const [deskView, setDeskView] = useState<DeskView>("table")
  const [calendarFocusId, setCalendarFocusId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [selectedFleet, setSelectedFleet] = useState<Record<string, string>>({})
  const [reassigning, setReassigning] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("when")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const mobileDefaultApplied = useRef(false)

  useEffect(() => {
    if (mobileDefaultApplied.current) return
    mobileDefaultApplied.current = true
    if (window.matchMedia("(max-width: 768px)").matches) {
      setDeskView("cards")
    }
  }, [])

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

  useEffect(() => {
    if (!highlightId) return
    const timer = window.setTimeout(() => setHighlightId(null), 2200)
    return () => window.clearTimeout(timer)
  }, [highlightId])

  const searched = useMemo(() => {
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

  const filtered = useMemo(() => {
    switch (listFilter) {
      case "unassigned":
        return searched.filter(isUnassignedOrder)
      case "assigned":
        return searched.filter(isAssignedOrder)
      case "same_day":
        return searched.filter((d) => d.pickupWindow !== "schedule")
      case "scheduled":
        return searched.filter((d) => d.pickupWindow === "schedule")
      default:
        return searched
    }
  }, [searched, listFilter])

  const sorted = useMemo(() => {
    const rows = [...filtered]
    const dir = sortDir === "asc" ? 1 : -1
    rows.sort((a, b) => {
      let cmp = 0
      if (sortKey === "tracking") cmp = a.trackingId.localeCompare(b.trackingId)
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status)
      else if (sortKey === "fare") cmp = a.fareGhs - b.fareGhs
      else if (sortKey === "rider")
        cmp = (a.riderName || "").localeCompare(b.riderName || "")
      else cmp = orderWhenIso(a).localeCompare(orderWhenIso(b))
      return cmp * dir
    })
    return rows
  }, [filtered, sortKey, sortDir])

  const focusedDelivery = useMemo(
    () =>
      filtered.find((item) => item.trackingId === calendarFocusId) ||
      deliveries.find((item) => item.trackingId === calendarFocusId) ||
      null,
    [filtered, deliveries, calendarFocusId],
  )

  const stats = useMemo(() => {
    const unassigned = deliveries.filter(isUnassignedOrder).length
    const inTransit = deliveries.filter(isInTransit).length
    const delivered = deliveries.filter((d) => d.status === "delivered").length
    return {
      total: deliveries.length,
      unassigned,
      inTransit,
      delivered,
    }
  }, [deliveries])

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
      setHighlightId(delivery.trackingId)
      setReassigning((current) => ({
        ...current,
        [delivery.trackingId]: false,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed")
    } finally {
      setAssigningId(null)
    }
  }

  function lockDesk() {
    window.sessionStorage.removeItem(SECRET_KEY)
    setSecret("")
    setDeliveries([])
    setAgents([])
    setQuery("")
    setListFilter("all")
    setNotice(null)
    setError(null)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(key === "when" ? "desc" : "asc")
  }

  function assignProps(d: Delivery) {
    return {
      delivery: d,
      agents,
      busy: assigningId === d.trackingId,
      selectedFleetId: selectedFleet[d.trackingId] || "",
      showForm: canAssignDelivery(d) && (!d.riderName || reassigning[d.trackingId]),
      onChangeFleet: (fleetId: string) =>
        setSelectedFleet((current) => ({
          ...current,
          [d.trackingId]: fleetId,
        })),
      onAssign: () => void assignRider(d),
      onReassign: () =>
        setReassigning((current) => ({
          ...current,
          [d.trackingId]: true,
        })),
    }
  }

  if (!secret) {
    return (
      <main className="ops-page">
        <div className="ops-gate">
          <div className="ops-gate-lock" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                d="M7 11V8a5 5 0 0 1 10 0v3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <rect
                x="5"
                y="11"
                width="14"
                height="10"
                rx="2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </div>
          <p className="ops-kicker">Diatel Ops</p>
          <h1 className="ops-title">Orders desk locked</h1>
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
            <div className="ops-banner ops-banner-error" role="alert">
              <p>{error}</p>
              <button
                type="button"
                className="ops-banner-action"
                onClick={() => void load(draft)}
              >
                Retry
              </button>
            </div>
          ) : null}
        </div>
      </main>
    )
  }

  return (
    <main className="ops-page">
      <div className="ops-shell">
        <aside className="ops-sidebar">
          <div className="ops-brand">
            <p className="ops-kicker">Diatel Ops</p>
            <h1 className="ops-title">Orders</h1>
            <p className="ops-live" aria-live="polite">
              <span className="ops-live-dot" aria-hidden="true" />
              Live
              {updatedAt ? ` · ${formatClock(updatedAt)}` : null}
            </p>
          </div>

          <div className="ops-side-block">
            <p className="ops-side-label">Filters</p>
            <div className="ops-filters" role="tablist" aria-label="Filter orders">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={listFilter === filter.id}
                  className={`ops-chip${listFilter === filter.id ? " is-active" : ""}`}
                  onClick={() => setListFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ops-side-block">
            <p className="ops-side-label">
              Riders <span>{agents.length}</span>
            </p>
            <ul className="ops-rider-list">
              {agents.length === 0 ? (
                <li className="ops-muted">No active riders</li>
              ) : (
                agents.map((agent) => (
                  <li key={agent.fleetId} className="ops-rider-row">
                    <span className="ops-avatar" aria-hidden="true">
                      {initials(agent.name)}
                    </span>
                    <span className="ops-rider-row-copy">
                      <strong>{agent.name}</strong>
                      <span
                        className={`ops-rider-online${agent.isAvailable ? " is-on" : ""}`}
                      >
                        {agent.isAvailable ? "Online" : "Busy"}
                      </span>
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>

        <div className="ops-main">
          <header className="ops-topbar">
            <div className="ops-view-toggle" role="tablist" aria-label="Desk view">
              <button
                type="button"
                role="tab"
                aria-selected={deskView === "table"}
                className={`ops-chip${deskView === "table" ? " is-active" : ""}`}
                onClick={() => setDeskView("table")}
              >
                Table
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={deskView === "cards"}
                className={`ops-chip${deskView === "cards" ? " is-active" : ""}`}
                onClick={() => setDeskView("cards")}
              >
                Cards
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={deskView === "calendar"}
                className={`ops-chip${deskView === "calendar" ? " is-active" : ""}`}
                onClick={() => setDeskView("calendar")}
              >
                Calendar
              </button>
            </div>

            <div className="ops-topbar-actions">
              <label className="ops-search-wrap">
                <span className="ops-sr-only">Search orders</span>
                <input
                  className="ops-input ops-search"
                  type="search"
                  placeholder="Search tracking, name, place…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
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
                onClick={lockDesk}
                aria-label="Lock orders desk"
              >
                Lock
              </button>
            </div>
          </header>

          <section className="ops-metrics" aria-label="Order summary">
            <div className="ops-metric">
              <span className="ops-metric-label">Total</span>
              <strong>{stats.total}</strong>
            </div>
            <div className="ops-metric is-warn">
              <span className="ops-metric-label">Unassigned</span>
              <strong>{stats.unassigned}</strong>
            </div>
            <div className="ops-metric is-info">
              <span className="ops-metric-label">In transit</span>
              <strong>{stats.inTransit}</strong>
            </div>
            <div className="ops-metric is-ok">
              <span className="ops-metric-label">Delivered</span>
              <strong>{stats.delivered}</strong>
            </div>
          </section>

          {error && deliveries.length === 0 ? (
            <div className="ops-banner ops-banner-error" role="alert">
              <p>{error}</p>
              <button
                type="button"
                className="ops-banner-action"
                onClick={() => void load(secret)}
              >
                Retry
              </button>
            </div>
          ) : null}

          {deskView === "calendar" ? (
            <>
              {loading && deliveries.length === 0 ? (
                <div className="ops-card ops-skeleton" aria-hidden="true">
                  <div className="ops-skel-block" />
                </div>
              ) : (
                <OpsCalendarView
                  deliveries={filtered}
                  agents={agents}
                  selectedId={calendarFocusId}
                  onSelect={(trackingId) =>
                    setCalendarFocusId((current) =>
                      current === trackingId ? null : trackingId,
                    )
                  }
                />
              )}
              {focusedDelivery ? (
                <section
                  className={[
                    "ops-detail-grid",
                    assigningId === focusedDelivery.trackingId ? "is-busy" : "",
                    highlightId === focusedDelivery.trackingId
                      ? "is-highlight"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={`Order ${focusedDelivery.trackingId}`}
                >
                  <div className="ops-card ops-detail-id">
                    <div className="ops-detail-tile-top">
                      <span className="ops-detail-label">Tracking</span>
                      <button
                        type="button"
                        className="ops-icon-btn"
                        aria-label="Close order details"
                        onClick={() => setCalendarFocusId(null)}
                      >
                        ×
                      </button>
                    </div>
                    <strong className="ops-code ops-detail-tracking">
                      {focusedDelivery.trackingId}
                    </strong>
                    <StatusPill delivery={focusedDelivery} />
                  </div>
                  <div className="ops-card ops-detail-route">
                    <span className="ops-detail-label">Route</span>
                    <div className="ops-parties">
                      <div className="ops-party">
                        <span className="ops-route-dot is-pickup" />
                        <div className="ops-route-copy">
                          <strong>{focusedDelivery.senderName}</strong>
                          <span>{place(focusedDelivery.pickup)}</span>
                        </div>
                      </div>
                      <div className="ops-party">
                        <span className="ops-route-dot is-drop" />
                        <div className="ops-route-copy">
                          <strong>{focusedDelivery.recipientName}</strong>
                          <span>{place(focusedDelivery.dropoff)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ops-card ops-detail-when">
                    <span className="ops-detail-label">When</span>
                    <strong
                      className={`ops-when-kicker${focusedDelivery.pickupWindow === "schedule" ? " is-scheduled" : ""}`}
                    >
                      {focusedDelivery.pickupWindow === "schedule"
                        ? "Scheduled"
                        : "Same day"}
                    </strong>
                    <span className="ops-when-stamp">
                      {formatWhen(orderWhenIso(focusedDelivery))}
                    </span>
                    {focusedDelivery.etaLabel ? (
                      <span className="ops-eta-chip">
                        {focusedDelivery.etaLabel}
                      </span>
                    ) : null}
                  </div>
                  <div className="ops-card ops-detail-fare">
                    <span className="ops-detail-label">Fare</span>
                    <strong className="ops-detail-fare-value">
                      GHS {focusedDelivery.fareGhs}
                    </strong>
                  </div>
                  <div className="ops-card ops-detail-assign">
                    <span className="ops-detail-label">Assign rider</span>
                    <AssignControls {...assignProps(focusedDelivery)} />
                  </div>
                  <div className="ops-card ops-detail-links">
                    <span className="ops-detail-label">Links</span>
                    <div className="ops-detail-link-row">
                      <Link
                        className="ops-btn ops-btn-ghost"
                        href={`/track?id=${encodeURIComponent(focusedDelivery.trackingId)}`}
                      >
                        Track page
                      </Link>
                      {focusedDelivery.tookanTrackingLink ? (
                        <a
                          className="ops-btn ops-btn-ghost"
                          href={focusedDelivery.tookanTrackingLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Live map
                        </a>
                      ) : null}
                    </div>
                    {canAssignDelivery(focusedDelivery) ? (
                      <code className="ops-detail-tookan">
                        P {focusedDelivery.tookanPickupJobId ?? "—"} · D{" "}
                        {focusedDelivery.tookanDeliveryJobId ??
                          focusedDelivery.tookanJobId}
                      </code>
                    ) : null}
                  </div>
                </section>
              ) : filtered.length > 0 ? (
                <p className="ops-cal-hint">
                  Select an order on the calendar to open details.
                </p>
              ) : (
                <div className="ops-empty">
                  <p>
                    {query.trim() || listFilter !== "all"
                      ? "No orders match this search or filter."
                      : "No orders yet."}
                  </p>
                </div>
              )}
            </>
          ) : null}

          {deskView === "table" ? (
            <div className="ops-table-wrap">
              {loading && deliveries.length === 0 ? (
                <div className="ops-empty">Loading orders…</div>
              ) : sorted.length === 0 ? (
                <div className="ops-empty">
                  <p>
                    {query.trim() || listFilter !== "all"
                      ? "No orders match this search or filter."
                      : "No orders yet."}
                  </p>
                </div>
              ) : (
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>
                        <button
                          type="button"
                          className="ops-sort"
                          aria-sort={
                            sortKey === "tracking"
                              ? sortDir === "asc"
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                          onClick={() => toggleSort("tracking")}
                        >
                          Tracking
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="ops-sort"
                          aria-sort={
                            sortKey === "status"
                              ? sortDir === "asc"
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                          onClick={() => toggleSort("status")}
                        >
                          Status
                        </button>
                      </th>
                      <th>Route</th>
                      <th>
                        <button
                          type="button"
                          className="ops-sort"
                          aria-sort={
                            sortKey === "when"
                              ? sortDir === "asc"
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                          onClick={() => toggleSort("when")}
                        >
                          When
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="ops-sort"
                          aria-sort={
                            sortKey === "fare"
                              ? sortDir === "asc"
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                          onClick={() => toggleSort("fare")}
                        >
                          Fare
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="ops-sort"
                          aria-sort={
                            sortKey === "rider"
                              ? sortDir === "asc"
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                          onClick={() => toggleSort("rider")}
                        >
                          Rider
                        </button>
                      </th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((d) => (
                      <tr
                        key={d.id}
                        className={
                          highlightId === d.trackingId ? "is-highlight" : ""
                        }
                      >
                        <td>
                          <strong className="ops-code">{d.trackingId}</strong>
                        </td>
                        <td>
                          <StatusPill delivery={d} />
                        </td>
                        <td>
                          <div className="ops-table-route">
                            <span title={place(d.pickup)}>
                              {d.senderName} · {place(d.pickup)}
                            </span>
                            <span title={place(d.dropoff)}>
                              {d.recipientName} · {place(d.dropoff)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="ops-when">
                            <span
                              className={`ops-when-kicker${d.pickupWindow === "schedule" ? " is-scheduled" : ""}`}
                            >
                              {d.pickupWindow === "schedule"
                                ? "Scheduled"
                                : "Same day"}
                            </span>
                            <span className="ops-when-stamp">
                              {formatWhen(orderWhenIso(d))}
                            </span>
                          </div>
                        </td>
                        <td className="ops-fare">GHS {d.fareGhs}</td>
                        <td>
                          <AssignControls {...assignProps(d)} />
                        </td>
                        <td>
                          <OverflowMenu delivery={d} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : null}

          {deskView === "cards" ? (
            <section className="ops-list" aria-label="Orders">
              {loading && deliveries.length === 0
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="ops-order-card ops-skeleton"
                      aria-hidden="true"
                    />
                  ))
                : sorted.length === 0
                  ? (
                    <div className="ops-empty">
                      <p>
                        {query.trim() || listFilter !== "all"
                          ? "No orders match this search or filter."
                          : "No orders yet."}
                      </p>
                    </div>
                  )
                  : sorted.map((d) => (
                      <article
                        key={d.id}
                        className={[
                          "ops-order-card",
                          assigningId === d.trackingId ? "is-busy" : "",
                          highlightId === d.trackingId ? "is-highlight" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className="ops-order-id">
                          <strong className="ops-code">{d.trackingId}</strong>
                          <StatusPill delivery={d} />
                        </div>
                        <div className="ops-parties">
                          <div className="ops-party">
                            <span className="ops-route-dot is-pickup" />
                            <div className="ops-route-copy">
                              <strong>{d.senderName}</strong>
                              <span>{place(d.pickup)}</span>
                            </div>
                          </div>
                          <div className="ops-party">
                            <span className="ops-route-dot is-drop" />
                            <div className="ops-route-copy">
                              <strong>{d.recipientName}</strong>
                              <span>{place(d.dropoff)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ops-when">
                          <span
                            className={`ops-when-kicker${d.pickupWindow === "schedule" ? " is-scheduled" : ""}`}
                          >
                            {d.pickupWindow === "schedule"
                              ? "Scheduled"
                              : "Same day"}
                          </span>
                          <strong className="ops-when-stamp">
                            {formatWhen(orderWhenIso(d))}
                          </strong>
                          {d.etaLabel ? (
                            <span className="ops-eta-chip">{d.etaLabel}</span>
                          ) : null}
                        </div>
                        <div className="ops-fare">GHS {d.fareGhs}</div>
                        <div className="ops-assign-cell">
                          <AssignControls {...assignProps(d)} />
                        </div>
                        <div className="ops-order-actions">
                          <OverflowMenu delivery={d} />
                        </div>
                      </article>
                    ))}
            </section>
          ) : null}
        </div>
      </div>

      {notice ? (
        <Toast
          kind="success"
          message={notice}
          onDismiss={() => setNotice(null)}
        />
      ) : null}
      {error && deliveries.length > 0 ? (
        <Toast
          kind="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      ) : null}
    </main>
  )
}
