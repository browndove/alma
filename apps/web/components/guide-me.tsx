"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react"

const MAX_CHARS = 500

const DEMO_TEXT =
  "I need same-day delivery from Accra Mall to Oxford Street, Osu — documents, small package, ready for pickup now."

const SUGGESTIONS = [
  { id: "pickup", label: "Pickup address", text: "Pickup from " },
  { id: "dropoff", label: "Drop-off address", text: "Drop off at " },
  { id: "package", label: "Package type", text: "Package type: " },
  {
    id: "when",
    label: "When you need it",
    text: "I need it delivered ",
  },
] as const

function ChevronUp() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d="m4.5 9.5 3.5-3 3.5 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function strengthLevel(value: string) {
  const length = value.trim().length
  if (length === 0) return 0
  if (length < 40) return 1
  if (length < 120) return 2
  return 3
}

export function GuideMePage() {
  const [value, setValue] = useState("")
  const [focused, setFocused] = useState(false)
  const [activeChip, setActiveChip] = useState<string | null>(null)
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  const editing = focused || value.length > 0
  const level = useMemo(
    () => strengthLevel(editing ? value : displayText),
    [editing, value, displayText],
  )
  const count = editing ? value.length : 0

  useEffect(() => {
    if (editing) return

    const delay = isDeleting
      ? 28
      : displayText === DEMO_TEXT
        ? 2200
        : 36

    const timer = window.setTimeout(() => {
      if (!isDeleting) {
        const next = DEMO_TEXT.slice(0, displayText.length + 1)
        setDisplayText(next)
        if (next === DEMO_TEXT) setIsDeleting(true)
      } else {
        const next = DEMO_TEXT.slice(0, Math.max(displayText.length - 1, 0))
        setDisplayText(next)
        if (next === "") setIsDeleting(false)
      }
    }, delay)

    return () => window.clearTimeout(timer)
  }, [displayText, isDeleting, editing])

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100
    event.currentTarget.style.setProperty("--pointer-x", `${x}%`)
    event.currentTarget.style.setProperty("--pointer-y", `${y}%`)
  }

  function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--pointer-x", "50%")
    event.currentTarget.style.setProperty("--pointer-y", "50%")
  }

  function insertSuggestion(id: string, text: string) {
    setActiveChip(id)
    setFocused(true)
    setValue((current) => {
      const next =
        current.trim().length === 0 ? text : `${current.trim()} ${text}`
      return next.slice(0, MAX_CHARS)
    })
    window.requestAnimationFrame(() => areaRef.current?.focus())
  }

  return (
    <div className="guide-page">
      <div className="guide-bg" aria-hidden="true">
        <div className="guide-bg-wash" />
        <div className="guide-bg-blob guide-bg-blob-a" />
        <div className="guide-bg-blob guide-bg-blob-b" />
        <div className="guide-bg-blob guide-bg-blob-c" />
        <div className="guide-bg-grain" />
      </div>

      <div className="guide-lines" aria-hidden="true">
        <span className="guide-line guide-line-left" />
        <span className="guide-line guide-line-right" />
      </div>

      <header className="guide-header">
        <Link href="/" className="guide-logo" aria-label="Diatel home">
          <img src="/diatel-logo.png" alt="" className="guide-logo-mark" />
          <span className="guide-logo-word">diatel</span>
        </Link>
      </header>

      <main className="guide-main">
        <h1 className="guide-title">Get the right Diatel delivery option</h1>
        <p className="guide-subtitle">
          Tell us where it&apos;s going, what you&apos;re sending, and when you need
          it — we&apos;ll recommend the best way to deliver.
        </p>

        <form
          className="guide-form"
          onSubmit={(event) => {
            event.preventDefault()
          }}
        >
          <div
            className="guide-card"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onClick={() => areaRef.current?.focus()}
          >
            <div className="guide-card-border" aria-hidden="true" />
            <div className="guide-card-glow" aria-hidden="true" />

            {!editing && (
              <p className="guide-demo" aria-hidden="true">
                {displayText}
                <span className="guide-caret" />
              </p>
            )}

            <textarea
              ref={areaRef}
              className={`guide-textarea${editing ? "" : " guide-textarea-idle"}`}
              name="prompt"
              rows={4}
              maxLength={MAX_CHARS}
              placeholder=""
              value={value}
              onChange={(event) => setValue(event.target.value.slice(0, MAX_CHARS))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              aria-label="Describe your delivery"
            />

            <div className="guide-toolbar">
              <span className="guide-strength" data-level={level}>
                <span className="guide-strength-ring" aria-hidden="true" />
                Input strength:
              </span>

              <div className="guide-chips">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`guide-chip${activeChip === item.id ? " guide-chip-active" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      insertSuggestion(item.id, item.text)
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <span className="guide-count">
                {count}/{MAX_CHARS}
              </span>

              <button
                type="submit"
                className={`guide-submit${count > 0 ? " guide-submit-ready" : ""}`}
                aria-label="Get delivery recommendations"
                disabled={count === 0}
                onClick={(event) => event.stopPropagation()}
              >
                <ChevronUp />
              </button>
            </div>
          </div>

          <p className="guide-note">
            By messaging, you understand how Diatel handles delivery requests and
            acknowledge our <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </form>
      </main>
    </div>
  )
}
