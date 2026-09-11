"use client"

import Link from "next/link"
import { useState } from "react"

import { GridRule, PageGrid } from "./page-grid"
import { RequestDeliveryWave } from "./request-delivery-wave"

const STEPS = [
  { id: "email", label: "Your email" },
  { id: "info", label: "Your info" },
  { id: "talk", label: "Let's talk" },
] as const

const COUNTRIES = [
  "United States",
  "Ghana",
  "United Kingdom",
  "Nigeria",
  "Canada",
  "Germany",
  "France",
  "Netherlands",
  "South Africa",
  "Kenya",
] as const

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={className ?? "size-3"}
      fill="none"
    >
      <path
        d="M4.25 2.25 8.5 6 4.25 9.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3" fill="none">
      <path
        d="M2.5 4.25 6 7.75 9.5 4.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StepIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="rd-step-icon rd-step-icon-active" aria-hidden="true">
        <span className="rd-step-icon-dot" />
      </span>
    )
  }
  return <span className="rd-step-icon" aria-hidden="true" />
}

export function RequestDeliveryForm() {
  const [step] = useState(0)
  const [email, setEmail] = useState("")
  const [country, setCountry] = useState<string>(COUNTRIES[0])

  return (
    <div className="rd-page">
      <RequestDeliveryWave />

      <header className="rd-header">
        <Link href="/" className="rd-logo" aria-label="Diatel home">
          <img src="/diatel-logo.png" alt="" className="rd-logo-mark" />
          <span className="rd-logo-word">diatel</span>
        </Link>
        <Link href="/signin" className="rd-signup">
          Sign up
          <ChevronRight />
        </Link>
      </header>

      <PageGrid>
        <GridRule />

        <main className="rd-main">
          <div className="rd-card">
            <nav className="rd-steps" aria-label="Form progress">
              {STEPS.map((item, index) => {
                const active = index === step
                return (
                  <div
                    key={item.id}
                    className={`rd-step${active ? " rd-step-active" : ""}`}
                    aria-current={active ? "step" : undefined}
                  >
                    <StepIcon active={active} />
                    <span className="rd-step-label">{item.label}</span>
                  </div>
                )
              })}
            </nav>

            <div className="rd-card-body">
              <h1 className="rd-title">Let&apos;s get you to the right place</h1>
              <p className="rd-subtitle">We just need a few quick details.</p>

              <form
                className="rd-form"
                onSubmit={(event) => {
                  event.preventDefault()
                }}
              >
                <div className="rd-field">
                  <label className="rd-label" htmlFor="rd-email">
                    Work email
                  </label>
                  <input
                    id="rd-email"
                    className="rd-input"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="rd-field">
                  <label className="rd-label" htmlFor="rd-country">
                    Country/Region
                  </label>
                  <div className="rd-select-wrap">
                    <select
                      id="rd-country"
                      className="rd-select"
                      name="country"
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                    >
                      {COUNTRIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <span className="rd-select-chevron">
                      <ChevronDown />
                    </span>
                  </div>
                </div>

                <div className="rd-actions">
                  <button type="submit" className="rd-continue">
                    Continue
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </PageGrid>
    </div>
  )
}
