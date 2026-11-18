"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"

import { mapTileConfig } from "@/lib/map-tiles"

import "leaflet/dist/leaflet.css"

type Point = { lat: number; lng: number }

const ACCRA_CENTER: [number, number] = [5.6037, -0.187]

function stopIcon(kind: "pickup" | "dropoff") {
  return L.divIcon({
    className: `ck-map-stop is-${kind}`,
    html: "<span></span>",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

/** Keeps both stops in view as the addresses change. */
function FitRoute({ pickup, dropoff }: { pickup: Point | null; dropoff: Point | null }) {
  const map = useMap()
  useEffect(() => {
    function fit(animate: boolean) {
      // The map sits in a flex box that sizes after mount — re-measure first.
      map.invalidateSize()
      if (pickup && dropoff) {
        map.fitBounds(
          L.latLngBounds([pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]),
          { padding: [36, 36], maxZoom: 15, animate },
        )
        return
      }
      const only = pickup ?? dropoff
      map.setView(only ? [only.lat, only.lng] : ACCRA_CENTER, only ? 14 : 11, {
        animate,
      })
    }

    fit(true)
    const observer = new ResizeObserver(() => fit(false))
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map, pickup, dropoff])
  return null
}

/** Read-only route preview for the booking summary — no panning or zooming. */
export function RoutePreviewMap({
  pickup,
  dropoff,
}: {
  pickup: Point | null
  dropoff: Point | null
}) {
  const tiles = useMemo(() => mapTileConfig(), [])
  const pickupIcon = useMemo(() => stopIcon("pickup"), [])
  const dropoffIcon = useMemo(() => stopIcon("dropoff"), [])

  return (
    <MapContainer
      center={ACCRA_CENTER}
      zoom={11}
      className="ck-map-leaflet"
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
    >
      <TileLayer
        url={tiles.url}
        {...(tiles.subdomains ? { subdomains: tiles.subdomains } : {})}
        maxZoom={tiles.maxZoom ?? 19}
      />
      <FitRoute pickup={pickup} dropoff={dropoff} />
      {pickup && dropoff ? (
        <Polyline
          positions={[
            [pickup.lat, pickup.lng],
            [dropoff.lat, dropoff.lng],
          ]}
          pathOptions={{ color: "#fe5200", weight: 3, dashArray: "6 8", lineCap: "round" }}
        />
      ) : null}
      {pickup ? <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} /> : null}
      {dropoff ? <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon} /> : null}
    </MapContainer>
  )
}
