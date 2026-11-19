"use client"

import dynamic from "next/dynamic"
import { useState, useRef, useEffect, useMemo, type ReactNode } from "react"

import { CheckoutSummary } from "./checkout-summary"
import { payLinkStatus, type PayLinkStatus } from "@/lib/deliveries/pay-link"
import { RequestDeliveryConfetti } from "./request-delivery-confetti"
import {
  RequestDeliveryConfirmation,
  type PayMethod,
} from "./request-delivery-confirmation"
import {
  formatPickupSchedule,
  PickupScheduler,
} from "./pickup-scheduler"
import type { MapPickedLocation } from "./location-map-picker"
import {
  createDeliveryRequest,
  fetchPaymentStatus,
  initializePayment,
  resendPayLink,
  reverseGeocode,
} from "@/lib/client-api"
import { ApiRequestError, formatZodIssues } from "@/lib/api-errors"
import {
  quoteDeliveryFare,
  resolveAddressCoords,
  TRAFFIC_LABELS,
} from "@/lib/deliveries/fare"
import { LARGE_SURCHARGE_GHS } from "@/lib/deliveries/price-list"
import {
  createDeliverySchema,
  SAME_EMAIL_MESSAGE,
  SAME_PHONE_MESSAGE,
} from "@/lib/deliveries/types"
import { ghanaPhoneError, normalizeGhanaPhone } from "@/lib/phone"
import {
  DIATEL_PHONE_DISPLAY,
  DIATEL_TEL_HREF,
  diatelWhatsAppHref,
} from "@/lib/diatel-contact"
import { parseCoordsFromAddress } from "@/lib/deliveries/tookan"

const LocationMapPicker = dynamic(
  () =>
    import("./location-map-picker").then((mod) => mod.LocationMapPicker),
  { ssr: false }
)

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
  {
    id: "sender",
    label: "I pay",
    hint: "Pay now with MoMo or card",
  },
  {
    id: "recipient",
    label: "Recipient pays",
    hint: "We email them a secure pay link",
  },
] as const

type PaymentPhase = "form" | "redirecting" | "awaiting" | "paid" | "failed"

type FieldName =
  | "senderName"
  | "senderPhone"
  | "senderEmail"
  | "pickup"
  | "dropoff"
  | "recipientName"
  | "recipientPhone"
  | "recipientEmail"
  | "scheduledAt"

type FieldErrors = Partial<Record<FieldName, string>>

/** Order the form shows them in — the first invalid one gets focus. */
const FIELD_ORDER: FieldName[] = [
  "senderName",
  "senderPhone",
  "senderEmail",
  "pickup",
  "recipientName",
  "recipientPhone",
  "recipientEmail",
  "dropoff",
  "scheduledAt",
]

