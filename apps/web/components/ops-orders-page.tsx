"use client"

import Link from "next/link"
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react"

import {
  assignOpsRider,
  fetchOpsAgents,
  fetchRecentDeliveries,
  type OpsAgent,
} from "@/lib/client-api"
import type { Delivery } from "@/lib/deliveries/types"
import { OpsRiderSelect } from "@/components/ops-rider-select"
import { OpsCalendarView } from "@/components/ops-calendar-view"
import { OpsOrderDrawer } from "@/components/ops-order-drawer"
import {
  formatClock,
  formatWhen,
  initials,
  isClosedOrder,
  isUnassignedOrder,
  cx,
  orderWhenIso,
  place,
  StatusPill,
} from "@/components/ops-shared"

const SECRET_KEY = "diatel_ops_admin_secret"

type StatusTab =
  "all" | "needs_rider" | "in_progress" | "unpaid" | "delivered" | "closed"
type WindowFilter = "any" | "same_day" | "scheduled"
type DeskView = "calendar" | "table" | "cards"
type SortKey = "tracking" | "status" | "when" | "fare" | "rider"
type SortDir = "asc" | "desc"

const TABS: Array<{
  id: StatusTab
  label: string
  tone?: "warn" | "info" | "ok"
}> = [
  { id: "all", label: "All" },
  { id: "needs_rider", label: "Needs rider", tone: "warn" },
  { id: "in_progress", label: "In progress", tone: "info" },
  { id: "unpaid", label: "Unpaid", tone: "warn" },
  { id: "delivered", label: "Delivered", tone: "ok" },
  { id: "closed", label: "Cancelled" },
]

const WINDOWS: Array<{ id: WindowFilter; label: string }> = [
  { id: "any", label: "Any time" },
  { id: "same_day", label: "Same day" },
  { id: "scheduled", label: "Scheduled" },
]

const VIEWS: Array<{ id: DeskView; label: string }> = [
  { id: "table", label: "Table" },
  { id: "cards", label: "Cards" },
  { id: "calendar", label: "Calendar" },
]

function needsRider(d: Delivery) {
  return isUnassignedOrder(d) && !isClosedOrder(d)
}

function isInProgress(d: Delivery) {
  return !isClosedOrder(d) && !isUnassignedOrder(d)
}

function isUnpaidOrder(d: Delivery) {
  return d.paymentStatus !== "paid" && d.status !== "cancelled"
}

function isCancelledOrder(d: Delivery) {
  return (
    d.status === "cancelled" || d.status === "failed" || d.status === "declined"
  )
}

