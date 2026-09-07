"use client"

import Link from "next/link"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  phase: number
  color: string
}

type FlowNode = {
  id: string
  label: string
  sub?: string
  x: number
  y: number
  status?: "live" | "done"
  compact?: boolean
}

type Signal = {
  progress: number
  pathIndex: number
  speed: number
}

const PARTICLE_COLORS = ["#0B2540", "#1A3A5C", "#FFFFFF", "#FF5A00", "#E24900"]

/** Hub is always at 50, 50 — paths connect spokes into the hub. */
const HUB = { x: 50, y: 52 }

const DESKTOP_NODES: FlowNode[] = [
  { id: "sms", label: "SMS", x: 18, y: 10, compact: true },
  { id: "whatsapp", label: "WhatsApp", x: 36, y: 10, compact: true },
  { id: "maps", label: "Maps", x: 54, y: 10, compact: true },
  { id: "pos", label: "POS", x: 72, y: 10, compact: true },
  { id: "inventory", label: "Inventory", x: 88, y: 10, compact: true },
  {
    id: "request",
    label: "Request",
    sub: "Received",
    x: 18,
    y: 32,
    status: "done",
  },
  {
    id: "rider",
    label: "Rider matched",
    sub: "Kojo is on the way",
    x: 82,
    y: 30,
    status: "live",
  },
  {
    id: "pickup",
    label: "Pickup confirmed",
    sub: "Package collected",
    x: 18,
    y: 68,
  },
  {
    id: "tracking",
    label: "On the way",
    sub: "Live tracking",
    x: 82,
    y: 66,
    status: "live",
  },
  {
    id: "delivered",
    label: "Delivered",
    sub: "At the doorstep",
    x: 50,
    y: 88,
    status: "done",
  },
]

/** Each spoke connects to the central hub (like Stripe). */
const DESKTOP_PATHS: [string, string][] = [
  ["sms", "hub"],
  ["whatsapp", "hub"],
  ["maps", "hub"],
  ["pos", "hub"],
  ["inventory", "hub"],
  ["request", "hub"],
  ["rider", "hub"],
  ["pickup", "hub"],
  ["tracking", "hub"],
  ["delivered", "hub"],
]

const MOBILE_NODES: FlowNode[] = [
  { id: "request", label: "Request", sub: "Received", x: 62, y: 16, status: "done" },
  { id: "rider", label: "Rider matched", sub: "Kojo is on the way", x: 62, y: 34, status: "live" },
  { id: "pickup", label: "Pickup confirmed", sub: "Package collected", x: 62, y: 52 },
  { id: "tracking", label: "On the way", sub: "Live tracking", x: 62, y: 70, status: "live" },
  { id: "delivered", label: "Delivered", sub: "At the doorstep", x: 62, y: 88, status: "done" },
]

/** Mobile spine: hub → steps in order (not all spokes into hub). */
const MOBILE_PATHS: [string, string][] = [
  ["hub", "request"],
  ["request", "rider"],
  ["rider", "pickup"],
  ["pickup", "tracking"],
  ["tracking", "delivered"],
]

function createParticles(count: number, width: number, height: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.16,
    vy: (Math.random() - 0.5) * 0.16,
    size: 1.2 + Math.random() * 2.4,
    opacity: 0.28 + Math.random() * 0.38,
    phase: Math.random() * Math.PI * 2,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]!,
  }))
}

/** Orthogonal elbow path (Stripe-style circuit routes). */
function orthogonalPath(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  preferHorizontalFirst: boolean,
) {
  if (Math.abs(ax - bx) < 1 || Math.abs(ay - by) < 1) {
    return `M ${ax} ${ay} L ${bx} ${by}`
  }
  if (preferHorizontalFirst) {
    const midX = (ax + bx) / 2
    return `M ${ax} ${ay} L ${midX} ${ay} L ${midX} ${by} L ${bx} ${by}`
  }
  const midY = (ay + by) / 2
  return `M ${ax} ${ay} L ${ax} ${midY} L ${bx} ${midY} L ${bx} ${by}`
}

