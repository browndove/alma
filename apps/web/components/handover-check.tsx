"use client"

import { useState, type FormEvent } from "react"

import { DIATEL_PHONE_DISPLAY, DIATEL_TEL_HREF } from "@/lib/diatel-contact"

type Outcome =
  | { kind: "idle" }
  | { kind: "confirmed" }
  | { kind: "error"; message: string; locked: boolean }

/** Rider enters the 4-digit code the recipient reads out at drop-off. */
export function HandoverCheck({ trackingId }: { trackingId: string }) {
  const [code, setCode] = useState("")
  const [checking, setChecking] = useState(false)
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" })

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!/^\d{4}$/.test(code)) {
      setOutcome({ kind: "error", message: "Enter all 4 digits of the code.", locked: false })
      return
    }
    setChecking(true)
    try {
      const response = await fetch(`/api/handover/${encodeURIComponent(trackingId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const json = (await response.json()) as { ok: boolean; error?: string }
      if (response.ok && json.ok) {
        setOutcome({ kind: "confirmed" })
      } else {
        setOutcome({
          kind: "error",
          message: json.error || "Couldn’t check the code. Try again.",
          locked: response.status === 423,
        })
        setCode("")
      }
    } catch {
      setOutcome({ kind: "error", message: "No connection — try again.", locked: false })
    } finally {
      setChecking(false)
    }
  }

  const locked = outcome.kind === "error" && outcome.locked

  return (
    <main className="ho-page">
      <div className="ho-card">
        <p className="ho-kicker">Diatel · Rider handover</p>
        <h1 className="ho-title">
          {outcome.kind === "confirmed" ? "Handover confirmed" : "Confirm the handover"}
        </h1>
        <p className="ho-order">
          Order <strong>{trackingId}</strong>
        </p>

        {outcome.kind === "confirmed" ? (
          <div className="ho-success" role="status">
            <span className="ho-success-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="m6.5 12.5 3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p>The code is correct. This delivery is confirmed — thank you.</p>
          </div>
        ) : (
          <form className="ho-form" onSubmit={onSubmit} noValidate>
            <label className="ho-label" htmlFor="ho-code">
              Ask the recipient for their 4-digit code
            </label>
            <input
              id="ho-code"
              className={`ho-input${outcome.kind === "error" ? " is-invalid" : ""}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              placeholder="• • • •"
              value={code}
              disabled={locked || checking}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, "").slice(0, 4))
                if (outcome.kind === "error" && !outcome.locked) setOutcome({ kind: "idle" })
              }}
              aria-invalid={outcome.kind === "error" ? true : undefined}
              aria-describedby={outcome.kind === "error" ? "ho-error" : undefined}
            />
            {outcome.kind === "error" ? (
              <p className="ho-error" id="ho-error" role="alert">
                {outcome.message}
              </p>
            ) : null}
            {locked ? (
              <a className="ho-button" href={DIATEL_TEL_HREF}>
                Call Diatel ops · {DIATEL_PHONE_DISPLAY}
              </a>
            ) : (
              <button type="submit" className="ho-button" disabled={checking || code.length !== 4}>
                {checking ? "Checking…" : "Confirm handover"}
              </button>
            )}
            <p className="ho-hint">
              The recipient got this code by email from Diatel. Hand the package
              over once it checks out.
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
