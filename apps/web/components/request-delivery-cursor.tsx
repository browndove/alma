"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import { createPortal } from "react-dom"

type Particle = {
  x: number
  y: number
  life: number
  size: number
}

const MAX = 16

/**
 * Subtle fading trail — only while the pointer is over the form card.
 */
export function RequestDeliveryCursor({
  targetRef,
}: {
  targetRef: RefObject<HTMLElement | null>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const fine = window.matchMedia("(pointer: fine)").matches
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const canvas = canvasRef.current
    const target = targetRef.current
    if (!fine || reduce || !canvas || !target) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const particles: Particle[] = []
    let lastX = -1
    let lastY = -1
    let active = false
    let frame = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = (x: number, y: number) => {
      particles.push({
        x,
        y,
        life: 1,
        size: 1.6 + Math.random() * 1.8,
      })
      if (particles.length > MAX) particles.shift()
    }

    const onMove = (event: PointerEvent) => {
      const rect = target.getBoundingClientRect()
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      if (!inside) {
        active = false
        lastX = -1
        lastY = -1
        return
      }

      active = true
      const x = event.clientX
      const y = event.clientY

      if (lastX >= 0) {
        const dx = x - lastX
        const dy = y - lastY
        const dist = Math.hypot(dx, dy)
        const steps = Math.min(4, Math.max(1, Math.floor(dist / 10)))
        for (let i = 1; i <= steps; i++) {
          const t = i / steps
          spawn(lastX + dx * t, lastY + dy * t)
        }
      } else {
        spawn(x, y)
      }

      lastX = x
      lastY = y
    }

    const onLeave = () => {
      active = false
      lastX = -1
      lastY = -1
    }

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      // Clip drawing to the card bounds so trails never spill outside.
      const rect = target.getBoundingClientRect()
      ctx.save()
      ctx.beginPath()
      const radius = 12
      const x = rect.left
      const y = rect.top
      const w = rect.width
      const h = rect.height
      ctx.moveTo(x + radius, y)
      ctx.arcTo(x + w, y, x + w, y + h, radius)
      ctx.arcTo(x + w, y + h, x, y + h, radius)
      ctx.arcTo(x, y + h, x, y, radius)
      ctx.arcTo(x, y, x + w, y, radius)
      ctx.closePath()
      ctx.clip()

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!
        p.life -= active ? 0.03 : 0.05
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        const alpha = Math.min(0.28, p.life * 0.28)
        const radius = p.size * (0.4 + p.life * 0.6)

        ctx.beginPath()
        ctx.fillStyle = `rgba(254, 82, 0, ${alpha.toFixed(3)})`
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
      frame = window.requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("pointermove", onMove, { passive: true })
    target.addEventListener("pointerleave", onLeave)
    frame = window.requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onMove)
      target.removeEventListener("pointerleave", onLeave)
      window.cancelAnimationFrame(frame)
    }
  }, [mounted, targetRef])

  if (!mounted) return null

  return createPortal(
    <canvas ref={canvasRef} className="rd-cursor-trail" aria-hidden="true" />,
    document.body,
  )
}