function matchesTab(d: Delivery, tab: StatusTab) {
  switch (tab) {
    case "needs_rider":
      return needsRider(d)
    case "in_progress":
      return isInProgress(d)
    case "unpaid":
      return isUnpaidOrder(d)
    case "delivered":
      return d.status === "delivered"
    case "closed":
      return isCancelledOrder(d)
    default:
      return true
  }
}

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function downloadCsv(rows: Delivery[]) {
  const header = [
    "Tracking",
    "Status",
    "Payment",
    "Payer",
    "Fare GHS",
    "When",
    "Window",
    "Sender",
    "Sender phone",
    "Pickup",
    "Recipient",
    "Recipient phone",
    "Drop-off",
    "Package",
    "Rider",
    "Created",
  ]
  const lines = rows.map((d) =>
    [
      d.trackingId,
      d.status,
      d.paymentStatus,
      d.payer,
      d.fareGhs,
      orderWhenIso(d),
      d.pickupWindow,
      d.senderName,
      d.senderPhone,
      place(d.pickup),
      d.recipientName,
      d.recipientPhone,
      place(d.dropoff),
      `${d.packageType} (${d.size})`,
      d.riderName,
      d.createdAt,
    ]
      .map(csvCell)
      .join(",")
  )
  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `diatel-orders-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/** Row/card clicks open the order — unless the click was on a control inside it. */
function isControlClick(event: MouseEvent) {
  return Boolean(
    (event.target as HTMLElement).closest(
      "button, a, input, [role='listbox'], .ops-rider-select, .ops-overflow"
    )
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <circle
        cx="7"
        cy="7"
        r="4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m10.5 10.5 3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path
        d="M13.2 8a5.2 5.2 0 1 1-1.6-3.8M13.2 2.6v2.7h-2.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <rect
        x="3.2"
        y="7"
        width="9.6"
        height="6.6"
        rx="1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5.3 7V5.2a2.7 2.7 0 0 1 5.4 0V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path
        d="M8 2.5v7.5m0 0L5 7m3 3 3-3M3 12.5h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ id: T; label: string }>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="ops-seg" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          className={value === option.id ? "is-active" : ""}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function OverflowMenu({
  delivery,
  onOpen,
}: {
  delivery: Delivery
  onOpen: () => void
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const onTookan = Boolean(delivery.tookanJobId || delivery.tookanPickupJobId)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: globalThis.MouseEvent) {
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
    <div className={cx("ops-overflow", open && "is-open")} ref={wrapRef}>
      <button
        type="button"
        className="ops-icon-btn is-quiet"
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
          <button
            type="button"
            role="menuitem"
            className="ops-overflow-item"
            onClick={() => {
              setOpen(false)
              onOpen()
            }}
          >
            Details &amp; actions
          </button>
          <button
            type="button"
            role="menuitem"
            className="ops-overflow-item"
            onClick={() => {
              setOpen(false)
              void navigator.clipboard?.writeText(delivery.trackingId)
            }}
          >
            Copy tracking ID
          </button>
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
          <div className="ops-overflow-meta" role="note">
            {onTookan ? (
              <>
                <span>Tookan</span>
                <code>
                  P {delivery.tookanPickupJobId ?? "—"} · D{" "}
                  {delivery.tookanDeliveryJobId ?? delivery.tookanJobId}
                </code>
              </>
            ) : (
              "Not on Tookan"
            )}
          </div>
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

function RiderName({ name }: { name: string }) {
  return (
    <span className="ops-rider-name">
      <span className="ops-avatar" aria-hidden="true">
        {initials(name)}
      </span>
      <span>{name}</span>
    </span>
  )
}

/**
 * "row": lists stay quiet — a rider name, or a picker only when an open order
 * needs one. "panel": the details drawer also offers Reassign.
 */
function AssignControls({
  delivery,
  agents,
  busy,
  selectedFleetId,
  reassigning,
  variant,
  onChangeFleet,
  onAssign,
  onReassign,
}: {
  delivery: Delivery
  agents: OpsAgent[]
  busy: boolean
  selectedFleetId: string
  reassigning: boolean
  variant: "row" | "panel"
  onChangeFleet: (fleetId: string) => void
  onAssign: () => void
  onReassign: () => void
}) {
  if (isClosedOrder(delivery)) {
    return delivery.riderName ? (
      <span className="ops-muted">{delivery.riderName}</span>
    ) : (
      <span className="ops-muted">—</span>
    )
  }

  if (!delivery.riderName || reassigning) {
    return (
      <div className="ops-assign-row">
        <OpsRiderSelect
          agents={agents}
          value={selectedFleetId}
          disabled={busy}
          compact
          placeholder={
            delivery.riderName ? "Choose new rider…" : "Assign rider…"
          }
          onChange={onChangeFleet}
        />
        {selectedFleetId || busy ? (
          <button
            type="button"
            className="ops-btn ops-btn-assign"
            disabled={busy}
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
        ) : null}
      </div>
    )
  }

  return (
    <div className="ops-rider-chip-row">
      <RiderName name={delivery.riderName} />
      {variant === "panel" ? (
        <button
          type="button"
          className="ops-btn ops-btn-ghost ops-btn-reassign"
          onClick={onReassign}
        >
          Reassign
        </button>
      ) : null}
    </div>
  )
}

export function OpsOrdersPage() {
  const [secret, setSecret] = useState("")
  const [draft, setDraft] = useState("")
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [agents, setAgents] = useState<OpsAgent[]>([])
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<StatusTab>("all")
  const [windowFilter, setWindowFilter] = useState<WindowFilter>("any")
  const [deskView, setDeskView] = useState<DeskView>("table")
  const [detailId, setDetailId] = useState<string | null>(null)
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

  // Search + time window narrow the pool; tab counts are taken from it.
  const pool = useMemo(() => {
    const q = query.trim().toLowerCase()
    return deliveries.filter((d) => {
      if (windowFilter === "same_day" && d.pickupWindow === "schedule")
        return false
      if (windowFilter === "scheduled" && d.pickupWindow !== "schedule")
        return false
      if (!q) return true
      return [
        d.trackingId,
        d.status,
        d.senderName,
        d.recipientName,
        d.senderPhone,
        d.recipientPhone,
        d.pickup,
        d.dropoff,
        d.riderName || "",
        String(d.tookanJobId ?? ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    })
  }, [deliveries, query, windowFilter])

  const tabCounts = useMemo(() => {
    const counts = {} as Record<StatusTab, number>
    for (const item of TABS) {
      counts[item.id] = pool.filter((d) => matchesTab(d, item.id)).length
    }
    return counts
  }, [pool])

  const filtered = useMemo(
    () => pool.filter((d) => matchesTab(d, tab)),
    [pool, tab]
  )

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

  const detailDelivery = useMemo(
    () => deliveries.find((item) => item.trackingId === detailId) || null,
    [deliveries, detailId]
  )

  const summary = useMemo(() => {
    const unpaid = deliveries.filter(isUnpaidOrder)
    return {
      needsRider: deliveries.filter(needsRider).length,
      inProgress: deliveries.filter(isInProgress).length,
      unpaid: unpaid.length,
      unpaidGhs: unpaid.reduce((sum, d) => sum + d.fareGhs, 0),
      openJobs: deliveries.filter((d) => d.riderName && !isClosedOrder(d))
        .length,
    }
  }, [deliveries])

  const riderLoad = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of deliveries) {
      if (!d.riderName || isClosedOrder(d)) continue
      counts.set(d.riderName, (counts.get(d.riderName) ?? 0) + 1)
    }
    return counts
  }, [deliveries])

  const onlineRiders = agents.filter((agent) => agent.isAvailable).length

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
          row.trackingId === delivery.trackingId ? result.delivery! : row
        )
      )
      setNotice(
        `Assigned ${result.agent.name} to ${delivery.trackingId} on Tookan.`
      )
      setHighlightId(delivery.trackingId)
      setReassigning((current) => ({
        ...current,
        [delivery.trackingId]: false,
      }))
      setSelectedFleet((current) => ({ ...current, [delivery.trackingId]: "" }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed")
    } finally {
      setAssigningId(null)
    }
  }

  const replaceDelivery = useCallback((next: Delivery, message: string) => {
    setDeliveries((current) =>
      current.map((row) => (row.trackingId === next.trackingId ? next : row))
    )
    setError(null)
    setNotice(message)
    setHighlightId(next.trackingId)
  }, [])

  const removeDelivery = useCallback((trackingId: string) => {
    setDeliveries((current) =>
      current.filter((row) => row.trackingId !== trackingId)
    )
    setDetailId(null)
    setError(null)
    setNotice(`Deleted ${trackingId}.`)
  }, [])

  const closeDetail = useCallback(() => setDetailId(null), [])

  function lockDesk() {
    window.sessionStorage.removeItem(SECRET_KEY)
    setSecret("")
    setDeliveries([])
    setAgents([])
    setQuery("")
    setTab("all")
    setWindowFilter("any")
    setDetailId(null)
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

  function sortAttr(key: SortKey) {
    if (sortKey !== key) return "none" as const
    return sortDir === "asc" ? ("ascending" as const) : ("descending" as const)
  }

  function assignProps(d: Delivery, variant: "row" | "panel") {
    return {
      delivery: d,
      agents,
      busy: assigningId === d.trackingId,
      selectedFleetId: selectedFleet[d.trackingId] || "",
      reassigning: Boolean(reassigning[d.trackingId]),
      variant,
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

  function openFromClick(event: MouseEvent, trackingId: string) {
    if (isControlClick(event)) return
    setDetailId(trackingId)
  }

  const emptyCopy =
    query.trim() || tab !== "all" || windowFilter !== "any"
      ? "No orders match this search or filter."
      : "No orders yet."

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
      <header className="ops-bar">
        <div className="ops-bar-brand">
          <span className="ops-mark" aria-hidden="true">
            D
          </span>
          <div>
            <strong>Diatel Ops</strong>
            <span className="ops-live" aria-live="polite">
              <span className="ops-live-dot" aria-hidden="true" />
              {loading
                ? "Syncing…"
                : updatedAt
                  ? `Live · ${formatClock(updatedAt)}`
                  : "Live"}
            </span>
          </div>
        </div>

        <label className="ops-search-wrap">
          <span className="ops-sr-only">Search orders</span>
          <SearchIcon />
          <input
            className="ops-search"
            type="search"
            placeholder="Search tracking ID, name, phone, place…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="ops-bar-actions">
          <button
            type="button"
            className="ops-btn ops-btn-ghost ops-btn-sm"
            onClick={() => downloadCsv(sorted)}
            disabled={sorted.length === 0}
            title="Download the orders in view as CSV"
          >
            <DownloadIcon />
            <span className="ops-hide-sm">Export</span>
          </button>
          <button
            type="button"
            className={cx("ops-icon-btn", loading && "is-spinning")}
            onClick={() => void load(secret)}
            disabled={loading}
            aria-label="Refresh orders"
            title="Refresh"
          >
            <RefreshIcon />
          </button>
          <button
            type="button"
            className="ops-icon-btn"
            onClick={lockDesk}
            aria-label="Lock orders desk"
            title="Lock"
          >
            <LockIcon />
          </button>
        </div>
      </header>

      <section className="ops-hero" aria-label="Desk summary">
        <div className="ops-hero-inner">
          <div className="ops-hero-title">
            <h1 className="ops-title">Orders</h1>
            <p>Latest 75 bookings · refreshes every 20 seconds</p>
          </div>

          <div className="ops-kpis">
            <button
              type="button"
              className={cx(
                "ops-kpi",
                summary.needsRider > 0 ? "is-attention" : "is-calm",
                tab === "needs_rider" && "is-active"
              )}
              onClick={() => setTab("needs_rider")}
            >
              <span className="ops-kpi-label">Needs a rider</span>
              <strong className="ops-kpi-value">{summary.needsRider}</strong>
              <span className="ops-kpi-foot">
                {summary.needsRider > 0
                  ? "Assign before pickup →"
                  : "Every open order is covered"}
              </span>
            </button>
            <button
              type="button"
              className={cx("ops-kpi", tab === "in_progress" && "is-active")}
              onClick={() => setTab("in_progress")}
            >
              <span className="ops-kpi-label">In progress</span>
              <strong className="ops-kpi-value">{summary.inProgress}</strong>
              <span className="ops-kpi-foot">With a rider right now</span>
            </button>
            <button
              type="button"
              className={cx("ops-kpi", tab === "unpaid" && "is-active")}
              onClick={() => setTab("unpaid")}
            >
              <span className="ops-kpi-label">Unpaid</span>
              <strong className="ops-kpi-value">
                <small>GHS</small> {summary.unpaidGhs}
              </strong>
              <span className="ops-kpi-foot">
                Across {summary.unpaid}{" "}
                {summary.unpaid === 1 ? "order" : "orders"}
              </span>
            </button>
            <div className="ops-kpi is-static">
              <span className="ops-kpi-label">Riders online</span>
              <strong className="ops-kpi-value">
                {onlineRiders}
                <small> / {agents.length}</small>
              </strong>
              <span className="ops-kpi-foot">
                {summary.openJobs} open{" "}
                {summary.openJobs === 1 ? "job" : "jobs"} across the team
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="ops-layout">
        <div className="ops-main">
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

          <section className="ops-panel" aria-label="Order list">
            <div className="ops-panel-head">
              <nav
                className="ops-tabs"
                role="tablist"
                aria-label="Order status"
              >
                {TABS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.id}
                    className={cx(
                      "ops-tab",
                      tab === item.id && "is-active",
                      item.tone && `is-${item.tone}`
                    )}
                    onClick={() => setTab(item.id)}
                  >
                    <span>{item.label}</span>
                    <span className="ops-tab-count">{tabCounts[item.id]}</span>
                  </button>
                ))}
              </nav>

              <div className="ops-toolbar">
                <Segmented
                  label="Pickup time"
                  options={WINDOWS}
                  value={windowFilter}
                  onChange={setWindowFilter}
                />
                <span className="ops-toolbar-count">
                  {sorted.length} {sorted.length === 1 ? "order" : "orders"}
                </span>
                <Segmented
                  label="Desk view"
                  options={VIEWS}
                  value={deskView}
                  onChange={setDeskView}
                />
              </div>
            </div>

            {deskView === "calendar" ? (
              loading && deliveries.length === 0 ? (
                <div className="ops-card ops-skeleton" aria-hidden="true">
                  <div className="ops-skel-block" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="ops-empty">
                  <p>{emptyCopy}</p>
                </div>
              ) : (
                <OpsCalendarView
                  deliveries={filtered}
                  agents={agents}
                  selectedId={detailId}
                  onSelect={(trackingId) =>
                    setDetailId((current) =>
                      current === trackingId ? null : trackingId
                    )
                  }
                />
              )
            ) : null}

            {deskView === "table" ? (
              <div className="ops-table-wrap">
                {loading && deliveries.length === 0 ? (
                  <div className="ops-empty">Loading orders…</div>
                ) : sorted.length === 0 ? (
                  <div className="ops-empty">
                    <p>{emptyCopy}</p>
                  </div>
                ) : (
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>
                          <button
                            type="button"
                            className="ops-sort"
                            aria-sort={sortAttr("tracking")}
                            onClick={() => toggleSort("tracking")}
                          >
                            Order
                          </button>
                        </th>
                        <th>
                          <button
                            type="button"
                            className="ops-sort"
                            aria-sort={sortAttr("status")}
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
                            aria-sort={sortAttr("when")}
                            onClick={() => toggleSort("when")}
                          >
                            Pickup
                          </button>
                        </th>
                        <th className="is-num">
                          <button
                            type="button"
                            className="ops-sort"
                            aria-sort={sortAttr("fare")}
                            onClick={() => toggleSort("fare")}
                          >
                            Fare
                          </button>
                        </th>
                        <th>
                          <button
                            type="button"
                            className="ops-sort"
                            aria-sort={sortAttr("rider")}
                            onClick={() => toggleSort("rider")}
                          >
                            Rider
                          </button>
                        </th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((d) => (
                        <tr
                          key={d.id}
                          className={[
                            highlightId === d.trackingId ? "is-highlight" : "",
                            detailId === d.trackingId ? "is-open" : "",
                            isClosedOrder(d) ? "is-closed" : "",
                            needsRider(d) ? "is-attention" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={(event) =>
                            openFromClick(event, d.trackingId)
                          }
                        >
                          <td>
                            <button
                              type="button"
                              className="ops-code ops-id-link"
                              onClick={() => setDetailId(d.trackingId)}
                            >
                              {d.trackingId}
                            </button>
                            <span className="ops-cell-sub">{d.senderName}</span>
                          </td>
                          <td>
                            <StatusPill delivery={d} />
                          </td>
                          <td className="ops-route-cell">
                            <div className="ops-route-mini">
                              <span
                                title={`${d.senderName} · ${place(d.pickup)}`}
                              >
                                <i
                                  className="ops-route-dot is-pickup"
                                  aria-hidden="true"
                                />
                                <em>{place(d.pickup)}</em>
                              </span>
                              <span
                                title={`${d.recipientName} · ${place(d.dropoff)}`}
                              >
                                <i
                                  className="ops-route-dot is-drop"
                                  aria-hidden="true"
                                />
                                <em>{place(d.dropoff)}</em>
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="ops-when-stamp">
                              {formatWhen(orderWhenIso(d))}
                            </span>
                            <span
                              className={cx(
                                "ops-cell-sub",
                                d.pickupWindow === "schedule" && "is-scheduled"
                              )}
                            >
                              {d.pickupWindow === "schedule"
                                ? "Scheduled"
                                : "Same day"}
                            </span>
                          </td>
                          <td className="is-num">
                            <span className="ops-fare">GHS {d.fareGhs}</span>
                            <span
                              className={cx(
                                "ops-cell-sub",
                                d.paymentStatus === "paid" && "is-paid"
                              )}
                            >
                              {d.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                            </span>
                          </td>
                          <td className="ops-rider-cell">
                            <AssignControls {...assignProps(d, "row")} />
                          </td>
                          <td>
                            <OverflowMenu
                              delivery={d}
                              onOpen={() => setDetailId(d.trackingId)}
                            />
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
                {loading && deliveries.length === 0 ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="ops-order-card ops-skeleton"
                      aria-hidden="true"
                    />
                  ))
                ) : sorted.length === 0 ? (
                  <div className="ops-empty">
                    <p>{emptyCopy}</p>
                  </div>
                ) : (
                  sorted.map((d) => (
                    <article
                      key={d.id}
                      className={[
                        "ops-order-card",
                        assigningId === d.trackingId ? "is-busy" : "",
                        highlightId === d.trackingId ? "is-highlight" : "",
                        isClosedOrder(d) ? "is-closed" : "",
                        needsRider(d) ? "is-attention" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={(event) => openFromClick(event, d.trackingId)}
                    >
                      <div className="ops-card-top">
                        <div className="ops-card-id">
                          <button
                            type="button"
                            className="ops-code ops-id-link"
                            onClick={() => setDetailId(d.trackingId)}
                          >
                            {d.trackingId}
                          </button>
                          <StatusPill delivery={d} />
                        </div>
                        <div className="ops-card-fare">
                          <span className="ops-fare">GHS {d.fareGhs}</span>
                          <span
                            className={cx(
                              "ops-cell-sub",
                              d.paymentStatus === "paid" && "is-paid"
                            )}
                          >
                            {d.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                      </div>

                      <div className="ops-route">
                        <div className="ops-route-stop">
                          <span className="ops-route-dot is-pickup" />
                          <div className="ops-route-copy">
                            <strong>{place(d.pickup)}</strong>
                            <span>{d.senderName}</span>
                          </div>
                        </div>
                        <div className="ops-route-stop">
                          <span className="ops-route-dot is-drop" />
                          <div className="ops-route-copy">
                            <strong>{place(d.dropoff)}</strong>
                            <span>{d.recipientName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="ops-card-foot">
                        <span className="ops-card-when">
                          <span
                            className={cx(
                              "ops-when-kicker",
                              d.pickupWindow === "schedule" && "is-scheduled"
                            )}
                          >
                            {d.pickupWindow === "schedule"
                              ? "Scheduled"
                              : "Same day"}
                          </span>
                          {formatWhen(orderWhenIso(d))}
                        </span>
                        <div className="ops-card-assign">
                          <AssignControls {...assignProps(d, "row")} />
                          <OverflowMenu
                            delivery={d}
                            onOpen={() => setDetailId(d.trackingId)}
                          />
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </section>
            ) : null}
          </section>
        </div>

        <aside className="ops-riders" aria-label="Riders">
          <div className="ops-riders-head">
            <h2>Riders</h2>
            <span>{onlineRiders} online</span>
          </div>
          {agents.length === 0 ? (
            <p className="ops-muted">No active riders on Tookan.</p>
          ) : (
            <ul className="ops-rider-list">
              {agents.map((agent) => {
                const active = riderLoad.get(agent.name) ?? 0
                return (
                  <li key={agent.fleetId} className="ops-rider-row">
                    <span className="ops-avatar-wrap">
                      <span className="ops-avatar" aria-hidden="true">
                        {initials(agent.name)}
                      </span>
                      <span
                        className={cx(
                          "ops-presence",
                          agent.isAvailable && "is-on"
                        )}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="ops-rider-row-copy">
                      <strong>{agent.name}</strong>
                      <span>
                        {agent.isAvailable ? "Online" : "Busy"}
                        {" · "}
                        {active === 0
                          ? "no open jobs"
                          : `${active} open ${active === 1 ? "job" : "jobs"}`}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </div>

      {detailDelivery ? (
        <OpsOrderDrawer
          key={detailDelivery.trackingId}
          delivery={detailDelivery}
          secret={secret}
          assignSlot={
            <AssignControls {...assignProps(detailDelivery, "panel")} />
          }
          onClose={closeDetail}
          onUpdated={replaceDelivery}
          onDeleted={removeDelivery}
          onError={setError}
        />
      ) : null}

      {notice ? (
        <Toast
          kind="success"
          message={notice}
          onDismiss={() => setNotice(null)}
        />
      ) : null}
      {error && deliveries.length > 0 ? (
        <Toast kind="error" message={error} onDismiss={() => setError(null)} />
      ) : null}
    </main>
  )
}
