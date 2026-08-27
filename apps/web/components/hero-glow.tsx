/**
 * Desktop: soft right-side blob.
 * Mobile: Apple-style liquid glass — soft color blobs + frosted discs.
 */
export function HeroGlow() {
  return (
    <>
      <div
        className="hero-glow pointer-events-none absolute top-0 right-0 z-[5] hidden md:block"
        aria-hidden="true"
      >
        <svg
          className="hero-glow-blob h-full w-full"
          viewBox="0 0 640 640"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="hero-ribbon" x1="0.2" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffd4a8" />
              <stop offset="55%" stopColor="#ffc2d4" />
              <stop offset="100%" stopColor="#ffe0ec" />
            </linearGradient>
            <linearGradient id="hero-ribbon-hot" x1="0.3" y1="0.1" x2="1" y2="0.9">
              <stop offset="0%" stopColor="#ffc9a0" />
              <stop offset="100%" stopColor="#ffd0e0" />
            </linearGradient>
            <filter id="hero-ribbon-blur" x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="48" />
            </filter>
          </defs>

          <g className="hero-glow-layer hero-glow-layer-a">
            <ellipse
              cx="430"
              cy="160"
              rx="230"
              ry="260"
              fill="url(#hero-ribbon)"
              filter="url(#hero-ribbon-blur)"
              opacity="0.85"
            />
          </g>
          <g className="hero-glow-layer hero-glow-layer-b">
            <ellipse
              cx="490"
              cy="120"
              rx="170"
              ry="200"
              fill="url(#hero-ribbon-hot)"
              filter="url(#hero-ribbon-blur)"
              opacity="0.65"
            />
          </g>
        </svg>
      </div>

      <div
        className="liquid-glass pointer-events-none absolute inset-x-0 top-0 z-[5] h-[540px] overflow-hidden md:hidden"
        aria-hidden="true"
      >
        <div className="liquid-glass-field">
          <div className="liquid-glass-blob liquid-glass-blob-a" />
          <div className="liquid-glass-blob liquid-glass-blob-b" />
          <div className="liquid-glass-blob liquid-glass-blob-c" />
          <div className="liquid-glass-lens liquid-glass-lens-a" />
          <div className="liquid-glass-lens liquid-glass-lens-b" />
          <div className="liquid-glass-dot" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white to-transparent" />
      </div>
    </>
  )
}
