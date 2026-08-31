"use client"

import { useEffect, useRef } from "react"

type Filament = {
  angle: number
  reach: number
  curve: number
  width: number
  opacity: number
  phase: number
  speed: number
  dots: number[]
  baseColor: string
  tipColor: string
  isBase: boolean
  isCenter: boolean
}

type Pointer = {
  x: number
  y: number
  active: boolean
}

// Each strand runs violet at the hub to magenta at the tip. Foreground strands
// use the saturated pairs; background strands use the lighter ones so they
// recede into the amber wash.
const foregroundBase = ["#4C1D95", "#5B21B6", "#6D28D9", "#7C3AED"]
const foregroundTip = ["#C026D3", "#D946EF", "#E1409E", "#EC4899"]
const backgroundBase = ["#8B5CF6", "#9333EA", "#A855F7"]
const backgroundTip = ["#D8A0F0", "#E9A8D4", "#EFB0DE"]

function pick(list: string[], fallback: string) {
  return list[Math.floor(Math.random() * list.length)] ?? fallback
}

/** Cubic bezier position on one axis. */
function bezierAt(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
) {
  const inverse = 1 - t
  return (
    inverse * inverse * inverse * p0 +
    3 * inverse * inverse * t * p1 +
    3 * inverse * t * t * p2 +
    t * t * t * p3
  )
}

function randomFilament(
  index: number,
  total: number,
  isBase = false,
  isCenter = false,
): Filament {
  const spread = (index + 0.5) / total
  const jitter = (Math.random() - 0.5) * (1 / total) * 2.6
  // 0 = far background (thin, faint, short), 1 = foreground (thick, solid, long)
  const depth = Math.random() ** 1.6
  const dotCount =
    depth > 0.45 && Math.random() > 0.4
      ? 1 + Math.floor(Math.random() * 4)
      : 0
  const forward = depth > 0.5

  return {
    angle: isCenter
      ? Math.PI / 2 + (Math.random() - 0.5) * 0.28
      : Math.min(Math.max(spread + jitter, 0.012), 0.988) * Math.PI,
    // The short base layer fills the gaps close to the shared origin without
    // competing with the taller strands that define the outer silhouette.
    reach: isCenter
      ? 0.24 + Math.random() * 0.38
      : isBase
      ? 0.18 + Math.random() * 0.44
      : 0.58 + Math.random() * 0.42,
    curve: (Math.random() * 2 - 1) * (isCenter ? 0.07 : isBase ? 0.04 : 0.055),
    width: isCenter
      ? 0.65 + depth * 1.8
      : isBase
      ? 0.4 + depth * 1.4
      : 0.45 + depth * 2,
    opacity: isCenter
      ? 0.24 + depth * 0.56
      : isBase
      ? 0.18 + depth * 0.5
      : 0.1 + depth * 0.62,
    phase: Math.random() * Math.PI * 2,
    speed: 0.45 + Math.random() * 0.7,
    dots: Array.from(
      { length: isBase ? Math.min(dotCount, 1) : dotCount },
      () => 0.52 + Math.random() * 0.48,
    ),
    baseColor: pick(
      forward && !isBase || isCenter ? foregroundBase : backgroundBase,
      "#6D28D9",
    ),
    tipColor: pick(
      forward && !isBase || isCenter ? foregroundTip : backgroundTip,
      "#D946EF",
    ),
    isBase,
    isCenter,
  }
}

