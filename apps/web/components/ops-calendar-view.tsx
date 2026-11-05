"use client"

import { useEffect, useMemo, useState } from "react"

import type { OpsAgent } from "@/lib/client-api"
import type { Delivery } from "@/lib/deliveries/types"

const DAY_MS = 86_400_000

function accraParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    weekday: get("weekday"),
    key: `${get("year")}-${get("month")}-${get("day")}`,
  }
}

function startOfAccraDay(date = new Date()) {
  const { year, month, day } = accraParts(date)
  // Construct a UTC instant that represents midnight Accra (GMT+0).
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`)
}

function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * DAY_MS)
}

function orderDayKey(delivery: Delivery) {
  const iso =
    delivery.pickupWindow === "schedule" && delivery.scheduledAt
      ? delivery.scheduledAt
      : delivery.createdAt
  return accraParts(new Date(iso)).key
}

function toneClass(delivery: Delivery) {
  if (delivery.pickupWindow === "schedule") return "is-violet"
  if (
    !delivery.riderName &&
    (delivery.status === "unassigned" ||
      delivery.status === "requested" ||
      delivery.status === "matching")
  ) {
    return "is-amber"
  }
  if (delivery.status === "delivered") return "is-green"
  if (
    delivery.status === "failed" ||
    delivery.status === "cancelled" ||
    delivery.status === "declined"
  ) {
    return "is-red"
  }
  return "is-indigo"
}

function statusChip(delivery: Delivery) {
  if (
    !delivery.riderName &&
    (delivery.status === "unassigned" ||
      delivery.status === "requested" ||
      delivery.status === "matching")
  ) {
    return "Needs rider"
  }
  if (delivery.pickupWindow === "schedule") return "Scheduled"
  return delivery.status.replace(/_/g, " ")
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
}

type OpsCalendarViewProps = {
  deliveries: Delivery[]
  agents: OpsAgent[]
  selectedId: string | null
  onSelect: (trackingId: string) => void
}

export function OpsCalendarView({
  deliveries,
  agents,
  selectedId,
  onSelect,
}: OpsCalendarViewProps) {
  const todayStart = useMemo(() => startOfAccraDay(), [])
  const [rangeStart, setRangeStart] = useState(() =>
    addDays(startOfAccraDay(), -1),
  )
  const [visibleDays, setVisibleDays] = useState(7)

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 768px)")
    const compact = window.matchMedia("(max-width: 480px)")
    function apply() {
      if (compact.matches) setVisibleDays(3)
      else if (narrow.matches) setVisibleDays(4)
      else setVisibleDays(7)
    }
    apply()
    narrow.addEventListener("change", apply)
    compact.addEventListener("change", apply)
    return () => {
      narrow.removeEventListener("change", apply)
      compact.removeEventListener("change", apply)
    }
  }, [])

  const days = useMemo(
    () =>
      Array.from({ length: visibleDays }, (_, index) => {
        const date = addDays(rangeStart, index)
        const parts = accraParts(date)
        const todayKey = accraParts(todayStart).key
        return {
          key: parts.key,
          weekday: parts.weekday,
          dayNum: Number(parts.day),
          isToday: parts.key === todayKey,
          isWeekend: parts.weekday === "Sat" || parts.weekday === "Sun",
          label: date.toLocaleDateString("en-GH", {
            timeZone: "Africa/Accra",
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        }
      }),
    [rangeStart, todayStart, visibleDays],
  )

  const rangeLabel = useMemo(() => {
    if (days.length === 0) return ""
    const first = days[0]!
    const last = days[days.length - 1]!
    return `${first.label} – ${last.label}`
  }, [days])

  const rows = useMemo(() => {
    const byRider = new Map<string, Delivery[]>()
    const unassigned: Delivery[] = []
    const unknownRiders = new Map<string, Delivery[]>()

    for (const delivery of deliveries) {
      if (!delivery.riderName) {
        unassigned.push(delivery)
        continue
      }
      const agent = agents.find(
        (item) => item.name.toLowerCase() === delivery.riderName!.toLowerCase(),
      )
      if (agent) {
        const list = byRider.get(String(agent.fleetId)) || []
        list.push(delivery)
        byRider.set(String(agent.fleetId), list)
      } else {
        const list = unknownRiders.get(delivery.riderName) || []
        list.push(delivery)
        unknownRiders.set(delivery.riderName, list)
      }
    }

    type Row = {
      id: string
      name: string
      meta: string
      avatar: string
      deliveries: Delivery[]
    }

    const result: Row[] = [
      {
        id: "unassigned",
        name: "Unassigned",
        meta: "Needs a rider",
        avatar: "!",
        deliveries: unassigned,
      },
      ...agents.map((agent) => ({
        id: String(agent.fleetId),
        name: agent.name,
        meta: agent.isAvailable ? "Online" : "Busy",
        avatar: initials(agent.name),
        deliveries: byRider.get(String(agent.fleetId)) || [],
      })),
      ...Array.from(unknownRiders.entries()).map(([name, list]) => ({
        id: `rider-${name}`,
        name,
        meta: "Assigned",
        avatar: initials(name),
        deliveries: list,
      })),
    ]

    return result
  }, [deliveries, agents])

  function eventsFor(rowDeliveries: Delivery[], dayKey: string) {
    return rowDeliveries.filter((delivery) => orderDayKey(delivery) === dayKey)
  }

  return (
    <section className="ops-cal" aria-label="Orders calendar">
      <div className="ops-cal-toolbar">
        <div>
          <h2 className="ops-cal-title">Dispatch calendar</h2>
          <p className="ops-cal-sub">Accra days · same data as the list</p>
        </div>
        <div className="ops-cal-controls">
          <button
            type="button"
            className="ops-btn ops-btn-ghost ops-cal-date"
            disabled
            aria-label="Visible date range"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <rect
                x="2"
                y="3"
                width="12"
                height="11"
                rx="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M2 6.5h12M5 2v2.5M11 2v2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            {rangeLabel}
          </button>
          <button
            type="button"
            className="ops-btn ops-btn-ghost"
            onClick={() =>
              setRangeStart((current) => addDays(current, -visibleDays))
            }
            aria-label="Previous range"
          >
            ←
          </button>
          <button
            type="button"
            className="ops-btn ops-btn-ghost"
            onClick={() => setRangeStart(addDays(todayStart, -1))}
          >
            Today
          </button>
          <button
            type="button"
            className="ops-btn ops-btn-ghost"
            onClick={() =>
              setRangeStart((current) => addDays(current, visibleDays))
            }
            aria-label="Next range"
          >
            →
          </button>
        </div>
      </div>

      <div className="ops-cal-scroll">
        <div
          className="ops-cal-grid"
          style={{ ["--ops-cal-days" as string]: String(visibleDays) }}
        >
          <div className="ops-cal-corner">Riders</div>
          {days.map((day) => (
            <div
              key={day.key}
              className={`ops-cal-dayhead${day.isToday ? " is-today" : ""}${day.isWeekend ? " is-weekend" : ""}`}
            >
              <span className="ops-cal-weekday">{day.weekday}</span>
              <span className={`ops-cal-daynum${day.isToday ? " is-today" : ""}`}>
                {day.dayNum}
              </span>
            </div>
          ))}

          {rows.map((row) => (
            <div key={row.id} className="ops-cal-row-contents">
              <div className="ops-cal-rider">
                <span className="ops-avatar" aria-hidden="true">
                  {row.avatar}
                </span>
                <span className="ops-cal-rider-copy">
                  <strong>{row.name}</strong>
                  <span>{row.meta}</span>
                </span>
              </div>
              {days.map((day) => {
                const events = eventsFor(row.deliveries, day.key)
                return (
                  <div
                    key={`${row.id}-${day.key}`}
                    className={`ops-cal-cell${day.isToday ? " is-today" : ""}${day.isWeekend ? " is-weekend" : ""}`}
                  >
                    {day.isToday ? (
                      <span className="ops-cal-today-line" aria-hidden="true" />
                    ) : null}
                    {events.map((delivery) => (
                      <button
                        key={delivery.id}
                        type="button"
                        className={`ops-cal-event ${toneClass(delivery)}${selectedId === delivery.trackingId ? " is-selected" : ""}`}
                        onClick={() => onSelect(delivery.trackingId)}
                        aria-pressed={selectedId === delivery.trackingId}
                        title={`${delivery.trackingId} · ${delivery.senderName} → ${delivery.recipientName}`}
                      >
                        <span className="ops-cal-event-top">
                          <span className="ops-cal-event-id">{delivery.trackingId}</span>
                          <span className="ops-cal-event-chip">
                            · {statusChip(delivery)}
                          </span>
                        </span>
                        <span className="ops-cal-event-route">
                          {delivery.senderName} → {delivery.recipientName}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
