/**
 * Delivery-themed background — isometric cityscape with skyscrapers,
 * architectural details, rooftop features, trees, a crane, vehicles,
 * and a delivery route. Subtle, low-opacity urban backdrop.
 */

const COS30 = 0.866
const SIN30 = 0.5

interface Building {
  x: number
  y: number
  w: number
  d: number
  h: number
  /** Optional: antenna/spire on top */
  spire?: boolean
  /** Optional: helipad on roof */
  helipad?: boolean
  /** Optional: rooftop AC boxes */
  roofBoxes?: boolean
  /** Optional: setback (terrace) — a shorter upper portion */
  setback?: { inset: number; extraH: number }
}

function buildingPolys(b: Building) {
  const { x, y, w, d, h } = b

  const p0 = [x, y]
  const p1 = [x + w * COS30, y - w * SIN30]
  const p3 = [x - d * COS30, y - d * SIN30]

  const p4 = [x, y - h]
  const p5 = [x + w * COS30, y - w * SIN30 - h]
  const p6 = [x + w * COS30 - d * COS30, y - w * SIN30 - d * SIN30 - h]
  const p7 = [x - d * COS30, y - d * SIN30 - h]

  return {
    top: `${p4} ${p5} ${p6} ${p7}`,
    right: `${p0} ${p1} ${p5} ${p4}`,
    left: `${p0} ${p3} ${p7} ${p4}`,
    // Center of top face for placing rooftop elements
    topCenter: [
      (p4[0]! + p5[0]! + p6[0]! + p7[0]!) / 4,
      (p4[1]! + p5[1]! + p6[1]! + p7[1]!) / 4,
    ] as [number, number],
    topFront: p4 as number[],
  }
}

function windowRows(
  b: Building,
  face: "right" | "left",
  cols: number,
  rows: number,
) {
  const { x, y, w, d, h } = b
  const rects: { x: number; y: number; w: number; h: number }[] = []

  const faceW = face === "right" ? w : d
  const dirX = face === "right" ? COS30 : -COS30
  const dirY = -SIN30

  const padU = 0.15
  const padV = 0.08
  const gapU = (1 - padU * 2) / cols
  const gapV = (1 - padV * 2) / rows
  const winW = gapU * 0.55
  const winH = gapV * 0.5

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = padU + gapU * (c + 0.5) - winW / 2
      const v = padV + gapV * (r + 0.5) - winH / 2

      const baseX = x + u * faceW * dirX
      const baseY = y + u * faceW * dirY - h + v * h

      rects.push({
        x: baseX,
        y: baseY,
        w: winW * faceW * COS30 * 0.6,
        h: winH * h * 0.7,
      })
    }
  }

  return rects
}