const FIELD_INPUT_IDS: Record<FieldName, string> = {
  senderName: "rd-full-name",
  senderPhone: "rd-phone",
  senderEmail: "rd-email",
  pickup: "rd-pickup",
  dropoff: "rd-dropoff",
  recipientName: "rd-recipient-name",
  recipientPhone: "rd-recipient-phone",
  recipientEmail: "rd-recipient-email",
  scheduledAt: "rd-window-label",
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Our own inline messages — the form is noValidate so browser bubbles never show. */
function validateField(field: FieldName, raw: string): string | null {
  const value = raw.trim()
  switch (field) {
    case "senderName":
      return value.length >= 2 ? null : "Enter your full name"
    case "recipientName":
      return value.length >= 2 ? null : "Enter the recipient’s full name"
    case "senderPhone":
    case "recipientPhone":
      if (!value) {
        return field === "senderPhone"
          ? "Enter your phone number"
          : "Enter the recipient’s phone number"
      }
      return ghanaPhoneError(value)
    case "senderEmail":
    case "recipientEmail":
      if (!value) {
        return field === "senderEmail"
          ? "Enter your email"
          : "Enter the recipient’s email"
      }
      return EMAIL_PATTERN.test(value) ? null : "Enter a valid email address"
    case "pickup":
      return value.length >= 3
        ? null
        : "Pin your pickup — tap Map or Locate"
    case "dropoff":
      return value.length >= 3 ? null : "Pin the drop-off on the map"
    case "scheduledAt":
      return value ? null : "Choose a pickup date and time"
  }
}

/**
 * Old step numbers from api-errors → sections of the single-page form:
 * 0 Pickup (sender + pickup), 1 Drop-off (recipient + drop-off), 2 Package, 3 Payment.
 */
function sectionForStep(step: number | null | undefined) {
  if (step === 0) return 0
  if (step === 1) return 0
  if (step === 2) return 1
  return null
}

type SectionKey = "pickup" | "dropoff" | "package" | "payment"

const SECTION_ICON_PATHS: Record<SectionKey, ReactNode> = {
  pickup: (
    <>
      <circle cx="10" cy="10" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2.25" fill="currentColor" />
    </>
  ),
  dropoff: (
    <>
      <path d="M10 17.5s5.5-4.75 5.5-9a5.5 5.5 0 0 0-11 0c0 4.25 5.5 9 5.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="10" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  package: (
    <>
      <path d="M10 2.75 16.5 6v8L10 17.25 3.5 14V6L10 2.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3.5 6 10 9.25 16.5 6M10 9.25v8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  payment: (
    <>
      <rect x="2.75" y="5" width="14.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.75 8.25h14.5M5.75 12.25h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
}

/** Section header: icon badge that turns into a check once the section is filled in. */
function SectionHead({
  icon,
  title,
  hint,
  complete,
}: {
  icon: SectionKey
  title: string
  hint: string
  complete: boolean
}) {
  return (
    <header className={`ck-section-head${complete ? " is-complete" : ""}`}>
      <span className="ck-section-icon" aria-hidden="true">
        {complete ? (
          <svg viewBox="0 0 20 20" fill="none">
            <path d="m5.5 10.25 3 3 6-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="none">
            {SECTION_ICON_PATHS[icon]}
          </svg>
        )}
      </span>
      <div className="ck-section-head-copy">
        <h2 className="ck-section-title">
          {title}
          {complete ? <span className="sr-only"> (complete)</span> : null}
        </h2>
        <p className="ck-section-hint">{hint}</p>
      </div>
    </header>
  )
}

function SizeIcon({ id }: { id: (typeof PACKAGE_SIZES)[number]["id"] }) {
  if (id === "small") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="ck-segment-icon">
        <rect x="4" y="7" width="16" height="11" rx="1.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="m4.5 8 7.5 5.5L19.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }
  if (id === "medium") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="ck-segment-icon">
        <path d="M5.5 8.5h13l-1 11h-11l-1-11Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 10.5V7.25a3 3 0 0 1 6 0v3.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="ck-segment-icon">
      <path d="M12 3 20.5 7.25v9.5L12 21l-8.5-4.25v-9.5L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3.5 7.25 12 11.5l8.5-4.25M12 11.5V21M7.75 5.1l8.5 4.3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function PickupIcon({ id }: { id: (typeof PICKUP_WINDOWS)[number]["id"] }) {
  return id === "now" ? (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M11 2.75 4.5 11.25H10l-1 6 6.5-8.5H10l1-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8.5h14M7 2.75v3.5M13 2.75v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="ck-submit-lock">
      <rect x="3.25" y="7" width="9.5" height="6.75" rx="1.5" fill="currentColor" />
      <path d="M5.25 7V5.25a2.75 2.75 0 0 1 5.5 0V7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

/** Shown when an address is outside the price list: hand off to a human quote. */
function QuoteNeeded({
  reason,
  pickup,
  dropoff,
}: {
  reason: "pickup" | "dropoff"
  pickup: string
  dropoff: string
}) {
  const place = (value: string) => parseCoordsFromAddress(value).label || value
  const message = [
    "Hi Diatel, I’d like a delivery quote.",
    `Pickup: ${place(pickup)}`,
    `Drop-off: ${place(dropoff)}`,
  ].join("\n")
  return (
    <div className="ck-quote" role="status">
      <div className="ck-quote-copy">
        <strong>
          {reason === "pickup"
            ? "This pickup is outside our listed areas"
            : "This drop-off is outside our listed areas"}
        </strong>
        <span>
          We price these trips one by one. Message or call us and we’ll quote it
          for you.
        </span>
      </div>
      <div className="ck-quote-actions">
        <a
          className="ck-quote-btn is-whatsapp"
          href={diatelWhatsAppHref(message)}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp us
        </a>
        <a className="ck-quote-btn" href={DIATEL_TEL_HREF}>
          Call {DIATEL_PHONE_DISPLAY}
        </a>
      </div>
    </div>
  )
}

function FieldErrorText({ id, message }: { id: string; message: string }) {
  return (
    <p className="ck-field-error" id={id}>
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.75v3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.9" fill="currentColor" />
      </svg>
      {message}
    </p>
  )
}

const PICKUP_WINDOWS = [
  { id: "now", label: "Ready now", hint: "Pickup as soon as a rider is nearby" },
  { id: "schedule", label: "Schedule pickup", hint: "Choose a future date and time" },
] as const

function digitsOnly(value: string) {
  return value.replace(/\D/g, "")
}

function PayerIcon({ id }: { id: (typeof PAYERS)[number]["id"] }) {
  if (id === "sender") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-[18px]">
        <rect x="2.75" y="5" width="14.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2.75 8.25h14.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.75 12.25h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-[18px]">
      <path d="M17 3 9.25 10.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 3l-4.75 14-3-6.25L3 7.75 17 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
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

function LocateIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none">
      <circle cx="8" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none">
      <path
        d="M2.25 4.25 6 2.75l4 1.5 3.75-1.5v9.5L10 13.75l-4-1.5-3.75 1.5V4.25Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M6 2.75v9.5M10 4.25v9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function parseLocationFromValue(value: string): MapPickedLocation | null {
  const match = value.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/)
  if (!match) return null
  const lat = Number(match[1])
  const lng = Number(match[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const label =
    value
      .replace(/\s*·\s*-?\d{1,2}\.\d+\s*,\s*-?\d{1,3}\.\d+\s*$/, "")
      .trim() || value.trim()
  return { label, lat, lng }
}

type CapturedLocation = {
  label: string
  lat: number
  lng: number
  accuracy: number
  /** Where the point came from — shown under the address field. */
  source: "gps" | "map"
}

type LocationCaptureState = {
  status: "idle" | "locating" | "error"
  captured: CapturedLocation | null
  applied: boolean
  error: string | null
}

const idleLocationState: LocationCaptureState = {
  status: "idle",
  captured: null,
  applied: false,
  error: null,
}

function formatAccuracy(meters: number) {
  if (!Number.isFinite(meters) || meters <= 0) return "GPS fix"
  if (meters < 1000) return `±${Math.round(meters)} m`
  return `±${(meters / 1000).toFixed(1)} km`
}

function formatCoords(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

function buildLocationLabel(label: string, lat: number, lng: number) {
  const coords = formatCoords(lat, lng)
  const stripped = label
    .trim()
    .replace(/\s*·\s*-?\d{1,2}\.\d+\s*,\s*-?\d{1,3}\.\d+\s*$/, "")
    .trim()
  const base = stripped || "Current location"
  if (base.includes(coords)) return base.slice(0, 220)
  // Always keep coords intact — long reverse-geocode labels used to truncate them.
  const suffix = ` · ${coords}`
  const maxBase = Math.max(0, 220 - suffix.length)
  return `${base.slice(0, maxBase)}${suffix}`
}

async function captureDeviceLocation(): Promise<CapturedLocation> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new Error("Location isn’t available in this browser")
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    })
  })

  const { latitude, longitude, accuracy } = position.coords
  let label = `Current location · ${formatCoords(latitude, longitude)}`

  try {
    const geocoded = await reverseGeocode(latitude, longitude)
    label = geocoded.label || label
  } catch {
    // Keep coordinate fallback if reverse lookup fails.
  }

  return {
    label,
    lat: latitude,
    lng: longitude,
    accuracy: accuracy || 0,
    source: "gps",
  }
}

function geolocationErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = Number((error as GeolocationPositionError).code)
    if (code === 1) return "Location permission was denied"
    if (code === 2) return "Location is unavailable right now"
    if (code === 3) return "Location request timed out — try again"
  }
  if (error instanceof Error && error.message) return error.message
  return "Couldn’t capture your location"
}