function pointOnOrthogonal(
  t: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  preferHorizontalFirst: boolean,
) {
  const points: { x: number; y: number }[] = [{ x: ax, y: ay }]
  if (Math.abs(ax - bx) < 1 || Math.abs(ay - by) < 1) {
    points.push({ x: bx, y: by })
  } else if (preferHorizontalFirst) {
    const midX = (ax + bx) / 2
    points.push({ x: midX, y: ay }, { x: midX, y: by }, { x: bx, y: by })
  } else {
    const midY = (ay + by) / 2
    points.push({ x: ax, y: midY }, { x: bx, y: midY }, { x: bx, y: by })
  }

  let total = 0
  const segs: number[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.hypot(points[i + 1]!.x - points[i]!.x, points[i + 1]!.y - points[i]!.y)
    segs.push(len)
    total += len
  }
  if (total === 0) return { x: ax, y: ay }

  let dist = t * total
  for (let i = 0; i < segs.length; i++) {
    const len = segs[i]!
    if (dist <= len) {
      const u = len === 0 ? 0 : dist / len
      const p0 = points[i]!
      const p1 = points[i + 1]!
      return {
        x: p0.x + (p1.x - p0.x) * u,
        y: p0.y + (p1.y - p0.y) * u,
      }
    }
    dist -= len
  }
  return points[points.length - 1]!
}

function resolvePoint(
  id: string,
  lookup: Record<string, FlowNode>,
  w: number,
  h: number,
  hubX: number,
  hubY: number,
) {
  if (id === "hub") {
    return { x: hubX, y: hubY }
  }
  const node = lookup[id]
  if (!node) return null
  return { x: (node.x / 100) * w, y: (node.y / 100) * h }
}