const BUILDINGS: Building[] = [
  // ── Right cluster — tall skyscrapers ──
  { x: 1560, y: 780, w: 55, d: 48, h: 340, spire: true, setback: { inset: 10, extraH: 60 } },
  { x: 1650, y: 830, w: 48, d: 42, h: 260, roofBoxes: true },
  { x: 1480, y: 820, w: 42, d: 38, h: 200, helipad: true },
  { x: 1600, y: 740, w: 40, d: 36, h: 180, roofBoxes: true },
  { x: 1720, y: 800, w: 50, d: 44, h: 290, spire: true },
  { x: 1780, y: 860, w: 38, d: 34, h: 150 },

  // ── Bottom-right — mid-rise ──
  { x: 1340, y: 920, w: 52, d: 44, h: 160, roofBoxes: true },
  { x: 1240, y: 970, w: 44, d: 38, h: 120 },
  { x: 1420, y: 980, w: 36, d: 32, h: 100 },

  // ── Bottom-center — shorter buildings ──
  { x: 900, y: 1010, w: 46, d: 40, h: 90 },
  { x: 1020, y: 1030, w: 38, d: 34, h: 70 },
  { x: 780, y: 1040, w: 34, d: 30, h: 55 },

  // ── Center (Behind form on desktop, visible on mobile) ──
  { x: 860, y: 860, w: 48, d: 42, h: 210, setback: { inset: 10, extraH: 40 } },
  { x: 740, y: 920, w: 42, d: 38, h: 160, roofBoxes: true },
  { x: 960, y: 940, w: 38, d: 34, h: 140, helipad: true },
  { x: 800, y: 760, w: 40, d: 36, h: 110 },

  // ── Bottom-left — varied heights ──
  { x: 280, y: 1000, w: 48, d: 42, h: 130, roofBoxes: true },
  { x: 160, y: 1030, w: 40, d: 36, h: 90 },
  { x: 400, y: 1020, w: 36, d: 32, h: 75 },
  { x: 80,  y: 1050, w: 34, d: 30, h: 60 },

  // ── Top-right — distant small buildings ──
  { x: 1650, y: 380, w: 28, d: 24, h: 70 },
  { x: 1740, y: 340, w: 24, d: 20, h: 50 },
  { x: 1580, y: 420, w: 22, d: 18, h: 40 },

  // ── Left edge ──
  { x: 60,  y: 700, w: 44, d: 38, h: 170, setback: { inset: 8, extraH: 40 } },
  { x: 140, y: 740, w: 38, d: 34, h: 120 },

  // ── Left mid-rise cluster (Filling the gap) ──
  { x: 100, y: 550, w: 42, d: 36, h: 140, roofBoxes: true },
  { x: 220, y: 580, w: 48, d: 42, h: 190, helipad: true },
  { x: 180, y: 480, w: 38, d: 34, h: 110 },
  { x: 280, y: 640, w: 36, d: 30, h: 130 },
  { x: 80,  y: 620, w: 30, d: 26, h: 80 },

  // ── Top-left — distant ──
  { x: 120, y: 350, w: 26, d: 22, h: 60 },
  { x: 220, y: 380, w: 22, d: 18, h: 45 },
  { x: 60,  y: 420, w: 30, d: 26, h: 80, roofBoxes: true },
  { x: 160, y: 440, w: 34, d: 28, h: 95 },
  { x: 260, y: 450, w: 28, d: 24, h: 70 },
  { x: 10,  y: 480, w: 32, d: 28, h: 105 },
]

// Isometric trees — position, scale
const TREES = [
  { x: 500, y: 990, s: 1 },
  { x: 540, y: 1010, s: 0.8 },
  { x: 580, y: 995, s: 0.9 },
  { x: 620, y: 1015, s: 0.7 },
  { x: 660, y: 1000, s: 0.85 },
  { x: 1140, y: 950, s: 0.9 },
  { x: 1170, y: 965, s: 0.75 },
  { x: 1100, y: 940, s: 0.8 },
  // Left park
  { x: 320, y: 880, s: 0.9 },
  { x: 355, y: 895, s: 0.7 },
  { x: 290, y: 870, s: 0.8 },
  // Mid-left park
  { x: 180, y: 660, s: 0.8 },
  { x: 140, y: 630, s: 0.9 },
  { x: 230, y: 670, s: 0.6 },
  // Center park (Behind form on desktop, visible on mobile)
  { x: 880, y: 950, s: 0.8 },
  { x: 920, y: 970, s: 0.9 },
  { x: 850, y: 930, s: 0.7 },
  { x: 790, y: 980, s: 0.8 },
  // Top-left park
  { x: 80, y: 450, s: 0.6 },
  { x: 110, y: 460, s: 0.5 },
  { x: 50, y: 470, s: 0.7 },
  { x: 140, y: 490, s: 0.6 },
  // Distant top right
  { x: 1500, y: 390, s: 0.5 },
  { x: 1530, y: 400, s: 0.4 },
]

// Small vehicles on roads
const VEHICLES = [
  { x: 600, y: 970, rot: 0, color: "#7c8594" },
  { x: 1050, y: 945, rot: 0, color: "#8b7e72" },
  { x: 1350, y: 935, rot: 0, color: "#7c8594" },
  // Delivery van (slightly larger, brand color)
  { x: 850, y: 958, rot: 0, color: "#635bff", isVan: true },
  // Vehicles on left side
  { x: 260, y: 760, rot: 0, color: "#8b7e72" },
  { x: 150, y: 820, rot: 0, color: "#7c8594" },
]

