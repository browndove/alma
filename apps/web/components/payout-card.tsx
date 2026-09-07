"use client"

import { useEffect, useRef } from "react"

/** Same four tones as the globe, so the two cards share one particle language. */
const TONES = [
  "rgba(255,143,163,",
  "rgba(255,182,193,",
  "rgba(255,107,53,",
  "rgba(255,214,199,",
]

const COUNT = 4200
const REPEL_RADIUS = 96
const REPEL_FORCE = 0.85
const SPRING = 0.012
const DAMPING = 0.9

/** Max tilt in degrees when the pointer is at a card corner. */
const TILT_MAX = 11
/** How quickly the card follows the pointer (0–1). */
const TILT_LERP = 0.08
/** Gentle idle bob while hovered / always-on float amplitude in px. */
const FLOAT_AMP = 7

export function PayoutCard() {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    const card = cardRef.current
    if (!host || !canvas || !card) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Polar layout gives an elliptical cloud centred on the card, so the card sits inside a
    // halo rather than on top of an even grid.
    const angle = new Float32Array(COUNT)
    const spread = new Float32Array(COUNT)
    const tone = new Uint8Array(COUNT)
    const size = new Float32Array(COUNT)
    const alpha = new Float32Array(COUNT)
    const phase = new Float32Array(COUNT)
    const driftAmp = new Float32Array(COUNT)
    const driftRate = new Float32Array(COUNT)
    // Live offsets driven by the pointer, sprung back toward the base position.
    const ox = new Float32Array(COUNT)
    const oy = new Float32Array(COUNT)
    const vx = new Float32Array(COUNT)
    const vy = new Float32Array(COUNT)

    for (let i = 0; i < COUNT; i++) {
      angle[i] = Math.random() * Math.PI * 2
      spread[i] = Math.sqrt(Math.random())
      const roll = Math.random()
      tone[i] = roll < 0.42 ? 0 : roll < 0.68 ? 1 : roll < 0.82 ? 2 : 3
      size[i] = 0.9 + Math.random() * 1.3
      // Sparse toward the outer edge so the cloud dissolves instead of ending abruptly.
      alpha[i] = (0.3 + Math.random() * 0.55) * (1 - Math.pow(spread[i]!, 1.8) * 0.8)
      phase[i] = Math.random() * Math.PI * 2
      driftAmp[i] = 2 + Math.random() * 7
      driftRate[i] = 0.00012 + Math.random() * 0.00028
    }

    let width = 0
    let height = 0
    let dpr = 1
    const pointer = { x: 0, y: 0, active: false }
    // Smoothed tilt targets — spring toward these each frame.
    let tiltX = 0
    let tiltY = 0
    let targetTiltX = 0
    let targetTiltY = 0
    let hoverLift = 0
    let targetLift = 0

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
    }

    const applyCardTransform = (time: number) => {
      if (reduceMotion) {
        card.style.transform = "none"
        return
      }

      tiltX += (targetTiltX - tiltX) * TILT_LERP
      tiltY += (targetTiltY - tiltY) * TILT_LERP
      hoverLift += (targetLift - hoverLift) * TILT_LERP

      // Idle float is always on; it gets a little stronger while hovered.
      const float =
        Math.sin(time * 0.0011) * (FLOAT_AMP * (0.55 + hoverLift * 0.45)) +
        Math.sin(time * 0.0007 + 1.2) * 2.2
      const yaw = Math.sin(time * 0.00055) * (0.8 + hoverLift * 1.4)

      card.style.transform = [
        `translate3d(0, ${(-hoverLift * 10 + float).toFixed(2)}px, 0)`,
        `rotateX(${tiltX.toFixed(2)}deg)`,
        `rotateY(${tiltY.toFixed(2)}deg)`,
        `rotateZ(${yaw.toFixed(2)}deg)`,
      ].join(" ")

      const shadowY = 26 + hoverLift * 10 + Math.max(0, -float)
      const shadowBlur = 56 + hoverLift * 18
      card.style.boxShadow = [
        `0 ${shadowY.toFixed(1)}px ${shadowBlur.toFixed(1)}px rgba(255, 107, 53, ${0.12 + hoverLift * 0.06})`,
        `0 ${(8 + hoverLift * 4).toFixed(1)}px 20px rgba(10, 37, 64, 0.08)`,
      ].join(", ")
    }

    const draw = (time: number) => {
      if (width === 0 || height === 0) return
      const cx = width * 0.5
      const cy = height * 0.5
      const rx = width * 0.62
      const ry = height * 0.52

      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < COUNT; i++) {
        const wobble = reduceMotion ? 0 : Math.sin(time * driftRate[i]! + phase[i]!) * driftAmp[i]!
        const r = spread[i]! + wobble / Math.max(rx, ry)
        const bx = cx + Math.cos(angle[i]!) * rx * r
        const by = cy + Math.sin(angle[i]!) * ry * r

        if (!reduceMotion) {
          let ax = -ox[i]! * SPRING
          let ay = -oy[i]! * SPRING

          if (pointer.active) {
            const dx = bx + ox[i]! - pointer.x
            const dy = by + oy[i]! - pointer.y
            const dist = Math.hypot(dx, dy)
            if (dist < REPEL_RADIUS && dist > 0.001) {
              const falloff = 1 - dist / REPEL_RADIUS
              const push = falloff * falloff * REPEL_FORCE
              ax += (dx / dist) * push
              ay += (dy / dist) * push
            }
          }

          vx[i] = (vx[i]! + ax) * DAMPING
          vy[i] = (vy[i]! + ay) * DAMPING
          ox[i] = ox[i]! + vx[i]!
          oy[i] = oy[i]! + vy[i]!
        }

        const x = bx + ox[i]!
        const y = by + oy[i]!
        if (x < -4 || x > width + 4 || y < -4 || y > height + 4) continue

        const s = size[i]!
        ctx.fillStyle = `${TONES[tone[i]!]}${alpha[i]!.toFixed(3)})`
        ctx.fillRect(x - s * 0.5, y - s * 0.5, s, s)
      }

      applyCardTransform(time)
    }

    let frame = 0
    let running = false
    const loop = (time: number) => {
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

    const setPointer = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      pointer.active = true

      // Map pointer position across the host into a subtle 3D tilt toward the cursor.
      const nx = (pointer.x / rect.width) * 2 - 1
      const ny = (pointer.y / rect.height) * 2 - 1
      targetTiltY = nx * TILT_MAX
      targetTiltX = -ny * TILT_MAX
      targetLift = 1
    }
    const leavePointer = () => {
      pointer.active = false
      targetTiltX = 0
      targetTiltY = 0
      targetLift = 0
    }

    resize()
    draw(0)

    const observer = new ResizeObserver(() => {
      resize()
      draw(0)
    })
    observer.observe(host)

    // Only animate while the card is actually on screen.
    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) start()
        else stop()
      },
      { threshold: 0.1 },
    )
    visibility.observe(host)

    const finePointer = window.matchMedia("(pointer: fine)").matches
    if (finePointer) {
      host.addEventListener("pointermove", setPointer)
      host.addEventListener("pointerleave", leavePointer)
    }

    return () => {
      observer.disconnect()
      visibility.disconnect()
      if (finePointer) {
        host.removeEventListener("pointermove", setPointer)
        host.removeEventListener("pointerleave", leavePointer)
      }
      stop()
    }
  }, [])

  return (
    <div ref={hostRef} className="payout-field">
      <canvas ref={canvasRef} className="payout-canvas" aria-hidden="true" />
      <div ref={cardRef} className="payout-card" aria-hidden="true">
        <div className="payout-card-sweep" />
        <div className="payout-card-top">
          <svg className="payout-chip" viewBox="0 0 30 22" fill="none">
            <rect x="0.6" y="0.6" width="28.8" height="20.8" rx="3.4" fill="rgba(255,255,255,.92)" />
            <path
              d="M10.5 1v20M19.5 1v20M1 7.5h28M1 14.5h28"
              stroke="rgba(255,255,255,.55)"
              strokeWidth="1.6"
            />
          </svg>
          <svg className="payout-wave" viewBox="0 0 18 20" fill="none">
            <path
              d="M3 4.5a9 9 0 0 1 0 11M7.5 2a13 13 0 0 1 0 16M12 -0.5a17 17 0 0 1 0 21"
              stroke="rgba(255,255,255,.9)"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="payout-card-brand">DIATEL</div>
      </div>
    </div>
  )
}