/**
 * Addresses can't be typed — they come from a map pin (or, for pickup, the
 * device location), so every booking has a point the rider can navigate to.
 */
function AddressLocationField({
  id,
  label,
  placeholder,
  value,
  locationState,
  onLocate,
  onOpenMap,
  error,
}: {
  error?: string | null
  id: string
  label: string
  placeholder: string
  value: string
  locationState: LocationCaptureState
  /** Omit to offer the map only. */
  onLocate?: () => void
  onOpenMap: () => void
}) {
  const locating = locationState.status === "locating"
  const captured = locationState.captured
  const display = value ? parseLocationFromValue(value)?.label || value : ""

  return (
    <div className="rd-field rd-field-top">
      <label className="rd-label" htmlFor={id}>
        {label}
      </label>
      <div className="rd-address-stack">
        <div className="rd-address-row">
          <button
            id={id}
            type="button"
            className={`rd-input rd-address-pick${display ? "" : " is-empty"}${error ? " is-invalid" : ""}`}
            onClick={onOpenMap}
            aria-label={
              display
                ? `${label}: ${display}. Change on map`
                : `Choose ${label.toLowerCase()} on map`
            }
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
          >
            <span>{display || placeholder}</span>
          </button>
          {error ? <FieldErrorText id={`${id}-error`} message={error} /> : null}
          <div className={`rd-address-actions${onLocate ? "" : " is-single"}`}>
            {onLocate ? (
              <button
                type="button"
                className="rd-locate-btn"
                onClick={onLocate}
                disabled={locating}
                aria-label={`Use current location for ${label.toLowerCase()}`}
                title="Use current location"
              >
                <LocateIcon />
                <span>{locating ? "Locating…" : "Locate"}</span>
              </button>
            ) : null}
            <button
              type="button"
              className="rd-locate-btn"
              onClick={onOpenMap}
              aria-label={`Pick ${label.toLowerCase()} on map`}
              title="Pick on map"
            >
              <MapIcon />
              <span>Map</span>
            </button>
          </div>
        </div>

        {locationState.applied && captured ? (
          <p className="rd-location-applied">
            {captured.source === "map"
              ? "Pinned on the map"
              : `Using your current location · ${formatAccuracy(captured.accuracy)}`}
          </p>
        ) : null}

        {locationState.error ? (
          <p className="rd-location-error" role="alert">
            {locationState.error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function CustomSelect({
  options,
  value,
  onChange,
  id,
}: {
  options: readonly string[]
  value: string
  onChange: (val: string) => void
  id?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (
        wrapRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return
      }
      setIsOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className={`rd-select-wrap${isOpen ? " is-open" : ""}`} ref={wrapRef}>
      <button
        id={id}
        type="button"
        className={`rd-select-trigger${isOpen ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="rd-select-value">{value}</span>
        <span className="rd-select-chevron" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>

      {isOpen ? (
        <div
          ref={listRef}
          className="rd-select-menu"
          role="listbox"
          aria-label="Package type"
        >
          {options.map((item) => {
            const selected = item === value
            return (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={selected}
                className={`rd-select-option${selected ? " is-selected" : ""}`}
                onClick={() => {
                  onChange(item)
                  setIsOpen(false)
                }}
              >
                <span className="rd-select-option-check" aria-hidden="true">
                  {selected ? <CheckIcon /> : null}
                </span>
                <span>{item}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function RequestDeliveryForm() {
  const [errorSection, setErrorSection] = useState<number | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [detailsOpen, setDetailsOpen] = useState(false)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  const [pickup, setPickup] = useState("")
  const [dropoff, setDropoff] = useState("")
  const [pickupLocation, setPickupLocation] =
    useState<LocationCaptureState>(idleLocationState)
  const [dropoffLocation, setDropoffLocation] =
    useState<LocationCaptureState>(idleLocationState)
  const [packageType, setPackageType] = useState<string>(PACKAGE_TYPES[0])
  const [size, setSize] = useState<(typeof PACKAGE_SIZES)[number]["id"]>("small")
  const [notes, setNotes] = useState("")
  const [fragile, setFragile] = useState(false)
  const [perishable, setPerishable] = useState(false)

  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [payer, setPayer] = useState<(typeof PAYERS)[number]["id"]>("sender")
  const [estimatedValue, setEstimatedValue] = useState("")
  const [photoName, setPhotoName] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [pickupWindow, setPickupWindow] =
    useState<(typeof PICKUP_WINDOWS)[number]["id"]>("now")
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null)
  const [schedulerOpen, setSchedulerOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [fare, setFare] = useState(20)
  const [etaLabel, setEtaLabel] = useState("25–40 min")
  const [riderMatched, setRiderMatched] = useState(false)
  const [fleetQueued, setFleetQueued] = useState(false)
  const [copied, setCopied] = useState(false)
  const [payLinkCopied, setPayLinkCopied] = useState(false)
  const [payUrl, setPayUrl] = useState<string | null>(null)
  const [payLink, setPayLink] = useState<PayLinkStatus>({ state: "none" })
  const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>("form")
  const [paymentChannel, setPaymentChannel] = useState<string | null>(null)
  const [resendingLink, setResendingLink] = useState(false)
  const [payingWith, setPayingWith] = useState<PayMethod | null>(null)
  const [mapTarget, setMapTarget] = useState<"pickup" | "dropoff" | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get("id")?.trim()
    const paid = params.get("paid") === "1"
    if (!id) return
    void (async () => {
      try {
        const { delivery, payUrl: link } = await fetchPaymentStatus(id)
        setTrackingId(delivery.trackingId)
        setFare(delivery.fareGhs)
        setEtaLabel(delivery.etaLabel)
        setPayer(delivery.payer)
        setRecipientName(delivery.recipientName)
        setRecipientEmail(delivery.recipientEmail ?? "")
        setPayLink(payLinkStatus(delivery))
        setPickup(delivery.pickup)
        setDropoff(delivery.dropoff)
        setPackageType(delivery.packageType)
        setSize(delivery.size)
        setPayUrl(link)
        setPaymentChannel(delivery.paymentChannel)
        setFleetQueued(Boolean(delivery.tookanJobId))
        setRiderMatched(Boolean(delivery.riderName))
        setSubmitted(true)
        if (delivery.paymentStatus === "paid" || paid) {
          setPaymentPhase("paid")
        } else if (delivery.paymentStatus === "failed") {
          setPaymentPhase("failed")
        } else {
          setPaymentPhase("awaiting")
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Couldn’t restore that order. You can book a new delivery.",
        )
      }
    })()
  }, [])

  useEffect(() => {
    if (!submitted || !trackingId) return
    if (paymentPhase !== "paid" && paymentPhase !== "awaiting") return

    const poll = window.setInterval(async () => {
      try {
        const { delivery, payUrl: link } = await fetchPaymentStatus(trackingId)
        setPayUrl(link)
        setPayLink(payLinkStatus(delivery))
        setFleetQueued(Boolean(delivery.tookanJobId))
        if (delivery.riderName) setRiderMatched(true)
        if (delivery.paymentStatus === "paid") {
          setPaymentPhase("paid")
          setPaymentChannel(delivery.paymentChannel)
        } else if (delivery.paymentStatus === "failed") {
          setPaymentPhase("failed")
        }
      } catch {
        // Keep the confirmation screen available if polling fails.
      }
    }, 5000)
    return () => window.clearInterval(poll)
  }, [submitted, trackingId, paymentPhase])

  useEffect(() => {
    if (!copied && !payLinkCopied) return
    const timer = window.setTimeout(() => {
      setCopied(false)
      setPayLinkCopied(false)
    }, 1600)
    return () => window.clearTimeout(timer)
  }, [copied, payLinkCopied])

  const sizeMeta =
    PACKAGE_SIZES.find((item) => item.id === size) ?? PACKAGE_SIZES[0]
  const quote = useMemo(
    () =>
      quoteDeliveryFare(
        pickup,
        dropoff,
        size,
        pickupWindow === "schedule" && scheduledAt ? scheduledAt : new Date()
      ),
    [pickup, dropoff, size, pickupWindow, scheduledAt]
  )


  /** Fill the address field with a pinned point and keep its coordinates. */
  function applyLocation(target: "pickup" | "dropoff", captured: CapturedLocation) {
    const nextValue = buildLocationLabel(captured.label, captured.lat, captured.lng)
    const state: LocationCaptureState = {
      status: "idle",
      captured,
      applied: true,
      error: null,
    }
    if (target === "pickup") {
      setPickup(nextValue)
      setPickupLocation(state)
    } else {
      setDropoff(nextValue)
      setDropoffLocation(state)
    }
    clearFieldError(target)
  }

  /** Locate fills the address straight away — no extra confirm step to miss. */
  async function locateAddress(target: "pickup" | "dropoff") {
    const setState =
      target === "pickup" ? setPickupLocation : setDropoffLocation

    setState((current) => ({
      ...current,
      status: "locating",
      error: null,
    }))

    try {
      applyLocation(target, await captureDeviceLocation())
    } catch (error) {
      setState({
        status: "error",
        captured: null,
        applied: false,
        error: geolocationErrorMessage(error),
      })
    }
  }

  function applyMapLocation(
    target: "pickup" | "dropoff",
    location: MapPickedLocation
  ) {
    applyLocation(target, { ...location, accuracy: 0, source: "map" })
    setMapTarget(null)
  }


  async function copyTrackingId() {
    if (!trackingId) return
    try {
      await navigator.clipboard.writeText(trackingId)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  async function copyPayLink() {
    if (!payUrl) return
    try {
      await navigator.clipboard.writeText(payUrl)
      setPayLinkCopied(true)
    } catch {
      setPayLinkCopied(false)
    }
  }

  function errorMessage(error: unknown, fallback: string) {
    if (error instanceof ApiRequestError || error instanceof Error) {
      return error.message || fallback
    }
    return fallback
  }

  function fieldValue(field: FieldName) {
    switch (field) {
      case "senderName":
        return fullName
      case "senderPhone":
        return phone
      case "senderEmail":
        return email
      case "pickup":
        return pickup
      case "dropoff":
        return dropoff
      case "recipientName":
        return recipientName
      case "recipientPhone":
        return recipientPhone
      case "recipientEmail":
        return recipientEmail
      case "scheduledAt":
        return pickupWindow === "schedule" && !scheduledAt ? "" : "ok"
    }
  }

  function clearFieldError(field: FieldName) {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  /**
   * The server needs a point on the map for dispatch: either a Locate / Map pin,
   * coordinates in the text, or a place name we recognise.
   */
  function addressMapError(field: FieldName, value: string) {
    if (field !== "pickup" && field !== "dropoff") return null
    const location = field === "pickup" ? pickupLocation : dropoffLocation
    if (location.applied && location.captured) return null
    if (resolveAddressCoords(value)) return null
    return field === "pickup"
      ? "Pin your pickup — tap Map or Locate"
      : "Pin the drop-off on the map"
  }

  /** The recipient must be someone else: compare against the sender's details. */
  function sameAsSenderError(field: FieldName, value: string) {
    if (field === "recipientPhone") {
      const recipient = normalizeGhanaPhone(value)
      return recipient && recipient === normalizeGhanaPhone(phone)
        ? SAME_PHONE_MESSAGE
        : null
    }
    if (field === "recipientEmail") {
      const recipient = value.trim().toLowerCase()
      return recipient && recipient === email.trim().toLowerCase()
        ? SAME_EMAIL_MESSAGE
        : null
    }
    return null
  }

  /** On blur, flag bad formats right away — but don't nag about empty fields yet. */
  function checkField(field: FieldName) {
    const value = fieldValue(field)
    if (!value.trim()) return
    const message =
      validateField(field, value) ??
      addressMapError(field, value) ??
      sameAsSenderError(field, value)
    if (message) {
      setFieldErrors((current) => ({ ...current, [field]: message }))
    } else {
      clearFieldError(field)
    }
  }

  function validateAll(): FieldErrors {
    const errors: FieldErrors = {}
    for (const field of FIELD_ORDER) {
      const value = fieldValue(field)
      const message =
        validateField(field, value) ??
        addressMapError(field, value) ??
        sameAsSenderError(field, value)
      if (message) errors[field] = message
    }
    return errors
  }

  /** Show inline errors and move focus to the first one. */
  function revealErrors(errors: FieldErrors) {
    setFieldErrors(errors)
    setSubmitError(null)
    setErrorSection(null)
    const first = FIELD_ORDER.find((field) => errors[field])
    if (!first) return
    if (first === "scheduledAt") setSchedulerOpen(true)
    requestAnimationFrame(() => {
      const target = document.getElementById(FIELD_INPUT_IDS[first])
      target?.scrollIntoView({ behavior: "smooth", block: "center" })
      if (target instanceof HTMLInputElement) target.focus({ preventScroll: true })
    })
  }

  function errorProps(field: FieldName) {
    const message = fieldErrors[field]
    return {
      "aria-invalid": message ? true : undefined,
      "aria-describedby": message ? `${FIELD_INPUT_IDS[field]}-error` : undefined,
      onBlur: () => checkField(field),
    }
  }

  function groupErrors(fields: FieldName[]) {
    const shown = fields.filter((field) => fieldErrors[field])
    if (shown.length === 0) return null
    return (
      <div className="ck-field-errors">
        {shown.map((field) => (
          <FieldErrorText
            key={field}
            id={`${FIELD_INPUT_IDS[field]}-error`}
            message={fieldErrors[field]!}
          />
        ))}
      </div>
    )
  }

  function invalid(field: FieldName) {
    return fieldErrors[field] ? " is-invalid" : ""
  }

  /** Show the error inside the section it belongs to and scroll there. */
  function showFormError(message: string, section?: number | null) {
    const target = typeof section === "number" ? section : 3
    setSubmitError(message)
    setErrorSection(target)
    requestAnimationFrame(() => {
      document
        .getElementById(`ck-section-${target}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  async function startCheckout(id: string, method?: PayMethod) {
    setPaymentPhase("redirecting")
    setSubmitError(null)
    const result = await initializePayment(id, method)
    setPayUrl(
      `${window.location.origin}/pay?id=${encodeURIComponent(id)}`,
    )
    window.location.href = result.authorizationUrl
  }

  async function retryPayment(method: PayMethod) {
    if (!trackingId) return
    setPayingWith(method)
    setSubmitError(null)
    try {
      await startCheckout(trackingId, method)
    } catch (error) {
      setPaymentPhase("failed")
      setSubmitError(errorMessage(error, "Could not restart payment"))
      setPayingWith(null)
    }
  }

  async function handleResendPayLink() {
    if (!trackingId) return
    setResendingLink(true)
    setSubmitError(null)
    try {
      const result = await resendPayLink(trackingId)
      setPayLink(payLinkStatus(result.delivery))
      setPayUrl(
        `${window.location.origin}/pay?id=${encodeURIComponent(result.delivery.trackingId)}`,
      )
    } catch (error) {
      // The failed attempt is recorded on the order — refresh so the panel shows it.
      try {
        const { delivery } = await fetchPaymentStatus(trackingId)
        setPayLink(payLinkStatus(delivery))
      } catch {
        setSubmitError(errorMessage(error, "Could not resend pay link"))
      }
    } finally {
      setResendingLink(false)
    }
  }

  async function submitDelivery() {
    if (pickupWindow === "schedule" && !scheduledAt) {
      revealErrors({ scheduledAt: "Choose a pickup date and time" })
      return
    }

    const pickupPin =
      pickupLocation.captured && pickupLocation.applied
        ? pickupLocation.captured
        : parseLocationFromValue(pickup)
    const dropoffPin =
      dropoffLocation.captured && dropoffLocation.applied
        ? dropoffLocation.captured
        : parseLocationFromValue(dropoff)

    const payload = {
      senderName: fullName,
      senderPhone: phone,
      senderEmail: email,
      pickup,
      dropoff,
      pickupLatitude: pickupPin?.lat ?? null,
      pickupLongitude: pickupPin?.lng ?? null,
      dropoffLatitude: dropoffPin?.lat ?? null,
      dropoffLongitude: dropoffPin?.lng ?? null,
      packageType,
      size,
      notes,
      fragile,
      perishable,
      recipientName,
      recipientPhone,
      recipientEmail,
      payer,
      estimatedValue,
      photoName: photoName ? photoName.slice(0, 255) : null,
      pickupWindow,
      scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
    }

    const local = createDeliverySchema.safeParse(payload)
    if (!local.success) {
      const errors: FieldErrors = {}
      for (const issue of local.error.issues) {
        const field = String(issue.path[0] ?? "") as FieldName
        if (FIELD_ORDER.includes(field) && !errors[field]) {
          errors[field] = issue.message
        }
      }
      if (Object.keys(errors).length > 0) {
        revealErrors(errors)
        return
      }
      const formatted = formatZodIssues(local.error)
      showFormError(formatted.message, sectionForStep(formatted.step))
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    let createdId: string | null = null

    try {
      const { delivery } = await createDeliveryRequest(payload)

      createdId = delivery.trackingId
      setTrackingId(delivery.trackingId)
      setPayLink(payLinkStatus(delivery))
      setFare(delivery.fareGhs)
      setEtaLabel(delivery.etaLabel)
      setFleetQueued(Boolean(delivery.tookanJobId))
      setRiderMatched(Boolean(delivery.riderName))
      setPayUrl(
        `${window.location.origin}/pay?id=${encodeURIComponent(delivery.trackingId)}`,
      )
      setSubmitted(true)

      if (delivery.payer === "sender") {
        await startCheckout(delivery.trackingId)
      } else {
        setPaymentPhase("awaiting")
      }
    } catch (error) {
      const message = errorMessage(error, "Could not create delivery")
      const step =
        error instanceof ApiRequestError ? error.step : null

      if (createdId) {
        setSubmitted(true)
        setPaymentPhase("failed")
        setSubmitError(
          message ||
            "Order saved, but payment didn’t start. Tap Pay to try again.",
        )
      } else {
        showFormError(message, sectionForStep(step))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const fareLabel = quote.needsQuote ? "Quote needed" : `GHS ${quote.fareGhs}.00`
  const tripNote = !quote.covered
    ? "Diatel delivers within Ghana only"
    : quote.needsQuote
      ? "Outside our listed areas — call or WhatsApp us for a price"
      : quote.hub && quote.area && quote.traffic
        ? `${quote.hub.name} hub → ${quote.area.name} · ${TRAFFIC_LABELS[quote.traffic].toLowerCase()} rate`
        : `From GHS ${quote.fareGhs} — add both addresses for your exact price`
  const recipientFirst = recipientName.trim().split(/\s+/)[0]

  const isFilled = (fields: FieldName[]) =>
    fields.every((field) => !validateField(field, fieldValue(field)))
  const sectionComplete = {
    pickup: isFilled(["senderName", "senderPhone", "senderEmail", "pickup"]),
    dropoff: isFilled(["recipientName", "recipientPhone", "recipientEmail", "dropoff"]),
  }
  // Package and payment have defaults, so they only count as done once the
  // required sections before them are — otherwise an empty form shows checks.
  const packageComplete =
    sectionComplete.pickup && sectionComplete.dropoff && quote.covered
  const paymentComplete =
    packageComplete && !(pickupWindow === "schedule" && !scheduledAt)
  const detailBits = [
    notes.trim() ? "Note" : null,
    fragile ? "Fragile" : null,
    perishable ? "Perishable" : null,
    estimatedValue.trim() ? `Value GHS ${estimatedValue.trim()}` : null,
    photoName ? "Photo" : null,
  ].filter(Boolean) as string[]

  function sectionError(section: number) {
    if (errorSection !== section || !submitError) return null
    return (
      <p className="ck-error" role="alert">
        {submitError}
      </p>
    )
  }

  if (submitted) {
    return (
      <>
        <RequestDeliveryConfetti active={paymentPhase === "paid"} />
        <RequestDeliveryConfirmation
          phase={paymentPhase === "form" ? "redirecting" : paymentPhase}
          trackingId={trackingId}
          fare={fare}
          etaLabel={etaLabel}
          payer={payer}
          recipientName={recipientName}
          recipientEmail={recipientEmail}
          pickup={pickup}
          dropoff={dropoff}
          packageType={packageType}
          sizeLabel={sizeMeta.label}
          payUrl={payUrl}
          paymentChannel={paymentChannel}
          fleetQueued={fleetQueued}
          riderMatched={riderMatched}
          payLink={payLink}
          copied={copied}
          payLinkCopied={payLinkCopied}
          resending={resendingLink}
          payingWith={payingWith}
          error={submitError}
          onCopyId={() => void copyTrackingId()}
          onCopyPayLink={() => void copyPayLink()}
          onResend={() => void handleResendPayLink()}
          onPay={(method) => void retryPayment(method)}
        />
      </>
    )
  }

  return (
    <div className="ck-page">
      <div className="ck-shell">
        <CheckoutSummary
          kicker="Delivery fare"
          amount={fareLabel}
          note={tripNote}
          noteTone={quote.covered && !quote.needsQuote ? "default" : "blocked"}
          pickup={pickup}
          dropoff={dropoff}
          mapChip={
            quote.distanceKm != null
              ? `${quote.distanceKm} km · ~${quote.etaMinutes} min`
              : null
          }
          lines={[
            ...(quote.hub
              ? [{ label: "Delivered from", value: `${quote.hub.name} hub` }]
              : []),
            ...(quote.traffic && quote.bandPrices
              ? [
                  {
                    label: "Traffic rate",
                    value: `${TRAFFIC_LABELS[quote.traffic]} · GHS ${quote.bandPrices[quote.traffic]}`,
                  },
                ]
              : []),
            ...(quote.surchargeGhs
              ? [{ label: "Large parcel", value: `+ GHS ${quote.surchargeGhs}` }]
              : []),
            { label: "Package", value: `${packageType} · ${sizeMeta.label}` },
            {
              label: "Pickup",
              value:
                pickupWindow === "schedule" && scheduledAt
                  ? formatPickupSchedule(scheduledAt)
                  : "Ready now",
            },
            {
              label: "Paid by",
              value: payer === "recipient" ? recipientFirst || "Recipient" : "You",
            },
          ]}
          total={{ label: "Total due", value: fareLabel }}
          showAssurances
        />

        <main className="ck-main">
          <form
            className="ck-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              const errors = validateAll()
              if (Object.keys(errors).length > 0) {
                revealErrors(errors)
                return
              }
              if (!quote.covered) {
                showFormError(
                  "Diatel currently delivers in Ghana only. Use Map or Locate inside Ghana.",
                  0,
                )
                return
              }
              if (quote.needsQuote) {
                document
                  .getElementById(`ck-section-${quote.quoteReason === "pickup" ? 0 : 1}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
                return
              }
              setSubmitError(null)
              setErrorSection(null)
              void submitDelivery()
            }}
          >
            <div className="ck-form-head">
              <h1 className="ck-form-title">Book a delivery</h1>
              <p className="ck-form-sub">
                Takes about a minute. A rider is dispatched as soon as you book.
              </p>
            </div>

            <div className="ck-pair">
              <section id="ck-section-0" className="ck-section">
                <SectionHead
                  icon="pickup"
                  title="Pickup"
                  hint="Where we collect it, and how to reach you"
                  complete={sectionComplete.pickup}
                />
                <span className="ck-label" aria-hidden="true">
                  Your details
                </span>
                <div className="ck-group">
                  <label className="sr-only" htmlFor="rd-full-name">
                    Full name
                  </label>
                  <input
                    id="rd-full-name"
                    className={`ck-input${invalid("senderName")}`}
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    placeholder="Full name"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value)
                      clearFieldError("senderName")
                    }}
                    maxLength={80}
                    {...errorProps("senderName")}
                  />
                  <div className="ck-group-row">
                    <label className="sr-only" htmlFor="rd-phone">
                      Phone number
                    </label>
                    <input
                      id="rd-phone"
                      className={`ck-input${invalid("senderPhone")}`}
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      inputMode="numeric"
                      maxLength={15}
                      placeholder="Phone · 024 123 4567"
                      value={phone}
                      onChange={(event) => {
                        setPhone(digitsOnly(event.target.value))
                        clearFieldError("senderPhone")
                      }}
                      {...errorProps("senderPhone")}
                    />
                    <label className="sr-only" htmlFor="rd-email">
                      Email
                    </label>
                    <input
                      id="rd-email"
                      className={`ck-input${invalid("senderEmail")}`}
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="Email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        clearFieldError("senderEmail")
                      }}
                      {...errorProps("senderEmail")}
                    />
                  </div>
                </div>
                {groupErrors(["senderName", "senderPhone", "senderEmail"])}
                <AddressLocationField
                  id="rd-pickup"
                  label="Pickup address"
                  placeholder="Choose on the map or use your location"
                  value={pickup}
                  error={fieldErrors.pickup}
                  locationState={pickupLocation}
                  onLocate={() => void locateAddress("pickup")}
                  onOpenMap={() => setMapTarget("pickup")}
                />
                {quote.needsQuote && quote.quoteReason === "pickup" ? (
                  <QuoteNeeded reason="pickup" pickup={pickup} dropoff={dropoff} />
                ) : null}
                {sectionError(0)}
              </section>

              <section id="ck-section-1" className="ck-section">
                <SectionHead
                  icon="dropoff"
                  title="Drop-off"
                  hint="Where it’s going, and who receives it"
                  complete={sectionComplete.dropoff}
                />
                <span className="ck-label" aria-hidden="true">
                  Recipient
                </span>
                <div className="ck-group">
                  <label className="sr-only" htmlFor="rd-recipient-name">
                    Recipient name
                  </label>
                  <input
                    id="rd-recipient-name"
                    className={`ck-input${invalid("recipientName")}`}
                    type="text"
                    name="recipientName"
                    autoComplete="off"
                    placeholder="Recipient’s full name"
                    value={recipientName}
                    onChange={(event) => {
                      setRecipientName(event.target.value)
                      clearFieldError("recipientName")
                    }}
                    maxLength={80}
                    {...errorProps("recipientName")}
                  />
                  <div className="ck-group-row">
                    <label className="sr-only" htmlFor="rd-recipient-phone">
                      Recipient phone
                    </label>
                    <input
                      id="rd-recipient-phone"
                      className={`ck-input${invalid("recipientPhone")}`}
                      type="tel"
                      name="recipientPhone"
                      autoComplete="off"
                      inputMode="numeric"
                      maxLength={15}
                      placeholder="Phone · 024 123 4567"
                      value={recipientPhone}
                      onChange={(event) => {
                        setRecipientPhone(digitsOnly(event.target.value))
                        clearFieldError("recipientPhone")
                      }}
                      {...errorProps("recipientPhone")}
                    />
                    <label className="sr-only" htmlFor="rd-recipient-email">
                      Recipient email
                    </label>
                    <input
                      id="rd-recipient-email"
                      className={`ck-input${invalid("recipientEmail")}`}
                      type="email"
                      name="recipientEmail"
                      autoComplete="off"
                      placeholder="Email"
                      value={recipientEmail}
                      onChange={(event) => {
                        setRecipientEmail(event.target.value)
                        clearFieldError("recipientEmail")
                      }}
                      {...errorProps("recipientEmail")}
                    />
                  </div>
                </div>
                {groupErrors(["recipientName", "recipientPhone", "recipientEmail"])}
                <AddressLocationField
                  id="rd-dropoff"
                  label="Drop-off address"
                  placeholder="Choose the drop-off on the map"
                  value={dropoff}
                  error={fieldErrors.dropoff}
                  locationState={dropoffLocation}
                  onOpenMap={() => setMapTarget("dropoff")}
                />
                {quote.needsQuote && quote.quoteReason === "dropoff" ? (
                  <QuoteNeeded reason="dropoff" pickup={pickup} dropoff={dropoff} />
                ) : null}
                {sectionError(1)}
              </section>
            </div>

            <section id="ck-section-2" className="ck-section">
              <SectionHead
                icon="package"
                title="Package"
                hint="Helps us send the right rider and vehicle"
                complete={packageComplete}
              />
              <div className="ck-field">
                <label className="ck-label" htmlFor="rd-package-type">
                  What are you sending?
                </label>
                <CustomSelect
                  id="rd-package-type"
                  options={PACKAGE_TYPES}
                  value={packageType}
                  onChange={setPackageType}
                />
              </div>

              <div className="ck-field">
                <span className="ck-label" id="rd-size-label">
                  Size
                </span>
                <div
                  className="ck-segmented"
                  role="radiogroup"
                  aria-labelledby="rd-size-label"
                >
                  {PACKAGE_SIZES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={size === item.id}
                      className={`ck-segment${size === item.id ? " is-active" : ""}`}
                      onClick={() => setSize(item.id)}
                    >
                      <SizeIcon id={item.id} />
                      <strong>{item.label}</strong>
                      <span>{item.hint}</span>
                      {item.id === "large" ? (
                        <em className="ck-segment-price">+ GHS {LARGE_SURCHARGE_GHS}</em>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`ck-more${detailsOpen ? " is-open" : ""}`}>
                <button
                  type="button"
                  className="ck-more-toggle"
                  aria-expanded={detailsOpen}
                  aria-controls="ck-more-body"
                  onClick={() => setDetailsOpen((open) => !open)}
                >
                  <span className="ck-more-copy">
                    <strong>More details for the rider</strong>
                    <span>
                      {detailBits.length > 0
                        ? detailBits.join(" · ")
                        : "Optional — notes, handling, value, photo"}
                    </span>
                  </span>
                  <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" className="ck-more-chevron">
                    <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div id="ck-more-body" className="ck-more-body" hidden={!detailsOpen}>
                  <div className="ck-field">
                    <label className="ck-label" htmlFor="rd-notes">
                      Notes for the rider <span className="ck-optional">Optional</span>
                    </label>
                    <textarea
                      id="rd-notes"
                      className="ck-textarea"
                      name="notes"
                      rows={2}
                      placeholder="Gate code, landmark, what’s inside…"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </div>

                  <div className="ck-checks" role="group" aria-label="Handling">
                    <label className="ck-check">
                      <input
                        type="checkbox"
                        name="fragile"
                        checked={fragile}
                        onChange={(event) => setFragile(event.target.checked)}
                      />
                      <span>Fragile</span>
                    </label>
                    <label className="ck-check">
                      <input
                        type="checkbox"
                        name="perishable"
                        checked={perishable}
                        onChange={(event) => setPerishable(event.target.checked)}
                      />
                      <span>Perishable</span>
                    </label>
                  </div>

                  <div className="ck-field-row">
                    <div className="ck-field">
                      <label className="ck-label" htmlFor="rd-value">
                        Declared value <span className="ck-optional">Optional</span>
                      </label>
                      <div className="ck-affix">
                        <span aria-hidden="true">GHS</span>
                        <input
                          id="rd-value"
                          className="ck-input ck-input-solo"
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
                    <div className="ck-field">
                      <span className="ck-label" id="rd-photo-label">
                        Photo <span className="ck-optional">Optional</span>
                      </span>
                      <input
                        ref={photoInputRef}
                        id="rd-photo"
                        className="sr-only"
                        type="file"
                        name="packagePhoto"
                        accept="image/*"
                        aria-labelledby="rd-photo-label"
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
                      <button
                        type="button"
                        className="ck-upload"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        {photoPreview ? (
                          <img src={photoPreview} alt="" className="ck-upload-thumb" />
                        ) : (
                          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="ck-upload-icon">
                            <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
                            <circle cx="6" cy="7" r="1.25" fill="currentColor" />
                            <path d="m3 12 3.5-3.25L9 11l2-1.75L14 12" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                          </svg>
                        )}
                        <span>{photoName || "Add a photo"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {sectionError(2)}
            </section>

            <section id="ck-section-3" className="ck-section">
              <SectionHead
                icon="payment"
                title="Payment & timing"
                hint="Choose who pays and when we pick up"
                complete={paymentComplete}
              />
              <div className="ck-pair ck-pair-inner">
                <div className="ck-field">
                  <span className="ck-label" id="rd-payer-label">
                    Who pays
                  </span>
                  <div
                    className="ck-choices"
                    role="radiogroup"
                    aria-labelledby="rd-payer-label"
                  >
                    {PAYERS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={payer === item.id}
                        className={`ck-choice${payer === item.id ? " is-active" : ""}`}
                        onClick={() => setPayer(item.id)}
                      >
                        <span className="ck-radio" aria-hidden="true" />
                        <span className="ck-choice-icon">
                          <PayerIcon id={item.id} />
                        </span>
                        <span className="ck-choice-copy">
                          <strong>{item.label}</strong>
                          <span>{item.hint}</span>
                        </span>
                        {item.id === "sender" ? (
                          <span className="ck-methods" aria-hidden="true">
                            <span>MoMo</span>
                            <span>Card</span>
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ck-field">
                  <span className="ck-label" id="rd-window-label">
                    Pickup time
                  </span>
                  <div
                    className="ck-choices"
                    role="radiogroup"
                    aria-labelledby="rd-window-label"
                  >
                    {PICKUP_WINDOWS.map((item) => {
                      const hint =
                        item.id === "schedule" && scheduledAt
                          ? formatPickupSchedule(scheduledAt)
                          : item.hint
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="radio"
                          aria-checked={pickupWindow === item.id}
                          className={`ck-choice${pickupWindow === item.id ? " is-active" : ""}`}
                          onClick={() => {
                            if (item.id === "schedule") {
                              setPickupWindow("schedule")
                              setSchedulerOpen(true)
                              return
                            }
                            setPickupWindow("now")
                            setScheduledAt(null)
                            clearFieldError("scheduledAt")
                          }}
                        >
                          <span className="ck-radio" aria-hidden="true" />
                          <span className="ck-choice-icon">
                            <PickupIcon id={item.id} />
                          </span>
                          <span className="ck-choice-copy">
                            <strong>{item.label}</strong>
                            <span>{hint}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {quote.bandPrices ? (
                    <p className="ck-rates" aria-live="polite">
                      Rates follow Accra traffic:{" "}
                      {(["quiet", "daytime", "rush"] as const).map((band, index) => (
                        <span
                          key={band}
                          className={quote.traffic === band ? "is-current" : undefined}
                        >
                          {index > 0 ? " · " : ""}
                          {TRAFFIC_LABELS[band]} GHS {quote.bandPrices![band]}
                        </span>
                      ))}
                      . Schedule a quiet-hours slot to pay less.
                    </p>
                  ) : null}
                </div>
              </div>

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
                  clearFieldError("scheduledAt")
                }}
              />
              {groupErrors(["scheduledAt"])}
              {sectionError(3)}
            </section>

            <div className="ck-submit-bar">
              <div className="ck-submit-total" aria-hidden="true">
                <span>Total</span>
                <strong>{fareLabel}</strong>
              </div>
              <button
                type="submit"
                className="ck-submit"
                disabled={submitting || quote.needsQuote}
              >
                {quote.needsQuote ? (
                  "Get a quote to book this trip"
                ) : submitting ? (
                  <>
                    <span className="rd-continue-spinner" aria-hidden="true" />
                    {payer === "sender" ? "Starting payment…" : "Booking…"}
                  </>
                ) : payer === "sender" ? (
                  <>
                    <LockIcon />
                    Pay {fareLabel}
                  </>
                ) : (
                  `Book & send pay link to ${recipientFirst || "recipient"}`
                )}
              </button>
            </div>
            <p className="ck-legal">
              {payer === "sender"
                ? "You’ll finish paying on Paystack with MoMo or card. Your rider is dispatched as soon as you book."
                : `We’ll email ${recipientFirst || "the recipient"} a secure Paystack link. Dispatch doesn’t wait for payment.`}
            </p>
          </form>
        </main>
      </div>

      <LocationMapPicker
        open={mapTarget !== null}
        title={mapTarget === "dropoff" ? "Drop-off" : "Pickup"}
        initial={
          mapTarget === "pickup"
            ? parseLocationFromValue(pickup) ??
              (pickupLocation.captured
                ? {
                    label: pickupLocation.captured.label,
                    lat: pickupLocation.captured.lat,
                    lng: pickupLocation.captured.lng,
                  }
                : null)
            : mapTarget === "dropoff"
              ? parseLocationFromValue(dropoff) ??
                (dropoffLocation.captured
                  ? {
                      label: dropoffLocation.captured.label,
                      lat: dropoffLocation.captured.lat,
                      lng: dropoffLocation.captured.lng,
                    }
                  : null)
              : null
        }
        onClose={() => setMapTarget(null)}
        onConfirm={(location) => {
          if (!mapTarget) return
          applyMapLocation(mapTarget, location)
        }}
      />
    </div>
  )
}
