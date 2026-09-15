"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"

import { GridRule, PageGrid } from "./page-grid"
import {
  formatPickupSchedule,
  PickupScheduler,
} from "./pickup-scheduler"
import { RequestDeliveryWave } from "./request-delivery-wave"

const STEPS = [
  { id: "details", label: "Your details" },
  { id: "package", label: "Your package" },
  { id: "confirm", label: "Confirm" },
] as const

const PACKAGE_TYPES = [
  "Documents",
  "Food",
  "Electronics",
  "Clothing",
  "Pharmacy",
  "Other",
] as const

const PACKAGE_SIZES = [
  { id: "small", label: "Small", hint: "Envelope / small bag" },
  { id: "medium", label: "Medium", hint: "Shopping bag / box" },
  { id: "large", label: "Large", hint: "Bulky box" },
] as const

const PAYERS = [
  { id: "sender", label: "Sender" },
  { id: "recipient", label: "Recipient" },
  { id: "business", label: "Business account" },
] as const

const PICKUP_WINDOWS = [
  { id: "now", label: "Ready now", hint: "Pickup as soon as a rider is nearby" },
  { id: "schedule", label: "Schedule pickup", hint: "Choose a future date and time" },
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className={className ?? "size-3"} fill="none">
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CustomSelect({
  options,
  value,
  onChange,
}: {
  options: readonly string[]
  value: string
  onChange: (val: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="rd-select-wrap" ref={containerRef}>
      <div 
        className={`rd-select rd-custom-select ${isOpen ? "rd-select-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        role="combobox"
        aria-expanded={isOpen}
      >
        <span>{value}</span>
        <span className="rd-select-chevron" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}>
          <ChevronDown />
        </span>
      </div>
      {isOpen && (
        <div className="rd-custom-select-dropdown" role="listbox">
          {options.map((item) => (
            <div
              key={item}
              className={`rd-custom-select-option ${item === value ? "rd-custom-select-option-active" : ""}`}
              onClick={() => {
                onChange(item)
                setIsOpen(false)
              }}
              role="option"
              aria-selected={item === value}
            >
              <span className="rd-custom-select-icon">
                {item === value && <CheckIcon />}
              </span>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StepIcon({ active, complete }: { active: boolean; complete: boolean }) {
  if (active) {
    return (
      <span className="rd-step-icon rd-step-icon-active" aria-hidden="true">
        <span className="rd-step-icon-dot" />
      </span>
    )
  }
  if (complete) {
    return (
      <span className="rd-step-icon rd-step-icon-complete" aria-hidden="true">
        <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }
  return <span className="rd-step-icon" aria-hidden="true" />
}

export function RequestDeliveryForm() {
  const [step, setStep] = useState(0)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  const [pickup, setPickup] = useState("")
  const [dropoff, setDropoff] = useState("")
  const [packageType, setPackageType] = useState<string>(PACKAGE_TYPES[0])
  const [size, setSize] = useState<(typeof PACKAGE_SIZES)[number]["id"]>("small")
  const [notes, setNotes] = useState("")
  const [fragile, setFragile] = useState(false)
  const [perishable, setPerishable] = useState(false)

  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [payer, setPayer] = useState<(typeof PAYERS)[number]["id"]>("sender")
  const [estimatedValue, setEstimatedValue] = useState("")
  const [photoName, setPhotoName] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [pickupWindow, setPickupWindow] =
    useState<(typeof PICKUP_WINDOWS)[number]["id"]>("now")
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null)
  const [schedulerOpen, setSchedulerOpen] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const copy =
    step === 0
      ? {
          title: "Let's get you to the right place",
          subtitle: "We just need a few quick details.",
        }
      : step === 1
        ? {
            title: "Tell us about the package",
            subtitle: "Pickup, drop-off, and what the rider should expect.",
          }
        : {
            title: "Finalize the delivery",
            subtitle: "Recipient, payment, timing, and a quick package photo.",
          }

  return (
    <div className="rd-page">
      <RequestDeliveryWave />

      <header className="rd-header">
        <Link href="/" className="rd-logo" aria-label="Diatel home">
          <img src="/diatel-logo.png" alt="" className="rd-logo-mark" />
          <span className="rd-logo-word">diatel</span>
        </Link>
        <Link href="/signin" className="rd-signup">
          Track order
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
                const complete = index < step
                return (
                  <div
                    key={item.id}
                    className={`rd-step${active ? " rd-step-active" : ""}${complete ? " rd-step-complete" : ""}`}
                    aria-current={active ? "step" : undefined}
                  >
                    <StepIcon active={active} complete={complete} />
                    <span className="rd-step-label">{item.label}</span>
                  </div>
                )
              })}
            </nav>

            <div className="rd-card-body">
              <h1 className="rd-title">{copy.title}</h1>
              <p className="rd-subtitle">{copy.subtitle}</p>

              <form
                className="rd-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (step === STEPS.length - 1) {
                    if (pickupWindow === "schedule" && !scheduledAt) {
                      setSchedulerOpen(true)
                      return
                    }
                    return
                  }
                  setStep((current) => current + 1)
                }}
              >
                {step === 0 && (
                  <>
                    <div className="rd-field">
                      <label className="rd-label" htmlFor="rd-full-name">
                        Full name
                      </label>
                      <input
                        id="rd-full-name"
                        className="rd-input"
                        type="text"
                        name="fullName"
                        autoComplete="name"
                        placeholder="Jane Doe"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        required
                      />
                    </div>

                    <div className="rd-field">
                      <label className="rd-label" htmlFor="rd-phone">
                        Phone number
                      </label>
                      <input
                        id="rd-phone"
                        className="rd-input"
                        type="tel"
                        name="phone"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="+233 24 000 0000"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        required
                      />
                    </div>

                    <div className="rd-field">
                      <label className="rd-label" htmlFor="rd-email">
                        Email
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
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="rd-field">
                      <label className="rd-label" htmlFor="rd-pickup">
                        Pickup
                      </label>
                      <input
                        id="rd-pickup"
                        className="rd-input"
                        type="text"
                        name="pickup"
                        autoComplete="street-address"
                        placeholder="e.g. Accra Mall, Tetteh Quarshie"
                        value={pickup}
                        onChange={(event) => setPickup(event.target.value)}
                        required
                      />
                    </div>

                    <div className="rd-field">
                      <label className="rd-label" htmlFor="rd-dropoff">
                        Drop-off
                      </label>
                      <input
                        id="rd-dropoff"
                        className="rd-input"
                        type="text"
                        name="dropoff"
                        autoComplete="street-address"
                        placeholder="e.g. 14 Oxford St, Osu"
                        value={dropoff}
                        onChange={(event) => setDropoff(event.target.value)}
                        required
                      />
                    </div>

                    <div className="rd-field">
                      <label className="rd-label" htmlFor="rd-package-type">
                        Package type
                      </label>
                      <CustomSelect
                        options={PACKAGE_TYPES}
                        value={packageType}
                        onChange={setPackageType}
                      />
                    </div>

                    <div className="rd-field rd-field-top">
                      <span className="rd-label" id="rd-size-label">
                        Size
                      </span>
                      <div
                        className="rd-size-group"
                        role="radiogroup"
                        aria-labelledby="rd-size-label"
                      >
                        {PACKAGE_SIZES.map((item) => (
                          <label
                            key={item.id}
                            className={`rd-size-option${size === item.id ? " rd-size-option-active" : ""}`}
                          >
                            <input
                              type="radio"
                              name="size"
                              value={item.id}
                              checked={size === item.id}
                              onChange={() => setSize(item.id)}
                            />
                            <span className="rd-size-title">{item.label}</span>
                            <span className="rd-size-hint">{item.hint}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rd-field rd-field-top">
                      <label className="rd-label" htmlFor="rd-notes">
                        Notes
                      </label>
                      <textarea
                        id="rd-notes"
                        className="rd-textarea"
                        name="notes"
                        rows={3}
                        placeholder="Optional — gate code, landmark, what’s inside…"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                      />
                    </div>

                    <div className="rd-field rd-field-top">
                      <span className="rd-label" id="rd-handling-label">
                        Handling
                      </span>
                      <div
                        className="rd-check-group"
                        role="group"
                        aria-labelledby="rd-handling-label"
                      >
                        <label className="rd-check">
                          <input
                            type="checkbox"
                            name="fragile"
                            checked={fragile}
                            onChange={(event) => setFragile(event.target.checked)}
                          />
                          <span>Fragile</span>
                        </label>
                        <label className="rd-check">
                          <input
                            type="checkbox"
                            name="perishable"
                            checked={perishable}
                            onChange={(event) => setPerishable(event.target.checked)}
                          />
                          <span>Perishable</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="rd-field">
                      <label className="rd-label" htmlFor="rd-recipient-name">
                        Recipient name
                      </label>
                      <input
                        id="rd-recipient-name"
                        className="rd-input"
                        type="text"
                        name="recipientName"
                        autoComplete="name"
                        placeholder="Recipient full name"
                        value={recipientName}
                        onChange={(event) => setRecipientName(event.target.value)}
                        required
                      />
                    </div>

                    <div className="rd-field">
                      <label className="rd-label" htmlFor="rd-recipient-phone">
                        Recipient phone
                      </label>
                      <input
                        id="rd-recipient-phone"
                        className="rd-input"
                        type="tel"
                        name="recipientPhone"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="+233 24 000 0000"
                        value={recipientPhone}
                        onChange={(event) => setRecipientPhone(event.target.value)}
                        required
                      />
                    </div>

                    <div className="rd-field rd-field-top">
                      <span className="rd-label" id="rd-payer-label">
                        Who pays
                      </span>
                      <div
                        className="rd-choice-group"
                        role="radiogroup"
                        aria-labelledby="rd-payer-label"
                      >
                        {PAYERS.map((item) => (
                          <label
                            key={item.id}
                            className={`rd-choice${payer === item.id ? " rd-choice-active" : ""}`}
                          >
                            <input
                              type="radio"
                              name="payer"
                              value={item.id}
                              checked={payer === item.id}
                              onChange={() => setPayer(item.id)}
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rd-field">
                      <label className="rd-label" htmlFor="rd-value">
                        Estimated value
                      </label>
                      <div className="rd-value-wrap">
                        <span className="rd-value-prefix">GHS</span>
                        <input
                          id="rd-value"
                          className="rd-input rd-input-value"
                          type="number"
                          name="estimatedValue"
                          inputMode="decimal"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={estimatedValue}
                          onChange={(event) => setEstimatedValue(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="rd-field rd-field-top">
                      <span className="rd-label" id="rd-photo-label">
                        Package photo
                      </span>
                      <div className="rd-photo-block" aria-labelledby="rd-photo-label">
                        <input
                          ref={photoInputRef}
                          id="rd-photo"
                          className="rd-photo-input"
                          type="file"
                          name="packagePhoto"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (photoPreview) URL.revokeObjectURL(photoPreview)
                            if (!file) {
                              setPhotoName("")
                              setPhotoPreview(null)
                              return
                            }
                            setPhotoName(file.name)
                            setPhotoPreview(URL.createObjectURL(file))
                          }}
                        />
                        {photoPreview ? (
                          <div className="rd-photo-preview">
                            <img src={photoPreview} alt="Package preview" />
                            <div className="rd-photo-meta">
                              <span className="rd-photo-name">{photoName}</span>
                              <button
                                type="button"
                                className="rd-photo-change"
                                onClick={() => photoInputRef.current?.click()}
                              >
                                Change photo
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="rd-photo-upload"
                            onClick={() => photoInputRef.current?.click()}
                          >
                            <span className="rd-photo-upload-title">Upload a photo</span>
                            <span className="rd-photo-upload-hint">
                              Optional — helps riders and support
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="rd-field rd-field-top">
                      <span className="rd-label" id="rd-window-label">
                        Pickup window
                      </span>
                      <div
                        className="rd-window-group"
                        role="radiogroup"
                        aria-labelledby="rd-window-label"
                      >
                        {PICKUP_WINDOWS.map((item) => {
                          const scheduledHint =
                            item.id === "schedule" && scheduledAt
                              ? formatPickupSchedule(scheduledAt)
                              : item.hint
                          return (
                            <button
                              key={item.id}
                              type="button"
                              role="radio"
                              aria-checked={pickupWindow === item.id}
                              className={`rd-size-option${pickupWindow === item.id ? " rd-size-option-active" : ""}`}
                              onClick={() => {
                                if (item.id === "schedule") {
                                  setPickupWindow("schedule")
                                  setSchedulerOpen(true)
                                  return
                                }
                                setPickupWindow("now")
                                setScheduledAt(null)
                              }}
                            >
                              <span className="rd-size-title">{item.label}</span>
                              <span className="rd-size-hint">{scheduledHint}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                <PickupScheduler
                  open={schedulerOpen}
                  value={scheduledAt}
                  onClose={() => {
                    setSchedulerOpen(false)
                    if (!scheduledAt) setPickupWindow("now")
                  }}
                  onConfirm={(date) => {
                    setScheduledAt(date)
                    setPickupWindow("schedule")
                    setSchedulerOpen(false)
                  }}
                />

                <div className="rd-actions">
                  {step > 0 && (
                    <button
                      type="button"
                      className="rd-back"
                      onClick={() => setStep((current) => Math.max(0, current - 1))}
                    >
                      Back
                    </button>
                  )}
                  <button type="submit" className="rd-continue">
                    {step === STEPS.length - 1 ? "Request delivery" : "Continue"}
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