export function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const canvasElement = canvas as HTMLCanvasElement
    const drawingContext = canvasElement.getContext("2d")
    if (!drawingContext) return
    const context: CanvasRenderingContext2D = drawingContext

    let animationFrame = 0
    let width = 0
    let height = 0
    let dpr = 1
    let filaments: Filament[] = []
    let currentPointer: Pointer = { x: 0, y: 0, active: false }
    let targetPointer: Pointer = { x: 0, y: 0, active: false }
    let interaction = 0
    let reveal = 0
    let targetVisible = false
    let lastTime = 0

    function resize() {
      const bounds = canvasElement.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvasElement.width = Math.round(width * dpr)
      canvasElement.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = width < 680 ? 240 : 470
      const baseCount = width < 680 ? 120 : 260
      const centerCount = width < 680 ? 24 : 56
      filaments = [
        ...Array.from({ length: count }, (_, index) =>
          randomFilament(index, count),
        ),
        ...Array.from({ length: baseCount }, (_, index) =>
          randomFilament(index, baseCount, true),
        ),
        ...Array.from({ length: centerCount }, (_, index) =>
          randomFilament(index, centerCount, true, true),
        ),
      ]
    }

    function setPointer(event: PointerEvent) {
      const bounds = canvasElement.getBoundingClientRect()
      targetPointer = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        active: true,
      }
    }

    function leavePointer() {
      targetPointer = { ...targetPointer, active: false }
    }

    function draw(time: number) {
      const elapsed = Math.min((time - lastTime) / 1000 || 0, 0.05)
      lastTime = time
      const originX = width / 2
      const originY = height + 8

      currentPointer.x += (targetPointer.x - currentPointer.x) * 0.1
      currentPointer.y += (targetPointer.y - currentPointer.y) * 0.1
      currentPointer.active = targetPointer.active
      interaction +=
        ((targetPointer.active ? 1 : 0) - interaction) *
        Math.min(elapsed * 4.5, 1)
      reveal +=
        ((targetVisible ? 1 : 0) - reveal) * Math.min(elapsed * 2.4, 1)
      const lineProgress = Math.min(reveal * 1.45, 1)

      context.clearRect(0, 0, width, height)

      const domeRadius =
        width < 680 ? height * 0.84 : Math.min(height * 0.84, width * 0.4)
      const centerWashRadius = Math.max(domeRadius * 0.78, 220)
      const horizontalScale =
        width < 680
          ? Math.min(1.28, (width * 0.5) / (domeRadius * 0.88) * 0.96)
          : 1.28
      const centerWash = context.createRadialGradient(
        originX,
        originY,
        0,
        originX,
        originY,
        centerWashRadius,
      )
      centerWash.addColorStop(0, "rgba(91, 33, 182, 0.68)")
      centerWash.addColorStop(0.2, "rgba(124, 58, 200, 0.56)")
      centerWash.addColorStop(0.46, "rgba(167, 105, 222, 0.4)")
      centerWash.addColorStop(0.72, "rgba(232, 154, 198, 0.24)")
      centerWash.addColorStop(1, "rgba(139, 92, 246, 0)")
      context.globalAlpha = reveal
      context.fillStyle = centerWash
      context.beginPath()
      context.arc(originX, originY, centerWashRadius, 0, Math.PI * 2)
      context.fill()

      filaments.forEach((filament) => {
        const wave = Math.sin(time * 0.001 * filament.speed + filament.phase)
        const drift = Math.cos(time * 0.0007 * filament.speed + filament.phase)
        const angle = filament.angle + wave * 0.014
        const edgeReach = width < 680 ? 0.88 + Math.sin(angle) * 0.12 : 1
        const radius =
          domeRadius * filament.reach * edgeReach * (1 + drift * 0.025)
        const endpointX = originX + Math.cos(angle) * radius * horizontalScale
        const endpointY = originY - Math.sin(angle) * radius
        const dx = endpointX - originX
        const dy = endpointY - originY
        const distance = Math.hypot(
          currentPointer.x - endpointX,
          currentPointer.y - endpointY,
        )
        const influence =
          Math.max(0, 1 - distance / Math.max(width * 0.28, 180)) * interaction
        const pullX = (currentPointer.x - endpointX) * influence * 0.32
        const pullY = (currentPointer.y - endpointY) * influence * 0.2
        const perpendicularX = -dy * filament.curve
        const perpendicularY = dx * filament.curve

        const control1X = originX + dx * 0.28 + perpendicularX * 0.22 + pullX * 0.12
        const control1Y = originY + dy * 0.28 + perpendicularY * 0.22 + pullY * 0.12
        const control2X =
          originX + dx * 0.68 + perpendicularX * 0.7 + pullX * 0.65
        const control2Y =
          originY + dy * 0.68 + perpendicularY * 0.7 + pullY * 0.65
        const finalX = endpointX + pullX
        const finalY = endpointY + pullY
        const visibleControl1X =
          originX + (control1X - originX) * lineProgress
        const visibleControl1Y =
          originY + (control1Y - originY) * lineProgress
        const visibleControl2X =
          originX + (control2X - originX) * lineProgress
        const visibleControl2Y =
          originY + (control2Y - originY) * lineProgress
        const visibleFinalX = originX + (finalX - originX) * lineProgress
        const visibleFinalY = originY + (finalY - originY) * lineProgress

        context.beginPath()
        context.moveTo(originX, originY)
        context.bezierCurveTo(
          visibleControl1X,
          visibleControl1Y,
          visibleControl2X,
          visibleControl2Y,
          visibleFinalX,
          visibleFinalY,
        )
        const strand = context.createLinearGradient(
          originX,
          originY,
          visibleFinalX,
          visibleFinalY,
        )
        strand.addColorStop(0, filament.baseColor)
        strand.addColorStop(0.5, filament.baseColor)
        strand.addColorStop(1, filament.tipColor)

        context.strokeStyle = strand
        context.globalAlpha =
          filament.opacity * (0.68 + wave * 0.12) * reveal
        context.lineWidth = filament.width
        context.lineCap = "round"
        context.stroke()

        filament.dots.forEach((t) => {
          const dotX = bezierAt(
            t,
            originX,
            visibleControl1X,
            visibleControl2X,
            visibleFinalX,
          )
          const dotY = bezierAt(
            t,
            originY,
            visibleControl1Y,
            visibleControl2Y,
            visibleFinalY,
          )

          context.beginPath()
          context.arc(dotX, dotY, 1.1 + influence * 1.1, 0, Math.PI * 2)
          context.fillStyle = t > 0.6 ? filament.tipColor : filament.baseColor
          context.globalAlpha = Math.min(
            0.85,
            (filament.opacity + 0.18 + influence * 0.45) * reveal,
          )
          context.fill()
        })
      })

      const glow = context.createRadialGradient(
        originX,
        originY - 2,
        0,
        originX,
        originY - 2,
        34,
      )
      glow.addColorStop(0, "rgba(139, 92, 246, 0.58)")
      glow.addColorStop(0.35, "rgba(168, 85, 247, 0.3)")
      glow.addColorStop(1, "rgba(255, 178, 92, 0)")
      context.globalAlpha = reveal
      context.fillStyle = glow
      context.beginPath()
      context.arc(originX, originY - 2, 34, 0, Math.PI * 2)
      context.fill()

      context.beginPath()
      context.arc(originX, originY - 2, 4, 0, Math.PI * 2)
      context.fillStyle = "#8B5CF6"
      context.globalAlpha = 0.82 * reveal
      context.fill()
      context.globalAlpha = 1

      animationFrame = window.requestAnimationFrame(draw)
    }

    const observer = new ResizeObserver(resize)
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        targetVisible = entry?.isIntersecting ?? false
      },
      { threshold: 0.12 },
    )
    observer.observe(canvasElement)
    visibilityObserver.observe(canvasElement)
    const supportsPointer = window.matchMedia("(pointer: fine)").matches
    if (supportsPointer) {
      canvasElement.addEventListener("pointermove", setPointer)
      canvasElement.addEventListener("pointerleave", leavePointer)
    }
    resize()
    animationFrame = window.requestAnimationFrame(draw)

    return () => {
      observer.disconnect()
      visibilityObserver.disconnect()
      if (supportsPointer) {
        canvasElement.removeEventListener("pointermove", setPointer)
        canvasElement.removeEventListener("pointerleave", leavePointer)
      }
      window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  return <canvas ref={canvasRef} className="flow-field-canvas" aria-hidden="true" />
}

