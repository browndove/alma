const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY ?? ""

/**
 * CARTO Voyager needs a Basemaps API key from https://carto.com/basemaps/apikey
 * (param: `key=`). Platform JWT tokens from Developers → Credentials do not work.
 * Fall back to Esri World Street Map (no key) so pickup stays usable.
 */
export function mapTileConfig(): {
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
