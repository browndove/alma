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
  baseColor: string
  midColor: string
  tipColor: string
  showDot: boolean
}

type Pointer = {
  x: number
  y: number
  active: boolean
}

// Left-side rays lean blue-purple; right-side rays lean pink. Every ray still
// fades along its own length from indigo at the hub to magenta at the tip.
const leftBase = ["#312E81", "#3730A3", "#4C1D95"]
const leftMid = ["#6D28D9", "#7C3AED", "#8B5CF6"]
const leftTip = ["#C026D3", "#D946EF", "#E1409E"]
const rightBase = ["#5B21B6", "#6D28D9", "#7C3AED"]
const rightMid = ["#A855F7", "#C026D3", "#D946EF"]
const rightTip = ["#D946EF", "#E1409E", "#EC4899", "#F472B6"]

function pick(list: string[], fallback: string) {
  return list[Math.floor(Math.random() * list.length)] ?? fallback
}

/** First sub-segment of a cubic bezier from t=0 to t=segmentT. */
function splitCubicFirst(
  segmentT: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
) {
  const p01 = p0 + (p1 - p0) * segmentT
  const p12 = p1 + (p2 - p1) * segmentT
  const p23 = p2 + (p3 - p2) * segmentT
  const p012 = p01 + (p12 - p01) * segmentT
  const p123 = p12 + (p23 - p12) * segmentT
  const end = p012 + (p123 - p012) * segmentT
  return { cp1: p01, cp2: p012, end }
}

const CORE_BLOOM_LENGTH = 0.26

