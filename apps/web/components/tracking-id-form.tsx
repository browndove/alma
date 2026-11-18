"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { ChevronRight } from "@/components/about-icons"

/** Tracking lookup with an inline message instead of the browser's "fill this field" bubble. */
export function TrackingIdForm() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const id = value.trim().toUpperCase()
    if (!id) {
      setError("Enter your tracking ID — it starts with DT-")
      return
    }
    router.push(`/track?id=${encodeURIComponent(id)}`)
  }

  return (
    <div className="tk-form-wrap">
      <form className={`tk-form${error ? " is-invalid" : ""}`} onSubmit={onSubmit} noValidate>
        <input
          name="id"
          className="tk-form-input"
          placeholder="Enter tracking ID, e.g. DT-94821"
          aria-label="Tracking ID"
          autoComplete="off"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "tk-form-error" : undefined}
        />
        <button type="submit" className="btn btn-primary tk-form-btn">
          Track
          <ChevronRight />
        </button>
      </form>
      {error ? (
        <p className="tk-form-error" id="tk-form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
