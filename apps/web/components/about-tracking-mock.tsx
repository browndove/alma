const stages = [
  { label: "Accepted", state: "done" },
  { label: "Picked up", state: "done" },
  { label: "Delivering", state: "current" },
  { label: "Delivered", state: "pending" },
] as const

function CheckGlyph() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PhoneGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5.6 2.5H4a1.5 1.5 0 0 0-1.5 1.6c.4 5 4.4 9 9.4 9.4A1.5 1.5 0 0 0 13.5 12v-1.6l-2.6-1-1.3 1.3a7.6 7.6 0 0 1-3.3-3.3l1.3-1.3-1-2.6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RouteMap() {
  return (
    <svg
      className="tm-map-svg"
      viewBox="0 0 400 150"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g stroke="#e3e9f0" strokeWidth="10" strokeLinecap="round" fill="none">
        <path d="M-10 118 H410" />
        <path d="M-10 40 C 120 30, 260 70, 410 22" />
        <path d="M150 -10 V160" />
        <path d="M300 -10 C 290 60, 320 100, 310 160" />
      </g>
      <g stroke="#edf1f6" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M-10 80 H410" />
        <path d="M70 -10 V160" />
        <path d="M230 -10 V160" />
        <path d="M360 -10 V160" />
      </g>

      <path
        d="M44 118 C 110 118, 140 64, 214 64"
        stroke="#fe5200"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M214 64 C 290 64, 316 36, 356 36"
        stroke="#fe5200"
        strokeOpacity="0.45"
        strokeWidth="3"
        strokeDasharray="2 7"
        strokeLinecap="round"
        fill="none"
      />

      <circle cx="44" cy="118" r="6" fill="#0a2540" />
      <circle cx="44" cy="118" r="2.4" fill="#ffffff" />

      <g transform="translate(356 36)">
        <path
          d="M0 4c0-6.6 9-11 9-18a9 9 0 0 0-18 0c0 7 9 11.4 9 18Z"
          fill="#fe5200"
          transform="translate(0 -6)"
        />
        <circle cx="0" cy="-20" r="3.2" fill="#ffffff" />
      </g>

      <circle className="tm-rider-pulse" cx="214" cy="64" r="14" fill="#fe5200" />
      <circle cx="214" cy="64" r="8" fill="#ffffff" />
      <circle cx="214" cy="64" r="5" fill="#fe5200" />
    </svg>
  )
}

export function AboutTrackingMock() {
  return (
    <div className="about-hero-mock" aria-hidden="true">
      <div className="tm-wrap">
        <div className="tm-toast">
          <span className="tm-toast-icon">
            <CheckGlyph />
          </span>
          <div>
            <strong>Picked up</strong>
            <span>Accra Mall · 4 min ago</span>
          </div>
        </div>

        <div className="tm-card">
          <div className="tm-head">
            <span className="tm-id">DT-94821</span>
            <span className="tm-live">
              <span className="tm-live-dot" />
              Live
            </span>
          </div>

          <div className="tm-eta">
            <span className="tm-eta-label">Arriving in</span>
            <strong className="tm-eta-value">18 min</strong>
            <span className="tm-route">Accra Mall → Oxford Street, Osu</span>
          </div>

          <div className="tm-map">
            <RouteMap />
          </div>

          <ol className="tm-stages">
            {stages.map((stage) => (
              <li key={stage.label} className={`tm-stage is-${stage.state}`}>
                <span className="tm-stage-dot">
                  {stage.state === "done" ? <CheckGlyph /> : null}
                </span>
                <span className="tm-stage-label">{stage.label}</span>
              </li>
            ))}
          </ol>

          <div className="tm-rider">
            <span className="tm-avatar">KA</span>
            <div className="tm-rider-copy">
              <strong>Kwame Asante</strong>
              <span>Express bike · Same-day</span>
            </div>
            <span className="tm-call">
              <PhoneGlyph />
            </span>
          </div>

          <div className="tm-pin">
            <span>Handover PIN</span>
            <span className="tm-pin-digits">
              {"4821".split("").map((digit, index) => (
                <span key={index}>{digit}</span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
