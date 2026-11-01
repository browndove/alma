"use client"

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import type { OpsAgent } from "@/lib/client-api"

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" className="ops-rider-chevron" aria-hidden="true">
      <path
        d="M4 6.2 8 10l4-3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 14 14" className="ops-rider-check" aria-hidden="true">
      <path
        d="M2.5 7.2 5.4 10l6-6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type MenuPos = { top: number; left: number; width: number }

type OpsRiderSelectProps = {
  agents: OpsAgent[]
  value: string
  onChange: (fleetId: string) => void
  disabled?: boolean
  placeholder?: string
}

export function OpsRiderSelect({
  agents,
  value,
  onChange,
  disabled = false,
  placeholder = "Select rider…",
}: OpsRiderSelectProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<MenuPos | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selected = agents.find((agent) => String(agent.fleetId) === value)
  const label = selected
    ? `${selected.name}${selected.isAvailable ? "" : " (busy)"}`
    : placeholder

  function updatePosition() {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 180),
    })
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (
        wrapRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    function onReposition() {
      updatePosition()
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("resize", onReposition)
    window.addEventListener("scroll", onReposition, true)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("resize", onReposition)
      window.removeEventListener("scroll", onReposition, true)
    }
  }, [open])

  return (
    <div
      className={`ops-rider-select${open ? " is-open" : ""}${disabled ? " is-disabled" : ""}`}
      ref={wrapRef}
    >
      <button
        type="button"
        className="ops-rider-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`ops-rider-value${selected ? "" : " is-placeholder"}`}>
          {label}
        </span>
        <ChevronIcon />
      </button>

      {open && pos
        ? createPortal(
            <div
              id={listId}
              ref={menuRef}
              className="ops-rider-menu"
              role="listbox"
              aria-label="Riders"
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                width: pos.width,
              }}
            >
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className={`ops-rider-option${!value ? " is-selected" : ""}`}
                onClick={() => {
                  onChange("")
                  setOpen(false)
                }}
              >
                <span className="ops-rider-option-check" aria-hidden="true">
                  {!value ? <CheckIcon /> : null}
                </span>
                <span>{placeholder}</span>
              </button>
              {agents.map((agent) => {
                const fleetId = String(agent.fleetId)
                const selectedOption = fleetId === value
                return (
                  <button
                    key={agent.fleetId}
                    type="button"
                    role="option"
                    aria-selected={selectedOption}
                    className={`ops-rider-option${selectedOption ? " is-selected" : ""}`}
                    onClick={() => {
                      onChange(fleetId)
                      setOpen(false)
                    }}
                  >
                    <span className="ops-rider-option-check" aria-hidden="true">
                      {selectedOption ? <CheckIcon /> : null}
                    </span>
                    <span className="ops-rider-option-copy">
                      <span className="ops-rider-option-name">{agent.name}</span>
                      {!agent.isAvailable ? (
                        <span className="ops-rider-option-meta">Busy</span>
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
