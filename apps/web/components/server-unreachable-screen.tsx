"use client"

export function ServerUnreachableScreen() {
  return (
    <main className="su-page">
      <div className="su-card">
        <div className="su-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="44" height="44">
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M16 40c4.5-6 10-9 16-9s11.5 3 16 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M22 33c3.2-4 6.8-6 10-6s6.8 2 10 6M28.5 26.5c1.1-1.2 2.3-1.8 3.5-1.8s2.4.6 3.5 1.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="32" cy="44.5" r="2.2" fill="currentColor" />
            <path
              d="M20 18 46 46"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="su-title">Server Unreachable</h1>
        <p className="su-copy">
          This page can’t be opened because the server cannot be found.
        </p>
        <button
          type="button"
          className="su-retry"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    </main>
  )
}