function randomFilament(
  index: number,
  total: number,
  isBase = false,
  isCenter = false,
): Filament {
  const spread = (index + 0.5) / total
  const jitter = (Math.random() - 0.5) * (1 / total) * 2.4
  const depth = Math.random() ** 1.5
  const colorSet =
    spread < 0.5
      ? { base: leftBase, mid: leftMid, tip: leftTip }
      : { base: rightBase, mid: rightMid, tip: rightTip }

  // Nearly full semicircle: ~178° arc so outer rays approach horizontal.
  const angle = isCenter
    ? Math.PI / 2 + (Math.random() - 0.5) * 0.24
    : Math.min(Math.max(spread + jitter, 0.002), 0.998) * Math.PI

  return {
    angle,
    reach: isCenter
      ? 0.18 + Math.random() * 0.58
      : isBase
        ? 0.08 + Math.random() * 0.62
        : 0.28 + Math.random() * 0.72,
    curve: (Math.random() * 2 - 1) * (isCenter ? 0.065 : isBase ? 0.035 : 0.05),
    width: isCenter
      ? 0.6 + depth * 1.7
      : isBase
        ? 0.35 + depth * 1.2
        : 0.4 + depth * 1.9,
    opacity: isCenter
      ? 0.28 + depth * 0.54
      : isBase
        ? 0.14 + depth * 0.46
        : 0.16 + depth * 0.58,
    phase: Math.random() * Math.PI * 2,
    speed: 0.45 + Math.random() * 0.7,
    baseColor: pick(colorSet.base, "#4C1D95"),
    midColor: pick(colorSet.mid, "#8B5CF6"),
    tipColor: pick(colorSet.tip, "#D946EF"),
    showDot: !isBase && !isCenter,
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
    let bloomCanvas: HTMLCanvasElement | null = null
    let bloomContext: CanvasRenderingContext2D | null = null
    let isAnimating = false

    function ensureBloomCanvas() {
      if (!bloomCanvas) {
        bloomCanvas = document.createElement("canvas")
        bloomContext = bloomCanvas.getContext("2d")
      }
      if (
        bloomCanvas &&
        bloomContext &&
        (bloomCanvas.width !== Math.round(width * dpr) ||
          bloomCanvas.height !== Math.round(height * dpr))
      ) {
        bloomCanvas.width = Math.round(width * dpr)
        bloomCanvas.height = Math.round(height * dpr)
        bloomContext.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }

    function resize() {
      const bounds = canvasElement.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvasElement.width = Math.round(width * dpr)
      canvasElement.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = width < 680 ? 200 : 380
      const baseCount = width < 680 ? 90 : 180
      const centerCount = width < 680 ? 18 : 40
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
      startAnimation()
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
      const revealTarget = targetVisible ? 1 : 0
      const isSettled =
        Math.abs(reveal - revealTarget) < 0.008 &&
        interaction < 0.01 &&
        !targetPointer.active

      if (!targetVisible && isSettled) {
        isAnimating = false
        return
      }

      if (isSettled && elapsed < 0.05) {
        animationFrame = window.requestAnimationFrame(draw)
        return
      }

      context.clearRect(0, 0, width, height)

      const domeRadius = height * 0.84
      const horizontalScale = Math.min(
        1.28,
        (width * 0.48) / (domeRadius * 0.86) * 0.97,
      )
      const coreBloomRadius = domeRadius * 0.34
      const bloomExtent = coreBloomRadius * 1.38
      const bloomBlur = width < 680 ? 22 : 28

      ensureBloomCanvas()
      const bloom = bloomContext
      const bloomCanvasEl = bloomCanvas
      if (bloom && bloomCanvasEl) {
        bloom.clearRect(0, 0, width, height)

        const wash = bloom.createRadialGradient(
          originX,
          originY,
          0,
          originX,
          originY - coreBloomRadius * 0.14,
          bloomExtent,
        )
        wash.addColorStop(0, "rgba(236, 72, 153, 0.48)")
        wash.addColorStop(0.32, "rgba(192, 38, 211, 0.32)")
        wash.addColorStop(0.58, "rgba(139, 92, 246, 0.12)")
        wash.addColorStop(0.78, "rgba(124, 58, 237, 0.04)")
        wash.addColorStop(1, "rgba(124, 58, 237, 0)")
        bloom.globalCompositeOperation = "source-over"
        bloom.globalAlpha = reveal
        bloom.fillStyle = wash
        bloom.beginPath()
        bloom.ellipse(
          originX,
          originY - coreBloomRadius * 0.16,
          coreBloomRadius * horizontalScale * 1.2,
          coreBloomRadius * 1.14,
          0,
          0,
          Math.PI * 2,
        )
        bloom.fill()

        bloom.globalCompositeOperation = "lighter"

        filaments.forEach((filament) => {
          const wave = Math.sin(time * 0.001 * filament.speed + filament.phase)
          const drift = Math.cos(time * 0.0007 * filament.speed + filament.phase)
          const angle = filament.angle + wave * 0.012
          const edgeReach =
            width < 680 ? 0.9 + Math.sin(angle) * 0.1 : 0.94 + Math.sin(angle) * 0.06
          const radius =
            domeRadius * filament.reach * edgeReach * (1 + drift * 0.022)
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

          const segmentT = Math.min(CORE_BLOOM_LENGTH, lineProgress)
          if (segmentT >= 0.03) {
            const splitX = splitCubicFirst(
              segmentT,
              originX,
              visibleControl1X,
              visibleControl2X,
              visibleFinalX,
            )
            const splitY = splitCubicFirst(
              segmentT,
              originY,
              visibleControl1Y,
              visibleControl2Y,
              visibleFinalY,
            )
            const coreDist = Math.hypot(splitX.end - originX, splitY.end - originY)
            const falloffT = Math.min(1, coreDist / (coreBloomRadius * 0.94))
            const falloff = 1 - falloffT * falloffT * (3 - 2 * falloffT)
            if (falloff < 0.04) return

            const bloomStrand = bloom.createLinearGradient(
              originX,
              originY,
              splitX.end,
              splitY.end,
            )
            bloomStrand.addColorStop(0, filament.baseColor)
            bloomStrand.addColorStop(0.45, filament.midColor)
            bloomStrand.addColorStop(1, filament.tipColor)

            bloom.beginPath()
            bloom.moveTo(originX, originY)
            bloom.bezierCurveTo(
              splitX.cp1,
              splitY.cp1,
              splitX.cp2,
              splitY.cp2,
              splitX.end,
              splitY.end,
            )
            bloom.strokeStyle = bloomStrand
            bloom.globalAlpha =
              (0.42 + filament.opacity * 0.28) *
              (0.75 + wave * 0.08) *
              reveal *
              falloff
            bloom.lineWidth = filament.width * 3.6
            bloom.lineCap = "round"
            bloom.stroke()
          }

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
          strand.addColorStop(0.38, filament.midColor)
          strand.addColorStop(0.72, filament.midColor)
          strand.addColorStop(1, filament.tipColor)

          context.strokeStyle = strand
          context.globalAlpha =
            filament.opacity * (0.7 + wave * 0.1) * reveal
          context.lineWidth = filament.width
          context.lineCap = "round"
          context.stroke()

          if (filament.showDot && lineProgress >= 0.97) {
            context.beginPath()
            context.arc(
              finalX,
              finalY,
              1.1 + influence * 0.75,
              0,
              Math.PI * 2,
            )
            context.fillStyle = filament.tipColor
            context.globalAlpha = Math.min(
              0.88,
              (filament.opacity + 0.2 + influence * 0.3) * reveal,
            )
            context.fill()
          }
        })

        bloom.save()
        bloom.globalCompositeOperation = "destination-in"
        const edgeMask = bloom.createRadialGradient(
          originX,
          originY,
          0,
          originX,
          originY - coreBloomRadius * 0.1,
          bloomExtent,
        )
        edgeMask.addColorStop(0, "rgba(0, 0, 0, 1)")
        edgeMask.addColorStop(0.48, "rgba(0, 0, 0, 0.94)")
        edgeMask.addColorStop(0.72, "rgba(0, 0, 0, 0.42)")
        edgeMask.addColorStop(0.88, "rgba(0, 0, 0, 0.1)")
        edgeMask.addColorStop(1, "rgba(0, 0, 0, 0)")
        bloom.fillStyle = edgeMask
        bloom.fillRect(
          originX - bloomExtent * horizontalScale * 1.05,
          originY - bloomExtent * 1.05,
          bloomExtent * horizontalScale * 2.1,
          bloomExtent * 1.05,
        )
        bloom.restore()

        context.save()
        context.filter = `blur(${bloomBlur}px)`
        context.globalCompositeOperation = "source-over"
        context.globalAlpha = reveal * 0.9
        context.drawImage(bloomCanvasEl, 0, 0, width, height)
        context.filter = "none"
        context.globalCompositeOperation = "source-over"
        context.globalAlpha = 1
        context.restore()
      }

      context.beginPath()
      context.arc(originX, originY, 2.5, 0, Math.PI * 2)
      context.fillStyle = "#7C3AED"
      context.globalAlpha = 0.6 * reveal
      context.fill()
      context.globalAlpha = 1

      animationFrame = window.requestAnimationFrame(draw)
    }

    function startAnimation() {
      if (isAnimating) return
      isAnimating = true
      lastTime = 0
      animationFrame = window.requestAnimationFrame(draw)
    }

    function stopAnimation() {
      if (!isAnimating) return
      window.cancelAnimationFrame(animationFrame)
      isAnimating = false
    }

    const observer = new ResizeObserver(resize)
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        targetVisible = entry?.isIntersecting ?? false
        if (targetVisible) {
          startAnimation()
        }
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
    startAnimation()

    return () => {
      observer.disconnect()
      visibilityObserver.disconnect()
      if (supportsPointer) {
        canvasElement.removeEventListener("pointermove", setPointer)
        canvasElement.removeEventListener("pointerleave", leavePointer)
      }
      stopAnimation()
    }
  }, [])

  return <canvas ref={canvasRef} className="flow-field-canvas" aria-hidden="true" />
}
