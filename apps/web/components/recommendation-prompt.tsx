"use client"

import Link from "next/link"
import { useEffect, useState, type PointerEvent } from "react"

const promptText =
  "Sell bulk kitchenware to other businesses and retailers that need reliable delivery."

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

export function RecommendationPrompt() {
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const delay = isDeleting
      ? 32
      : displayText === promptText
        ? 2200
        : 38

    const timer = window.setTimeout(() => {
      if (!isDeleting) {
        const nextText = promptText.slice(0, displayText.length + 1)
        setDisplayText(nextText)

        if (nextText === promptText) {
          setIsDeleting(true)
        }
      } else {
        const nextText = promptText.slice(0, Math.max(displayText.length - 1, 0))
        setDisplayText(nextText)

        if (nextText === "") {
          setIsDeleting(false)
        }
      }
    }, delay)

    return () => window.clearTimeout(timer)
  }, [displayText, isDeleting])

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

  return (
    <section
      className="recommendation-panel"
      aria-labelledby="recommendation-title"
    >
      <h2 id="recommendation-title" className="recommendation-title">
        Get Diatel product recommendations
      </h2>
      <p className="recommendation-description">
        Enter your company&apos;s URL, or tell us what you sell and how you sell it.
      </p>

      <div className="recommendation-form">
        <div
          className="recommendation-input"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <div className="recommendation-hover-border" aria-hidden="true" />
          <div className="recommendation-hover-glow" aria-hidden="true" />
          <p
            className="recommendation-placeholder"
            aria-label={promptText}
            aria-live="off"
          >
            {displayText}
            <span className="recommendation-caret" aria-hidden="true" />
          </p>
          <div className="recommendation-controls">
            <span className="recommendation-strength">
              <span className="recommendation-strength-dot" />
              Input strength:
            </span>
            <span className="recommendation-suggestion">Business website</span>
            <span className="recommendation-suggestion">What you sell</span>
            <span className="recommendation-suggestion">How you charge</span>
            <span className="recommendation-suggestion">Who you sell to</span>
            <span className="recommendation-count">0/500</span>
            <button
              type="button"
              className="recommendation-submit"
              aria-label="Get recommendations"
            >
              <ChevronUp />
            </button>
          </div>
        </div>
        <p className="recommendation-note">
          By messaging, you understand how Diatel works and acknowledge our{" "}
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </section>
  )
}