function BusinessFlowNetwork({ mobile }: { mobile: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false })
  const signalsRef = useRef<Signal[]>([
    { progress: 0, pathIndex: 0, speed: 0.0038 },
    { progress: 0.4, pathIndex: 3, speed: 0.0031 },
    { progress: 0.7, pathIndex: 6, speed: 0.0044 },
  ])
  const rafRef = useRef(0)
  const [size, setSize] = useState({ w: 0, h: 0 })

  const nodes = mobile ? MOBILE_NODES : DESKTOP_NODES
  const paths = mobile ? MOBILE_PATHS : DESKTOP_PATHS
  const hubYPct = mobile ? 8 : HUB.y
  const hubXPct = mobile ? 16 : HUB.x

  const resize = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const w = Math.max(1, Math.floor(rect.width))
    const h = Math.max(1, Math.floor(rect.height))
    setSize({ w, h })

    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext("2d")
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    particlesRef.current = createParticles(mobile ? 70 : 130, w, h)
  }, [mobile])

  useEffect(() => {
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [resize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size.w === 0) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let last = performance.now()
    let running = true

    const tick = (now: number) => {
      if (!running) return
      const dt = Math.min((now - last) / 16.67, 2.5)
      last = now

      const { w, h } = size
      const pointer = pointerRef.current
      const activeNodes = mobile ? MOBILE_NODES : DESKTOP_NODES
      const activePaths = mobile ? MOBILE_PATHS : DESKTOP_PATHS
      const lookup = Object.fromEntries(activeNodes.map((n) => [n.id, n])) as Record<
        string,
        FlowNode
      >
      const hubX = (hubXPct / 100) * w
      const hubY = (hubYPct / 100) * h

      ctx.clearRect(0, 0, w, h)

      const px = pointer.active ? pointer.x * w : 0
      const py = pointer.active ? pointer.y * h : 0
      const attractRadius = mobile ? 160 : 260

      if (pointer.active) {
        const glow = ctx.createRadialGradient(px, py, 0, px, py, attractRadius)
        glow.addColorStop(0, "rgba(255, 255, 255, 0.22)")
        glow.addColorStop(0.35, "rgba(11, 37, 64, 0.08)")
        glow.addColorStop(1, "rgba(255, 90, 0, 0)")
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(px, py, attractRadius, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.strokeStyle = "rgba(11, 37, 64, 0.18)"
        ctx.lineWidth = 1
        ctx.setLineDash([4, 6])
        ctx.arc(px, py, 42, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }

      for (const p of particlesRef.current) {
        p.phase += 0.02 * dt
        let ax = 0
        let ay = 0
        let nearCursor = false
        if (pointer.active) {
          const dx = px - p.x
          const dy = py - p.y
          const dist = Math.hypot(dx, dy) || 1
          if (dist < attractRadius) {
            nearCursor = dist < attractRadius * 0.72
            const force = ((attractRadius - dist) / attractRadius) * 0.16
            ax += (dx / dist) * force
            ay += (dy / dist) * force
          }
        }

        p.vx = (p.vx + ax) * 0.98
        p.vy = (p.vy + ay) * 0.98
        p.x += p.vx * dt
        p.y += p.vy * dt

        if (p.x < -4) p.x = w + 4
        if (p.x > w + 4) p.x = -4
        if (p.y < -4) p.y = h + 4
        if (p.y > h + 4) p.y = -4

        const pulse = 0.72 + Math.sin(p.phase) * 0.28
        const drawSize = nearCursor ? p.size * 1.45 : p.size
        const drawAlpha = nearCursor
          ? Math.min(0.95, p.opacity * pulse * 1.55)
          : p.opacity * pulse

        ctx.beginPath()
        ctx.fillStyle = nearCursor ? "#0B2540" : p.color
        ctx.globalAlpha = drawAlpha
        ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2)
        ctx.fill()

        if (nearCursor) {
          ctx.beginPath()
          ctx.fillStyle = "#FFFFFF"
          ctx.globalAlpha = Math.min(0.7, drawAlpha * 0.55)
          ctx.arc(p.x, p.y, drawSize * 0.42, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1

      for (const signal of signalsRef.current) {
        signal.progress += signal.speed * dt
        if (signal.progress > 1) {
          signal.progress = 0
          signal.pathIndex = (signal.pathIndex + 1) % activePaths.length
        }

        const pair = activePaths[signal.pathIndex]
        if (!pair) continue
        const a = resolvePoint(pair[0], lookup, w, h, hubX, hubY)
        const b = resolvePoint(pair[1], lookup, w, h, hubX, hubY)
        if (!a || !b) continue

        // On mobile, route along the left spine then into the card.
        const spineX = hubX
        const from = mobile
          ? pair[0] === "hub"
            ? a
            : { x: spineX, y: a.y }
          : a
        const to = mobile ? { x: b.x * 0.92 + spineX * 0.08, y: b.y } : b
        const preferH = mobile ? false : Math.abs(from.x - to.x) > Math.abs(from.y - to.y)
        const pt = pointOnOrthogonal(signal.progress, from.x, from.y, to.x, to.y, preferH)

        const gradient = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 12)
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)")
        gradient.addColorStop(0.25, "rgba(11, 37, 64, 0.55)")
        gradient.addColorStop(0.55, "rgba(255, 90, 0, 0.45)")
        gradient.addColorStop(1, "rgba(255, 90, 0, 0)")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.fillStyle = "#0B2540"
        ctx.globalAlpha = 0.92
        ctx.arc(pt.x, pt.y, 3.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [size, mobile, hubYPct, hubXPct])

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    pointerRef.current = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      active: true,
    }
  }

  function onPointerLeave() {
    pointerRef.current.active = false
  }

  const lookup = Object.fromEntries(nodes.map((n) => [n.id, n])) as Record<
    string,
    FlowNode
  >
  const hubX = (hubXPct / 100) * Math.max(size.w, 1)
  const hubY = (hubYPct / 100) * Math.max(size.h, 1)

  return (
    <div
      ref={wrapRef}
      className={`business-flow-network${mobile ? " is-mobile" : " is-desktop"}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="business-flow-ribbons" aria-hidden="true">
        <span className="business-flow-ribbon business-flow-ribbon-a" />
        <span className="business-flow-ribbon business-flow-ribbon-b" />
        <span className="business-flow-ribbon business-flow-ribbon-c" />
      </div>

      <div className="business-flow-network-dots" aria-hidden="true" />

      <canvas ref={canvasRef} className="business-flow-canvas" aria-hidden="true" />

      <svg
        className="business-flow-paths"
        viewBox={`0 0 ${Math.max(size.w, 1)} ${Math.max(size.h, 1)}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {paths.map(([from, to]) => {
          if (size.w === 0) return null
          const a = resolvePoint(from, lookup, size.w, size.h, hubX, hubY)
          const b = resolvePoint(to, lookup, size.w, size.h, hubX, hubY)
          if (!a || !b) return null

          if (mobile) {
            const spineX = hubX
            const start =
              from === "hub" ? a : { x: spineX, y: a.y }
            const cardHalf = Math.min(58, size.w * 0.16)
            const end = { x: Math.max(spineX + 10, b.x - cardHalf), y: b.y }
            return (
              <g key={`${from}-${to}`}>
                <path
                  d={orthogonalPath(start.x, start.y, end.x, end.y, false)}
                  className="business-flow-path"
                />
                <circle
                  cx={spineX}
                  cy={b.y}
                  r="3"
                  className="business-flow-junction"
                />
              </g>
            )
          }

          const preferH = Math.abs(a.x - b.x) > Math.abs(a.y - b.y)
          const midX = (a.x + b.x) / 2
          const midY = (a.y + b.y) / 2
          return (
            <g key={`${from}-${to}`}>
              <path
                d={orthogonalPath(a.x, a.y, b.x, b.y, preferH)}
                className="business-flow-path"
              />
              <circle
                cx={preferH ? midX : a.x}
                cy={preferH ? a.y : midY}
                r="3"
                className="business-flow-junction"
              />
            </g>
          )
        })}
      </svg>

      <div
        className="business-flow-hub"
        style={{ left: `${hubXPct}%`, top: `${hubYPct}%` }}
        aria-hidden="true"
      >
        <span className="business-flow-hub-mark">D</span>
        <span className="business-flow-hub-label">DIATEL</span>
      </div>

      {nodes.map((node, index) => {
        const motions = ["spin", "pop", "wiggle", "glow", "bob"] as const
        const motion = node.status === "live" ? "live" : motions[index % motions.length]!
        return (
        <article
          key={node.id}
          className={`business-flow-node business-flow-node-${node.id} is-motion-${motion}${
            node.compact ? " is-compact" : ""
          }${node.status === "live" ? " is-live" : ""}${
            node.status === "done" ? " is-done" : ""
          }`}
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            ["--bf-delay" as string]: `${(index * 1.7) % 8}s`,
            ["--bf-duration" as string]: `${6.2 + (index % 5) * 1.1}s`,
          }}
        >
          <p className="business-flow-node-label">
            {node.status === "live" ? (
              <span className="business-flow-live" aria-hidden="true" />
            ) : null}
            {node.label}
          </p>
        </article>
        )
      })}
    </div>
  )
}

export function BusinessFlowSection() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return (
    <section className="business-flow-section" aria-labelledby="business-flow-title">
      <div className="business-flow-guides" aria-hidden="true">
        <span className="business-flow-guide business-flow-guide-left" />
        <span className="business-flow-guide business-flow-guide-right" />
      </div>

      <div className="business-flow-inner">
        <div className="business-flow-header">
          <h2 id="business-flow-title" className="business-flow-title">
            Powering every delivery from request to doorstep.
          </h2>
          <p className="business-flow-support">
            From pickup to drop-off, Diatel keeps every step connected — matching
            you with a rider, tracking your package, and keeping you updated along
            the way.
          </p>
          <div className="business-flow-actions">
            <Link href="/request-delivery" className="business-flow-cta">
              Request a Delivery
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/how-it-works" className="business-flow-secondary">
              See how it works
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <BusinessFlowNetwork mobile={isMobile} />
      </div>
    </section>
  )
}