export function RequestDeliveryWave() {
  return (
    <div className="rd-wave" aria-hidden="true">
      <svg
        className="rd-wave-svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="iso-wash" cx="0.5" cy="0.45" r="0.75">
            <stop offset="0%" stopColor="#f8f7f4" />
            <stop offset="100%" stopColor="#ffffff" />
          </radialGradient>
        </defs>

        {/* Base wash */}
        <rect width="1920" height="1080" fill="url(#iso-wash)" />

        {/* ── Sky Doodles (Planes, Trails, Clouds) ── */}
        <g stroke="#0a2540" fill="none" opacity="0.15" strokeLinecap="round" strokeLinejoin="round">
          {/* Looping flight trail (Left) */}
          <path d="M -50,180 C 150,120 280,320 420,180 C 520,80 680,200 820,140" strokeWidth="1.5" strokeDasharray="4 6" />
          
          {/* Paper airplane on trail */}
          <g transform="translate(820, 140) rotate(-15)">
            <polygon points="14,0 -14,10 -6,0 -14,-10" fill="#0a2540" opacity="0.05" strokeWidth="1.5" />
            <path d="M -6,0 L 14,0" strokeWidth="1.5" />
            <path d="M -6,0 L -2,4 L -8,6" strokeWidth="1.5" />
          </g>

          {/* Sweeping commercial route (Right) */}
          <path d="M 1150,80 C 1350,40 1600,280 1780,180 C 1880,120 1980,160 2050,130" strokeWidth="1.5" strokeDasharray="6 8" />
          
          {/* Minimalist plane doodle */}
          <g transform="translate(1780, 180) rotate(-30)">
            {/* Fuselage */}
            <path d="M 18,0 C 18,-4 10,-5 -15,-5 L -20,-2 C -22,-1 -22,1 -20,2 L -15,5 C 10,5 18,4 18,0 Z" strokeWidth="1.5" />
            {/* Wings */}
            <path d="M -2,-5 L -12,-18 L -6,-18 L 4,-5" strokeWidth="1.5" />
            <path d="M -2,5 L -12,18 L -6,18 L 4,5" strokeWidth="1.5" />
            {/* Tail */}
            <path d="M -16,-4 L -22,-10 L -18,-10 L -14,-4" strokeWidth="1.5" />
          </g>

          {/* Doodle Clouds */}
          <g strokeWidth="1.2">
            <path d="M 280,120 C 280,100 300,90 315,100 C 330,75 370,80 380,105 C 400,105 410,120 395,135 C 385,145 350,140 330,135 C 310,145 280,135 280,120" />
            <path d="M 1420,240 C 1420,225 1435,215 1450,225 C 1460,205 1490,210 1495,230 C 1510,230 1520,245 1505,255 C 1495,265 1465,260 1450,255 C 1435,265 1420,255 1420,240" />
            <path d="M 950,80 Q 960,65 975,75 Q 990,55 1010,70 Q 1030,75 1020,90 Q 1000,100 975,90 Q 950,100 950,80" />
          </g>

          {/* Playful connection arcs */}
          <path d="M 880,260 Q 1100,120 1350,210" strokeWidth="1" strokeDasharray="3 5" opacity="0.6" />
          <path d="M 1350,210 L 1340,205 M 1350,210 L 1342,215" strokeWidth="1" />
        </g>

        {/* ── Ground plane — faint isometric grid ── */}
        <g stroke="#e0ddd6" strokeWidth="0.6" opacity="0.4">
          {Array.from({ length: 16 }, (_, i) => {
            const offset = i * 120
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={-200 + offset * COS30}
                  y1={1080 - offset * SIN30}
                  x2={1920 + offset * COS30}
                  y2={1080 - offset * SIN30 - 1920 * 0.577}
                />
                <line
                  x1={2120 - offset * COS30}
                  y1={1080 - offset * SIN30}
                  x2={-200 - offset * COS30 + 1920}
                  y2={1080 - offset * SIN30 - 1920 * 0.577}
                />
              </g>
            )
          })}
        </g>

        {/* ── Ground shadows beneath buildings ── */}
        <g opacity="0.08">
          {BUILDINGS.map((b, i) => {
            const shadowW = b.w * 1.2
            const shadowD = b.d * 1.2
            const sx = b.x + b.h * 0.15
            const sy = b.y - b.h * 0.05
            const s0 = `${sx},${sy}`
            const s1 = `${sx + shadowW * COS30},${sy - shadowW * SIN30}`
            const s2 = `${sx + shadowW * COS30 - shadowD * COS30},${sy - shadowW * SIN30 - shadowD * SIN30}`
            const s3 = `${sx - shadowD * COS30},${sy - shadowD * SIN30}`
            return (
              <polygon
                key={`shadow-${i}`}
                points={`${s0} ${s1} ${s2} ${s3}`}
                fill="#1a1a2e"
              />
            )
          })}
        </g>

        {/* ── Buildings ── */}
        <g opacity="0.25">
          {[...BUILDINGS]
            .sort((a, b) => (a.y - a.h) - (b.y - b.h))
            .map((b, i) => {
              const polys = buildingPolys(b)
              const isTall = b.h >= 150
              const wins = isTall
                ? [
                    ...windowRows(b, "right", 3, Math.floor(b.h / 40)),
                    ...windowRows(b, "left", 2, Math.floor(b.h / 40)),
                  ]
                : b.h >= 70
                  ? [
                      ...windowRows(b, "right", 2, Math.floor(b.h / 35)),
                      ...windowRows(b, "left", 1, Math.floor(b.h / 35)),
                    ]
                  : []

              return (
                <g key={`bldg-${i}`}>
                  {/* Faces */}
                  <polygon points={polys.left} fill="#9ca3af" />
                  <polygon points={polys.right} fill="#b0b7c3" />
                  <polygon points={polys.top} fill="#d1d5db" />
                  {/* Edges */}
                  <polygon points={polys.left} fill="none" stroke="#8891a0" strokeWidth="0.8" />
                  <polygon points={polys.right} fill="none" stroke="#8891a0" strokeWidth="0.8" />
                  <polygon points={polys.top} fill="none" stroke="#8891a0" strokeWidth="0.8" />

                  {/* Windows */}
                  {wins.map((win, j) => (
                    <rect
                      key={`win-${i}-${j}`}
                      x={win.x}
                      y={win.y}
                      width={win.w}
                      height={win.h}
                      fill="#6b7280"
                      opacity="0.5"
                    />
                  ))}

                  {/* Setback / terrace upper section */}
                  {b.setback && (() => {
                    const inset = b.setback.inset
                    const upper: Building = {
                      x: b.x,
                      y: b.y - b.h,
                      w: b.w - inset,
                      d: b.d - inset,
                      h: b.setback.extraH,
                    }
                    const up = buildingPolys(upper)
                    return (
                      <g>
                        <polygon points={up.left} fill="#a0a7b0" />
                        <polygon points={up.right} fill="#b8bfc8" />
                        <polygon points={up.top} fill="#d8dce2" />
                        <polygon points={up.left} fill="none" stroke="#8891a0" strokeWidth="0.6" />
                        <polygon points={up.right} fill="none" stroke="#8891a0" strokeWidth="0.6" />
                        <polygon points={up.top} fill="none" stroke="#8891a0" strokeWidth="0.6" />
                      </g>
                    )
                  })()}

                  {/* Antenna / spire */}
                  {b.spire && (() => {
                    const [cx, cy] = polys.topCenter
                    const spireH = b.h * 0.18
                    return (
                      <g>
                        <line
                          x1={cx} y1={cy}
                          x2={cx} y2={cy - spireH}
                          stroke="#8891a0" strokeWidth="1.5" strokeLinecap="round"
                        />
                        {/* Blinking light */}
                        <circle cx={cx} cy={cy - spireH} r="2" fill="#e8453c" opacity="0.8" />
                        {/* Cross-arm */}
                        <line
                          x1={cx - 4} y1={cy - spireH * 0.6}
                          x2={cx + 4} y2={cy - spireH * 0.6}
                          stroke="#8891a0" strokeWidth="0.8"
                        />
                      </g>
                    )
                  })()}

                  {/* Helipad */}
                  {b.helipad && (() => {
                    const [cx, cy] = polys.topCenter
                    return (
                      <g>
                        <ellipse cx={cx} cy={cy} rx={b.w * 0.25} ry={b.w * 0.12} fill="none" stroke="#8891a0" strokeWidth="0.8" />
                        <text x={cx} y={cy + 2} textAnchor="middle" fontSize="6" fill="#8891a0" fontWeight="bold">H</text>
                      </g>
                    )
                  })()}

                  {/* Rooftop AC/mechanical boxes */}
                  {b.roofBoxes && (() => {
                    const [cx, cy] = polys.topCenter
                    return (
                      <g>
                        {/* Small box 1 */}
                        <rect x={cx - 6} y={cy - 5} width="5" height="4" fill="#b0b7c3" stroke="#8891a0" strokeWidth="0.5" />
                        {/* Small box 2 */}
                        <rect x={cx + 2} y={cy - 4} width="4" height="3" fill="#b8bfc8" stroke="#8891a0" strokeWidth="0.5" />
                        {/* Vent */}
                        <rect x={cx - 2} y={cy - 3} width="3" height="2" fill="#c8ced6" stroke="#8891a0" strokeWidth="0.4" />
                      </g>
                    )
                  })()}
                </g>
              )
            })}
        </g>

        {/* ── Construction crane (right cluster) ── */}
        <g opacity="0.20" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round">
          {/* Vertical mast */}
          <line x1="1820" y1="800" x2="1820" y2="340" />
          {/* Horizontal jib */}
          <line x1="1720" y1="345" x2="1920" y2="345" />
          {/* Counter-jib */}
          <line x1="1820" y1="345" x2="1770" y2="345" />
          {/* Diagonal supports */}
          <line x1="1820" y1="380" x2="1780" y2="345" />
          <line x1="1820" y1="380" x2="1860" y2="345" />
          {/* Cable to hook */}
          <line x1="1880" y1="345" x2="1880" y2="420" stroke="#f59e0b" strokeWidth="0.8" />
          {/* Hook */}
          <path d="M 1876,420 C 1876,426 1884,426 1884,420" fill="none" strokeWidth="1" />
          {/* Top tie cables */}
          <line x1="1820" y1="330" x2="1720" y2="345" strokeWidth="0.7" />
          <line x1="1820" y1="330" x2="1920" y2="345" strokeWidth="0.7" />
          {/* Apex */}
          <line x1="1820" y1="345" x2="1820" y2="330" strokeWidth="1" />
          {/* Cross-bracing on mast */}
          {Array.from({ length: 8 }, (_, i) => {
            const yTop = 380 + i * 50
            return (
              <g key={`brace-${i}`}>
                <line x1="1817" y1={yTop} x2="1823" y2={yTop + 50} strokeWidth="0.5" />
                <line x1="1823" y1={yTop} x2="1817" y2={yTop + 50} strokeWidth="0.5" />
              </g>
            )
          })}
        </g>

        {/* ── Isometric trees ── */}
        <g opacity="0.20">
          {TREES.map((t, i) => (
            <g key={`tree-${i}`} transform={`translate(${t.x}, ${t.y}) scale(${t.s})`}>
              {/* Trunk */}
              <line x1="0" y1="0" x2="0" y2="-14" stroke="#8b7355" strokeWidth="2" strokeLinecap="round" />
              {/* Canopy — isometric diamond */}
              <polygon
                points="0,-28 12,-20 0,-12 -12,-20"
                fill="#6b9c5a"
              />
              {/* Canopy highlight */}
              <polygon
                points="0,-28 12,-20 0,-20"
                fill="#82b56a"
                opacity="0.6"
              />
              {/* Ground shadow */}
              <ellipse cx="3" cy="2" rx="8" ry="3" fill="#1a1a2e" opacity="0.15" />
            </g>
          ))}
        </g>

        {/* ── Small park benches (near tree clusters) ── */}
        <g opacity="0.18" stroke="#8b7355" fill="none" strokeWidth="1" strokeLinecap="round">
          {/* Bench 1 */}
          <g transform="translate(555, 1008)">
            <line x1="-6" y1="0" x2="6" y2="0" />
            <line x1="-5" y1="0" x2="-5" y2="3" />
            <line x1="5" y1="0" x2="5" y2="3" />
            <line x1="-7" y1="-3" x2="7" y2="-3" strokeWidth="1.2" />
          </g>
          {/* Bench 2 */}
          <g transform="translate(330, 892)">
            <line x1="-6" y1="0" x2="6" y2="0" />
            <line x1="-5" y1="0" x2="-5" y2="3" />
            <line x1="5" y1="0" x2="5" y2="3" />
            <line x1="-7" y1="-3" x2="7" y2="-3" strokeWidth="1.2" />
          </g>
        </g>

        {/* ── Vehicles on roads ── */}
        <g opacity="0.20">
          {VEHICLES.map((v, i) => {
            const isVan = "isVan" in v && v.isVan
            const vw = isVan ? 18 : 12
            const vh = isVan ? 8 : 6
            return (
              <g key={`veh-${i}`} transform={`translate(${v.x}, ${v.y})`}>
                {/* Body */}
                <rect
                  x={-vw / 2} y={-vh}
                  width={vw} height={vh}
                  rx="2"
                  fill={v.color}
                />
                {/* Windshield */}
                <rect
                  x={vw / 2 - 4} y={-vh + 1}
                  width="3" height={vh - 2}
                  rx="0.5"
                  fill="#d1d5db"
                  opacity="0.7"
                />
                {/* Shadow */}
                <ellipse cx="1" cy="2" rx={vw * 0.45} ry="2" fill="#1a1a2e" opacity="0.15" />
              </g>
            )
          })}
        </g>

        {/* ── Road crosswalks ── */}
        <g fill="#c8cdd3" opacity="0.16">
          {/* Crosswalk near bottom-center */}
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={`cw1-${i}`} x={730 + i * 8} y="1048" width="4" height="14" rx="0.5" />
          ))}
          {/* Crosswalk near right */}
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={`cw2-${i}`} x={1290 + i * 8} y="975" width="4" height="14" rx="0.5" />
          ))}
        </g>

        {/* ── Street lamps ── */}
        <g opacity="0.16" stroke="#6b7280" fill="none" strokeWidth="1" strokeLinecap="round">
          {[
            [460, 1005],
            [700, 1035],
            [1100, 960],
            [1300, 940],
          ].map(([lx, ly], i) => (
            <g key={`lamp-${i}`}>
              <line x1={lx} y1={ly!} x2={lx} y2={ly! - 22} />
              <line x1={lx} y1={ly! - 22} x2={lx! + 6} y2={ly! - 22} />
              <circle cx={lx! + 6} cy={ly! - 21} r="2" fill="#fbbf24" opacity="0.3" />
            </g>
          ))}
        </g>

        {/* ── Delivery route on ground plane ── */}
        <path
          d="M 200,980 C 400,950 600,970 800,950 C 1000,930 1200,940 1400,920 C 1500,910 1560,880 1620,840"
          fill="none"
          stroke="#635bff"
          strokeWidth="3"
          strokeDasharray="10 5"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d="M 200,980 C 400,950 600,970 800,950 C 1000,930 1200,940 1400,920 C 1500,910 1560,880 1620,840"
          fill="none"
          stroke="#635bff"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.08"
        />

        {/* ── Pickup pin ── */}
        <g transform="translate(200, 980)" opacity="0.7">
          <circle cx="0" cy="-22" r="8" fill="#635bff" />
          <circle cx="0" cy="-22" r="3.5" fill="#ffffff" />
          <path d="M 0,-14 L 0,-3" stroke="#635bff" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="0" cy="-1" rx="4" ry="1.5" fill="#635bff" opacity="0.2" />
        </g>

        {/* ── Dropoff pin ── */}
        <g transform="translate(1620, 840)" opacity="0.7">
          <circle cx="0" cy="-22" r="8" fill="#e8453c" />
          <circle cx="0" cy="-22" r="3.5" fill="#ffffff" />
          <path d="M 0,-14 L 0,-3" stroke="#e8453c" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="0" cy="-1" rx="4" ry="1.5" fill="#e8453c" opacity="0.2" />
        </g>

        {/* ── Faint package icon — top-right ── */}
        <g transform="translate(1850, 160)" opacity="0.12" stroke="#0a2540" fill="none" strokeWidth="2" strokeLinejoin="round">
          <rect x="0" y="16" width="48" height="36" rx="2" />
          <path d="M 0,16 L 10,0 L 38,0 L 48,16" />
          <line x1="24" y1="0" x2="24" y2="16" />
          <line x1="24" y1="16" x2="24" y2="40" />
        </g>

        {/* ── Faint package icon — left ── */}
        <g transform="translate(40, 500) scale(0.7)" opacity="0.12" stroke="#0a2540" fill="none" strokeWidth="2" strokeLinejoin="round">
          <rect x="0" y="16" width="48" height="36" rx="2" />
          <path d="M 0,16 L 10,0 L 38,0 L 48,16" />
          <line x1="24" y1="0" x2="24" y2="16" />
          <line x1="24" y1="16" x2="24" y2="40" />
        </g>
      </svg>
    </div>
  )
}
