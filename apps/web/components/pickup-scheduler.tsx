"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDisplay(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function buildTimeSlots(selectedDay: Date, now: Date) {
  const slots: string[] = []
  const isToday = sameDay(selectedDay, now)

  for (let hour = 8; hour <= 20; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 20 && minute === 30) continue
      if (isToday) {
        const slot = new Date(selectedDay)
        slot.setHours(hour, minute, 0, 0)
        if (slot.getTime() <= now.getTime() + 15 * 60 * 1000) continue
      }
      slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`)
    }
  }
  return slots
}

export function PickupScheduler({
  open,
  value,
  onClose,
  onConfirm,
}: {
  open: boolean
  value: Date | null
  onClose: () => void
  onConfirm: (date: Date) => void
}) {
  const today = useMemo(() => startOfDay(new Date()), [open])
  const [viewMonth, setViewMonth] = useState(() => {
    const base = value ?? new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<Date>(() =>
    startOfDay(value ?? new Date()),
  )
  const [selectedTime, setSelectedTime] = useState(() => {
    if (!value) return ""
    return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
  })

  useEffect(() => {
    if (!open) return
    const base = value ?? new Date()
    setViewMonth(new Date(base.getFullYear(), base.getMonth(), 1))
    setSelectedDay(startOfDay(base))
    setSelectedTime(
      value
        ? `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
        : "",
    )
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const days = useMemo(() => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const first = new Date(year, month, 1)
    const startPad = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: Array<{ date: Date; inMonth: boolean } | null> = []

    for (let i = 0; i < startPad; i++) cells.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ date: new Date(year, month, day), inMonth: true })
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewMonth])

  const timeSlots = useMemo(
    () => buildTimeSlots(selectedDay, new Date()),
    [selectedDay, open],
  )

  useEffect(() => {
    if (!selectedTime) return
    if (!timeSlots.includes(selectedTime)) setSelectedTime("")
  }, [timeSlots, selectedTime])

  if (!open) return null
  if (typeof document === "undefined") return null

  const monthLabel = viewMonth.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  })

  const canPrevMonth =
    viewMonth.getFullYear() > today.getFullYear() ||
    (viewMonth.getFullYear() === today.getFullYear() &&
      viewMonth.getMonth() > today.getMonth())

  return createPortal(
    <div className="rd-scheduler" role="dialog" aria-modal="true" aria-label="Schedule pickup">
      <button type="button" className="rd-scheduler-backdrop" aria-label="Close" onClick={onClose} />
      <div className="rd-scheduler-panel">
        <div className="rd-scheduler-header">
          <div>
            <p className="rd-scheduler-title">Schedule pickup</p>
            <p className="rd-scheduler-subtitle">Choose a future date and time</p>
          </div>
          <button type="button" className="rd-scheduler-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="rd-scheduler-body">
          <div className="rd-scheduler-calendar">
            <div className="rd-scheduler-monthbar">
              <button
                type="button"
                className="rd-scheduler-nav"
                disabled={!canPrevMonth}
                onClick={() =>
                  setViewMonth(
                    new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
                  )
                }
              >
                ‹
              </button>
              <span>{monthLabel}</span>
              <button
                type="button"
                className="rd-scheduler-nav"
                onClick={() =>
                  setViewMonth(
                    new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
                  )
                }
              >
                ›
              </button>
            </div>

            <div className="rd-scheduler-weekdays">
              {WEEKDAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="rd-scheduler-grid">
              {days.map((cell, index) => {
                if (!cell) return <span key={`empty-${index}`} />
                const disabled = startOfDay(cell.date).getTime() < today.getTime()
                const active = sameDay(cell.date, selectedDay)
                return (
                  <button
                    key={cell.date.toISOString()}
                    type="button"
                    className={`rd-scheduler-day${active ? " rd-scheduler-day-active" : ""}`}
                    disabled={disabled}
                    onClick={() => setSelectedDay(startOfDay(cell.date))}
                  >
                    {cell.date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rd-scheduler-times">
            <p className="rd-scheduler-times-label">Time</p>
            <div className="rd-scheduler-times-list">
              {timeSlots.length === 0 ? (
                <p className="rd-scheduler-empty">No times left today. Pick another date.</p>
              ) : (
                timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`rd-scheduler-time${selectedTime === slot ? " rd-scheduler-time-active" : ""}`}
                    onClick={() => setSelectedTime(slot)}
                  >
                    {slot}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rd-scheduler-footer">
          <button type="button" className="rd-back" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="rd-continue"
            disabled={!selectedTime}
            onClick={() => {
              if (!selectedTime) return
              const [hours, minutes] = selectedTime.split(":").map(Number)
              const next = new Date(selectedDay)
              next.setHours(hours ?? 0, minutes ?? 0, 0, 0)
              if (next.getTime() < Date.now()) return
              onConfirm(next)
            }}
          >
            Confirm
          </button>
        </div>

        {value && (
          <p className="rd-scheduler-current">Currently set: {formatDisplay(value)}</p>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function formatPickupSchedule(date: Date) {
  return formatDisplay(date)
}
