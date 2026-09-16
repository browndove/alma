"use client"

import { useEffect, useRef } from "react"

/** Soft pink → rose tones for the delivery request particle ring. */
const TONES = [
  "rgba(247,182,207,",
  "rgba(255,143,163,",
  "rgba(232,121,249,",
  "rgba(196,181,253,",
  "rgba(251,146,160,",
]

const COUNT = 2800
/** Share of particles that stay put so the circle silhouette never dissolves. */
const STATIC_SHARE = 0.22

export function ParticleRing() {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Ring + radial flare particles. Angles stay fixed — motion is vertical bounce only.
    const angle = new Float32Array(COUNT)
    const radius = new Float32Array(COUNT)
    const tone = new Uint8Array(COUNT)
    const size = new Float32Array(COUNT)
    const alpha = new Float32Array(COUNT)
    const phase = new Float32Array(COUNT)
    const bounceAmp = new Float32Array(COUNT)
    const bounceRate = new Float32Array(COUNT)
    const kind = new Uint8Array(COUNT) // 0 = ring, 1 = flare
    const frozen = new Uint8Array(COUNT) // 1 = never moves (anchors the circle)

    for (let i = 0; i < COUNT; i++) {
      const isFlare = Math.random() < 0.28
      kind[i] = isFlare ? 1 : 0
      angle[i] = Math.random() * Math.PI * 2

      if (isFlare) {
        const t = Math.random()
        radius[i] = 0.42 + Math.pow(t, 0.55) * 0.7
        alpha[i] = (0.12 + Math.random() * 0.28) * (1 - t * 0.75)
        size[i] = 0.7 + Math.random() * 1.1
      } else {
        const band = (Math.random() + Math.random()) * 0.5
        radius[i] = 0.34 + band * 0.22
        alpha[i] = 0.22 + Math.random() * 0.55
        size[i] = 0.85 + Math.random() * 1.35
      }

      tone[i] = Math.floor(Math.random() * TONES.length)
      phase[i] = Math.random() * Math.PI * 2

      // Prefer anchoring ring particles over flares so the circle stays readable.
      const stayStill =
        (!isFlare && Math.random() < STATIC_SHARE) ||
        (isFlare && Math.random() < STATIC_SHARE * 0.35)
      frozen[i] = stayStill ? 1 : 0
      bounceAmp[i] = stayStill ? 0 : 2.2 + Math.random() * 5.5
      bounceRate[i] = stayStill ? 0 : 0.0014 + Math.random() * 0.0022
    }

    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const parent = host.parentElement?.getBoundingClientRect()
      const nextW = rect.width || parent?.width || 0
      const nextH = rect.height || parent?.height || 0
      if (nextW === 0 || nextH === 0) return false
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = nextW
      height = nextH
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      return true
    }

    const draw = (time: number) => {
      if (width === 0 || height === 0) return
      const mobile = width < 480
      const cx = width * 0.5
      const cy = height * (mobile ? 0.56 : 0.52)
      const scale = mobile
        ? Math.max(width * 1.05, Math.min(width, height) * 1.15)
        : Math.min(width, height) * 0.92

      ctx.clearRect(0, 0, width, height)

      const sizeBoost = mobile ? 1.25 : 1
      const alphaBoost = mobile ? 1.2 : 1
      const ampScale = mobile ? 1.15 : 1

      for (let i = 0; i < COUNT; i++) {
        const a = angle[i]!
        const r = radius[i]! * scale
        const x = cx + Math.cos(a) * r
        let y = cy + Math.sin(a) * r

        if (!reduceMotion && !frozen[i]) {
          // Soft vertical bounce — each particle has its own phase and speed.
          y += Math.sin(time * bounceRate[i]! + phase[i]!) * bounceAmp[i]! * ampScale
        }

        if (x < -4 || x > width + 4 || y < -4 || y > height + 4) continue

        const twinkle = reduceMotion || frozen[i]
          ? 1
          : 0.88 + 0.12 * Math.sin(time * 0.001 + phase[i]!)
        const s = size[i]! * sizeBoost
        const aOut = Math.min(1, alpha[i]! * twinkle * alphaBoost)
        ctx.fillStyle = `${TONES[tone[i]!]}${aOut.toFixed(3)})`
        ctx.fillRect(x - s * 0.5, y - s * 0.5, s, s)
      }
    }

    let frame = 0
    let running = false
    const loop = (time: number) => {
      if (width === 0 || height === 0) resize()
      draw(time)
      frame = window.requestAnimationFrame(loop)
    }
    const start = () => {
      if (running || reduceMotion) return
      running = true
      frame = window.requestAnimationFrame(loop)
    }
    const stop = () => {
      if (!running) return
      window.cancelAnimationFrame(frame)
      running = false
    }

    resize()
    draw(0)

    const observer = new ResizeObserver(() => {
      resize()
      draw(0)
    })
    observer.observe(host)
    if (host.parentElement) observer.observe(host.parentElement)

    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) start()
        else stop()
      },
      { threshold: 0.1 },
    )
    visibility.observe(host)

    return () => {
      observer.disconnect()
      visibility.disconnect()
      stop()
    }
  }, [])

  return (
    <div ref={hostRef} className="particle-ring" aria-hidden="true">
      <canvas ref={canvasRef} className="particle-ring-canvas" />
    </div>
  )
}
