"use client"

import { useEffect, useRef } from "react"

import { createLandLookup } from "./world-land-mask"

type Vec3 = [number, number, number]
type RGB = [number, number, number]

/** Diatel particle palette — pink leads, peach fills, orange accents. */
const PRIMARY: RGB = [255, 143, 163]
const SECONDARY: RGB = [255, 182, 193]
const HIGHLIGHT: RGB = [255, 107, 53]
const AMBIENT: RGB = [255, 214, 199]
const PALETTE: RGB[] = [PRIMARY, SECONDARY, HIGHLIGHT, AMBIENT]
/** Peach is nearly invisible on the warm card, orange is the accent — even out what actually reads. */
const COLOR_WEIGHT = [1.15, 1.0, 1.45, 0.7]

/** Route strokes need more saturation than the particles to stay legible as hairlines. */
const LINE_ORANGE: RGB = [255, 107, 53]
const LINE_PINK: RGB = [255, 143, 163]
const LINE_PEACH: RGB = [255, 165, 120]
const LINE_ROSE: RGB = [255, 170, 192]

const SPIN_SECONDS = 34
const TILT = 0.36
const FOV = 6.2
const ALPHA_STEPS = 16
const TRAIL_SAMPLES = 16

type Route = {
  from: [number, number]
  to: [number, number]
  color: RGB
  lift: number
  opacity: number
  travel: number
  gap: number
  offset: number
}

/** Real coordinates, so every arc and pill lands where it should on the globe. */
const CITY = {
  accra: [5.556, -0.197] as [number, number],
  kumasi: [6.689, -1.624] as [number, number],
  tamale: [9.401, -0.839] as [number, number],
  mexicoCity: [19.43, -99.13] as [number, number],
  hongKong: [22.32, 114.17] as [number, number],
  london: [51.51, -0.13] as [number, number],
  nairobi: [-1.29, 36.82] as [number, number],
  mumbai: [19.08, 72.88] as [number, number],
  lagos: [6.52, 3.38] as [number, number],
}

const ROUTES: Route[] = [
  { from: CITY.accra, to: CITY.hongKong, color: LINE_ORANGE, lift: 0.12, opacity: 0.54, travel: 9, gap: 4.5, offset: 0 },
  { from: CITY.mexicoCity, to: CITY.accra, color: LINE_PINK, lift: 0.16, opacity: 0.46, travel: 12.5, gap: 6, offset: 3.4 },
  { from: CITY.london, to: CITY.nairobi, color: LINE_PEACH, lift: 0.09, opacity: 0.42, travel: 11, gap: 9, offset: 7.2 },
  { from: CITY.mumbai, to: CITY.lagos, color: LINE_ROSE, lift: 0.18, opacity: 0.38, travel: 15, gap: 5, offset: 1.6 },
]

// All three are real Ghanaian coordinates, which puts them within ~20px of each other on a
// globe this size. Only one is shown per revolution so they never overlap, and which one it
// is advances each time West Africa comes back around.
const LABELS: { anchor: [number, number]; city: string; status: string; tone: string }[] = [
  { anchor: CITY.accra, city: "Accra", status: "In transit", tone: "orange" },
  { anchor: CITY.kumasi, city: "Kumasi", status: "Rider matched", tone: "pink" },
  { anchor: CITY.tamale, city: "Tamale", status: "Delivered", tone: "peach" },
]

/** Orange concentrates over Diatel's home region rather than in an arbitrary noise patch. */
const HOME: [number, number] = CITY.accra
const HOME_CORE_DEG = 15
const HOME_HALO_DEG = 32

function toVec(latDeg: number, lonDeg: number): Vec3 {
  const lat = (latDeg * Math.PI) / 180
  const lon = (lonDeg * Math.PI) / 180
  return [Math.cos(lat) * Math.sin(lon), -Math.sin(lat), Math.cos(lat) * Math.cos(lon)]
}

