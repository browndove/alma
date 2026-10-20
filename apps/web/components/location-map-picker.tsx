"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet"
import L from "leaflet"

import {
  reverseGeocode,
  searchGeocode,
  type GeocodeSearchResult,
} from "@/lib/client-api"

import "leaflet/dist/leaflet.css"

const ACCRA_CENTER: [number, number] = [5.6037, -0.187]
const DEFAULT_ZOOM = 12
const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY ?? ""

/**
 * CARTO Voyager needs a Basemaps API key from https://carto.com/basemaps/apikey
 * (param: `key=`). Platform JWT tokens from Developers → Credentials do not work.
 * Fall back to Esri World Street Map (no key) so pickup stays usable.
 */
function mapTileConfig(): {
  url: string
  attribution: string
  subdomains?: string
  maxZoom?: number
} {
  const isBasemapKey =
    Boolean(CARTO_API_KEY) && !CARTO_API_KEY.startsWith("eyJ")

  if (isBasemapKey) {
    return {
      url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(CARTO_API_KEY)}`,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }
  }

  return {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, OpenStreetMap, and the GIS User Community",
    maxZoom: 19,
  }
}

export type MapPickedLocation = {
  label: string
  lat: number
  lng: number
}

type LocationMapPickerProps = {
  open: boolean
  title: string
  initial?: MapPickedLocation | null
  onClose: () => void
  onConfirm: (location: MapPickedLocation) => void
}

function pinIcon() {
  return L.divIcon({
    className: "rd-map-pin",
    html: `<span class="rd-map-pin-wrap"><span class="rd-map-pin-pulse"></span><span class="rd-map-pin-dot"></span></span>`,
    iconSize: [36, 44],
    iconAnchor: [18, 40],
  })
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none">
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.4 10.4 13.25 13.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function FlyTo({
  target,
}: {
  target: { position: [number, number]; zoom?: number; token: number } | null
}) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    map.setView(target.position, target.zoom ?? Math.max(map.getZoom(), 14), {
      animate: true,
    })
  }, [map, target])
  return null
}

function formatCoords(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 14 14" className="size-3.5" fill="none">
      <path
        d="M3 3l8 8M11 3l-8 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function LocationMapPicker({
  open,
  title,
  initial,
  onClose,
  onConfirm,
}: LocationMapPickerProps) {
  const titleId = useId()
  const searchId = useId()
  const debounceRef = useRef<number | null>(null)
  const icon = useMemo(() => pinIcon(), [])
  const tiles = useMemo(() => mapTileConfig(), [])

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GeocodeSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [position, setPosition] = useState<[number, number]>(
    initial ? [initial.lat, initial.lng] : ACCRA_CENTER
  )
  const [label, setLabel] = useState(initial?.label ?? "")
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<{
    position: [number, number]
    zoom?: number
    token: number
  } | null>(null)

  const resolvePoint = useCallback(async (lat: number, lng: number) => {
    setPosition([lat, lng])
    setResolving(true)
    setResolveError(null)
    try {
      const geocoded = await reverseGeocode(lat, lng)
      setLabel(geocoded.label || `Selected location · ${formatCoords(lat, lng)}`)
    } catch {
      setLabel(`Selected location · ${formatCoords(lat, lng)}`)
      setResolveError("Couldn’t resolve the street name — you can still use this pin.")
    } finally {
      setResolving(false)
    }
  }, [])

  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }
    if (wasOpenRef.current) return
    wasOpenRef.current = true

    const next = initial
      ? ([initial.lat, initial.lng] as [number, number])
      : ACCRA_CENTER
    setPosition(next)
    setLabel(initial?.label ?? "")
    setQuery("")
    setResults([])
    setSearchError(null)
    setResolveError(null)
    setFlyTarget({
      position: next,
      zoom: initial ? 15 : DEFAULT_ZOOM,
      token: Date.now(),
    })
    if (!initial?.label) {
      void resolvePoint(next[0], next[1])
    }
  }, [open, initial, resolvePoint])

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
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setSearching(false)
      setSearchError(null)
      return
    }

    setSearching(true)
    debounceRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await searchGeocode(trimmed)
          setResults(data.results)
          setSearchError(null)
        } catch {
          setResults([])
          setSearchError("Search failed — try another place name.")
        } finally {
          setSearching(false)
        }
      })()
    }, 320)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query, open])

  if (!open) return null

  const canConfirm = Boolean(label.trim()) && !resolving

  return (
    <div className="rd-map-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="rd-map-sheet-backdrop"
        aria-label="Close map"
        onClick={onClose}
      />
      <div className="rd-map-sheet-panel">
        <div className="rd-map-hero">
          <MapContainer
            key={tiles.url}
            center={position}
            zoom={DEFAULT_ZOOM}
            className="rd-map-leaflet"
            scrollWheelZoom
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url={tiles.url}
              attribution={tiles.attribution}
              {...(tiles.subdomains ? { subdomains: tiles.subdomains } : {})}
              maxZoom={tiles.maxZoom ?? 19}
            />
            <FlyTo target={flyTarget} />
            <MapClickHandler
              onPick={(lat, lng) => {
                void resolvePoint(lat, lng)
              }}
            />
            <Marker
              position={position}
              draggable
              icon={icon}
              eventHandlers={{
                dragend: (event) => {
                  const next = event.target.getLatLng()
                  void resolvePoint(next.lat, next.lng)
                },
              }}
            />
          </MapContainer>

          <div className="rd-map-hero-wash" aria-hidden="true" />

          <header className="rd-map-sheet-header">
            <div className="rd-map-sheet-heading">
              <p className="rd-map-sheet-kicker">Diatel · Accra</p>
              <h2 id={titleId} className="rd-map-sheet-title">
                {title}
              </h2>
            </div>
            <button
              type="button"
              className="rd-map-sheet-close"
              onClick={onClose}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </header>

          <div className="rd-map-search">
            <label className="sr-only" htmlFor={searchId}>
              Search Accra
            </label>
            <div className="rd-map-search-field">
              <span className="rd-map-search-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <input
                id={searchId}
                className="rd-map-search-input"
                type="search"
                placeholder="Search Osu, East Legon, Spintex…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
              />
            </div>
            {searching ? <span className="rd-map-search-status">Searching…</span> : null}
            {searchError ? (
              <p className="rd-map-search-error" role="alert">
                {searchError}
              </p>
            ) : null}
            {results.length > 0 ? (
              <ul className="rd-map-search-results" role="listbox">
                {results.map((item) => (
                  <li key={`${item.lat},${item.lng},${item.displayName}`}>
                    <button
                      type="button"
                      className="rd-map-search-result"
                      onClick={() => {
                        setQuery(item.label)
                        setResults([])
                        setLabel(item.label)
                        setPosition([item.lat, item.lng])
                        setFlyTarget({
                          position: [item.lat, item.lng],
                          zoom: 15,
                          token: Date.now(),
                        })
                        setResolveError(null)
                      }}
                    >
                      <span className="rd-map-search-result-label">{item.label}</span>
                      <span className="rd-map-search-result-meta">
                        {formatCoords(item.lat, item.lng)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <p className="rd-map-hint">Tap or drag the pin</p>
        </div>

        <div className="rd-map-footer">
          <div className="rd-map-chip" aria-live="polite">
            <div className="rd-map-chip-mark" aria-hidden="true" />
            <div className="rd-map-chip-copy">
              <p className="rd-map-chip-kicker">
                {resolving ? "Finding address…" : "Selected location"}
              </p>
              <p className="rd-map-chip-label">
                {label.trim() || "Move the pin to choose a spot"}
              </p>
              <p className="rd-map-chip-coords">
                {formatCoords(position[0], position[1])}
              </p>
              {resolveError ? (
                <p className="rd-map-chip-note" role="status">
                  {resolveError}
                </p>
              ) : null}
            </div>
          </div>

          <footer className="rd-map-sheet-actions">
            <button type="button" className="rd-map-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="rd-map-confirm"
              disabled={!canConfirm}
              onClick={() => {
                if (!canConfirm) return
                onConfirm({
                  label: label.trim(),
                  lat: position[0],
                  lng: position[1],
                })
              }}
            >
              Use this location
            </button>
          </footer>
        </div>
      </div>
    </div>
  )
}
