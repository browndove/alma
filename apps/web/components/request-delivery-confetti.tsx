"use client"

import { useEffect, useRef } from "react"

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  rot: number
  vr: number
  color: string
  life: number
}

const COLORS = ["#fe5200", "#ff7a3d", "#ff4ecd", "#ff8ab8", "#ffd0e8", "#ffb347"]

function spawnBurst(width: number, height: number, count: number): Particle[] {
  const cx = width / 2
  const cy = height * 0.28
  const particles: Particle[] = []

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.35
    const speed = 7 + Math.random() * 11
    particles.push({
      x: cx + (Math.random() - 0.5) * 80,
      y: cy + (Math.random() - 0.5) * 24,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      w: 5 + Math.random() * 7,
      h: 7 + Math.random() * 10,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.35,
      color: COLORS[i % COLORS.length]!,
      life: 1,
    })
  }

  return particles
}

export function RequestDeliveryConfetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let frame = 0
    let raf = 0
    let particles: Particle[] = []
    let running = true

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    particles = [
      ...spawnBurst(window.innerWidth, window.innerHeight, 70),
      ...spawnBurst(window.innerWidth * 0.25, window.innerHeight, 28).map((p) => ({
        ...p,
        x: window.innerWidth * 0.18 + (Math.random() - 0.5) * 40,
      })),
      ...spawnBurst(window.innerWidth * 0.75, window.innerHeight, 28).map((p) => ({
        ...p,
        x: window.innerWidth * 0.82 + (Math.random() - 0.5) * 40,
      })),
    ]

    const onResize = () => resize()
    window.addEventListener("resize", onResize)

    const tick = () => {
      if (!running) return
      frame += 1
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      // Second soft burst a moment later
      if (frame === 18) {
        particles.push(...spawnBurst(window.innerWidth, window.innerHeight, 36))
      }

      let alive = 0
      for (const p of particles) {
        p.vy += 0.22
        p.vx *= 0.995
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        p.life -= 0.0085
        if (p.life <= 0) continue
        alive += 1

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life))
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }

      if (alive > 0 && frame < 220) {
        raf = window.requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      }
    }

    raf = window.requestAnimationFrame(tick)

    return () => {
      running = false
      window.cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
    }
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="rd-confetti"
      aria-hidden="true"
    />
  )
}