export function ParticleGlobe() {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const candidates = window.innerWidth < 768 ? 19000 : 34000
    const isLand = createLandLookup()
    const home = toVec(HOME[0], HOME[1])

    // ---- particle field ----
    // Candidates are laid out on a fibonacci sphere for even coverage, then land is kept in full
    // while ocean is thinned and dimmed. That is what makes the continents legible.
    const px = new Float32Array(candidates)
    const py = new Float32Array(candidates)
    const pz = new Float32Array(candidates)
    const pColor = new Uint8Array(candidates)
    const pJitter = new Float32Array(candidates)
    const pPhase = new Float32Array(candidates)
    const pLand = new Uint8Array(candidates)
    let count = 0

    const golden = Math.PI * (3 - Math.sqrt(5))
    const jitter = 0.055
    const oceanKeep = 0.22
    for (let i = 0; i < candidates; i++) {
      const ny = 1 - (i / (candidates - 1)) * 2
      const ring = Math.sqrt(Math.max(0, 1 - ny * ny))
      const theta = golden * i

      // Jitter roughly one lattice spacing, otherwise the fibonacci spiral reads as visible moiré.
      let x = Math.cos(theta) * ring + (Math.random() - 0.5) * jitter
      let y = ny + (Math.random() - 0.5) * jitter
      let z = Math.sin(theta) * ring + (Math.random() - 0.5) * jitter
      const len = Math.hypot(x, y, z) || 1
      x /= len
      y /= len
      z /= len

      const lat = (-Math.asin(Math.max(-1, Math.min(1, y))) * 180) / Math.PI
      const lon = (Math.atan2(x, z) * 180) / Math.PI
      const land = isLand(lat, lon)
      if (!land && Math.random() > oceanKeep) continue

      const j = count++
      px[j] = x
      py[j] = y
      pz[j] = z
      pLand[j] = land ? 1 : 0

      // Great-circle distance to Accra decides where the orange highlight lives.
      const dot = Math.max(-1, Math.min(1, x * home[0] + y * home[1] + z * home[2]))
      const homeDeg = (Math.acos(dot) * 180) / Math.PI
      const variety = Math.sin(x * 5.1 + 0.7) * Math.cos(z * 4.6 - 0.4) + 0.6 * Math.sin(y * 5.8 + 1.3)

      if (!land) {
        pColor[j] = variety > 0.5 ? 3 : 1
      } else if (homeDeg < HOME_CORE_DEG) {
        pColor[j] = 2
      } else if (homeDeg < HOME_HALO_DEG) {
        pColor[j] = Math.random() < 0.45 ? 2 : 0
      } else {
        pColor[j] = variety > 0.62 ? 3 : 0
      }

      // Ocean stays as a faint halo; the land/ocean gap is what makes coastlines read.
      pJitter[j] = (0.68 + Math.random() * 0.32) * (land ? 1 : 0.2)
      pPhase[j] = Math.random() * Math.PI * 2
    }

    // ---- precomputed route geometry ----
    const routeGeom = ROUTES.map((route) => {
      const a = toVec(route.from[0], route.from[1])
      const b = toVec(route.to[0], route.to[1])
      const dot = Math.max(-0.9999, Math.min(0.9999, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
      const omega = Math.acos(dot)
      return { a, b, omega, sin: Math.sin(omega) }
    })

    const labelAnchors = LABELS.map((label) => toVec(label.anchor[0], label.anchor[1]))

    // ---- cached fill styles, bucketed by colour + quantised alpha ----
    const fillStyles: string[][] = PALETTE.map((rgb) =>
      Array.from({ length: ALPHA_STEPS }, (_, step) => {
        const alpha = ((step + 1) / ALPHA_STEPS).toFixed(3)
        return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`
      }),
    )
    const buckets: number[][][] = PALETTE.map(() =>
      Array.from({ length: ALPHA_STEPS }, () => [] as number[]),
    )

    let width = 0
    let height = 0
    let cx = 0
    let cy = 0
    let radius = 0
    let dpr = 1

    const resize = () => {
      const rect = host.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cx = width * 0.5
      // Sits low enough that the lower cap runs off the bottom of the card while the crown stays visible.
      cy = height * 0.6
      radius = Math.min(width * 0.6, height * 0.56)
    }

    const cos = Math.cos(TILT)
    const sin = Math.sin(TILT)
    const projected: [number, number, number] = [0, 0, 0]

    /** Spin around the pole, tip toward the viewer, then project. Fills `projected` with x, y, depth. */
    const project = (x: number, y: number, z: number, spinCos: number, spinSin: number) => {
      const sx = x * spinCos + z * spinSin
      const sz = -x * spinSin + z * spinCos
      const ty = y * cos - sz * sin
      const tz = y * sin + sz * cos
      const persp = FOV / (FOV - tz)
      projected[0] = cx + sx * radius * persp
      projected[1] = cy + ty * radius * persp
      projected[2] = tz
      return projected
    }

    const arcPoint = (index: number, t: number, spinCos: number, spinSin: number) => {
      const geom = routeGeom[index]!
      const route = ROUTES[index]!
      const w1 = Math.sin((1 - t) * geom.omega) / geom.sin
      const w2 = Math.sin(t * geom.omega) / geom.sin
      const r = 1 + route.lift * Math.sin(Math.PI * t)
      return project(
        (geom.a[0] * w1 + geom.b[0] * w2) * r,
        (geom.a[1] * w1 + geom.b[1] * w2) * r,
        (geom.a[2] * w1 + geom.b[2] * w2) * r,
        spinCos,
        spinSin,
      )
    }

    const draw = (time: number) => {
      if (width === 0 || height === 0) return

      // The static fallback parks Ghana facing the viewer so its label is the one on show.
      const spin = reduceMotion ? 0.2 : (time / (SPIN_SECONDS * 1000)) * Math.PI * 2
      const spinCos = Math.cos(spin)
      const spinSin = Math.sin(spin)

      ctx.clearRect(0, 0, width, height)

      // ---- particles ----
      for (let c = 0; c < buckets.length; c++) {
        const byStep = buckets[c]!
        for (let s = 0; s < byStep.length; s++) byStep[s]!.length = 0
      }

      for (let i = 0; i < count; i++) {
        const p = project(px[i]!, py[i]!, pz[i]!, spinCos, spinSin)
        const sx = p[0]
        const sy = p[1]
        if (sx < -8 || sx > width + 8 || sy < -8 || sy > height + 8) continue

        const colorIndex = pColor[i]!
        const depth = (p[2] + 1) * 0.5
        // Sphere points bunch up at the silhouette; fading them keeps the edge hazy without erasing it.
        const rim = Math.hypot((sx - cx) / (radius * 1.02), (sy - cy) / (radius * 1.02))
        const edge = 1 - Math.pow(Math.min(1, rim), 5) * 0.7
        const twinkle = reduceMotion ? 1 : 0.88 + 0.12 * Math.sin(time * 0.0009 + pPhase[i]!)

        let alpha = (0.28 + 0.72 * Math.pow(depth, 1.2)) * edge * pJitter[i]! * twinkle * COLOR_WEIGHT[colorIndex]!
        if (alpha < 0.02) continue
        if (alpha > 1) alpha = 1

        const step = Math.min(ALPHA_STEPS - 1, Math.floor(alpha * ALPHA_STEPS))
        const size = (pLand[i] ? 1.15 : 0.7) + depth * 0.8
        const bucket = buckets[colorIndex]![step]!
        bucket.push(sx - size * 0.5, sy - size * 0.5, size)
      }

      for (let c = 0; c < buckets.length; c++) {
        const byStep = buckets[c]!
        for (let s = 0; s < byStep.length; s++) {
          const bucket = byStep[s]!
          if (bucket.length === 0) continue
          ctx.fillStyle = fillStyles[c]![s]!
          for (let k = 0; k < bucket.length; k += 3) {
            ctx.fillRect(bucket[k]!, bucket[k + 1]!, bucket[k + 2]!, bucket[k + 2]!)
          }
        }
      }

      // ---- orbital routes ----
      ctx.lineWidth = 1
      ctx.lineCap = "round"
      const segments = 56
      for (let r = 0; r < ROUTES.length; r++) {
        const route = ROUTES[r]!
        let prevX = 0
        let prevY = 0
        let prevDepth = 0
        for (let s = 0; s <= segments; s++) {
          const p = arcPoint(r, s / segments, spinCos, spinSin)
          const x = p[0]
          const y = p[1]
          const depth = p[2]
          if (s > 0) {
            const mid = ((prevDepth + depth) * 0.5 + 1) * 0.5
            const alpha = route.opacity * (0.18 + 0.82 * Math.pow(mid, 1.6))
            if (alpha > 0.012) {
              ctx.strokeStyle = `rgba(${route.color[0]},${route.color[1]},${route.color[2]},${alpha.toFixed(3)})`
              ctx.beginPath()
              ctx.moveTo(prevX, prevY)
              ctx.lineTo(x, y)
              ctx.stroke()
            }
          }
          prevX = x
          prevY = y
          prevDepth = depth
        }
      }

      // ---- parcels travelling the routes, each with a fading trail ----
      for (let r = 0; r < ROUTES.length; r++) {
        const route = ROUTES[r]!
        const cycle = route.travel + route.gap
        const elapsed = reduceMotion ? route.travel * 0.45 : (time / 1000 + route.offset) % cycle
        if (elapsed > route.travel) continue
        const t = elapsed / route.travel

        for (let k = TRAIL_SAMPLES; k >= 1; k--) {
          const tt = t - k * 0.0055
          if (tt <= 0) continue
          const p = arcPoint(r, tt, spinCos, spinSin)
          const depth = (p[2] + 1) * 0.5
          const decay = 1 - k / TRAIL_SAMPLES
          const alpha = 0.5 * decay * decay * (0.25 + 0.75 * depth)
          ctx.fillStyle = `rgba(255,107,53,${alpha.toFixed(3)})`
          const size = 0.6 + decay * 1.5
          ctx.beginPath()
          ctx.arc(p[0], p[1], size * 0.5, 0, Math.PI * 2)
          ctx.fill()
        }

        const head = arcPoint(r, t, spinCos, spinSin)
        const headDepth = (head[2] + 1) * 0.5
        const headAlpha = 0.35 + 0.65 * headDepth
        const glow = ctx.createRadialGradient(head[0], head[1], 0, head[0], head[1], 9)
        glow.addColorStop(0, `rgba(255,140,80,${(0.42 * headAlpha).toFixed(3)})`)
        glow.addColorStop(1, "rgba(255,140,80,0)")
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(head[0], head[1], 9, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(255,107,53,${(0.95 * headAlpha).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(head[0], head[1], 1.6 + headDepth * 0.8, 0, Math.PI * 2)
        ctx.fill()
      }

      // ---- label anchors: dot on the surface plus a hairline up to the pill ----
      const activeLabel = reduceMotion
        ? 0
        : Math.floor(time / (SPIN_SECONDS * 1000)) % labelAnchors.length

      for (let i = 0; i < labelAnchors.length; i++) {
        const node = labelRefs.current[i]
        if (i !== activeLabel) {
          if (node) node.style.opacity = "0"
          continue
        }

        const anchor = labelAnchors[i]!
        const p = project(anchor[0], anchor[1], anchor[2], spinCos, spinSin)
        const x = p[0]
        const y = p[1]

        let visible = p[2] < 0.04 ? 0 : Math.min(1, (p[2] - 0.04) / 0.12)
        visible *= Math.min(1, Math.max(0, (Math.min(x, width - x) - 10) / 22))
        visible *= Math.min(1, Math.max(0, (y - 44) / 18))

        if (node) {
          // Hang the pill off whichever side has room, so it never has to be clamped into the card.
          const flip = x > width * 0.5
          const shift = flip ? "calc(-100% + 14px)" : "-14px"
          node.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - 20).toFixed(1)}px, 0) translate(${shift}, -100%)`
          node.style.opacity = visible.toFixed(3)
        }

        if (visible <= 0.01) continue

        ctx.strokeStyle = `rgba(255,150,120,${(0.3 * visible).toFixed(3)})`
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x, y - 18)
        ctx.stroke()

        ctx.fillStyle = `rgba(255,107,53,${(0.85 * visible).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(x, y, 2.1, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    let frame = 0
    const loop = (time: number) => {
      draw(time)
      frame = window.requestAnimationFrame(loop)
    }

    resize()
    if (reduceMotion) {
      draw(0)
    } else {
      frame = window.requestAnimationFrame(loop)
    }

    const observer = new ResizeObserver(() => {
      resize()
      if (reduceMotion) draw(0)
    })
    observer.observe(host)

    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={hostRef} className="globe-field">
      <canvas ref={canvasRef} className="globe-canvas" aria-hidden="true" />
      <div className="globe-labels" aria-hidden="true">
        {LABELS.map((label, index) => (
          <div
            key={label.city}
            ref={(node) => {
              labelRefs.current[index] = node
            }}
            className={`globe-label globe-label-${label.tone}`}
          >
            <span className="globe-label-dot" />
            <span className="globe-label-text">
              <span className="globe-label-city">{label.city}</span>
              <span className="globe-label-status">{label.status}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
