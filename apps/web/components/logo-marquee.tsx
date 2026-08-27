const logos = [
  {
    name: "Figma",
    mark: (
      <svg viewBox="0 0 38 38" className="h-7 w-7" aria-hidden="true">
        <path fill="#F24E1E" d="M19 19a6.33 6.33 0 0 1 6.33-6.33H25.4A6.33 6.33 0 0 1 19 19Z" />
        <path fill="#FF7262" d="M12.67 31.67A6.33 6.33 0 0 0 19 25.33v6.34a6.33 6.33 0 0 1-6.33 0Z" />
        <path fill="#A259FF" d="M12.67 19A6.33 6.33 0 0 0 19 25.33V12.67A6.33 6.33 0 0 0 12.67 19Z" />
        <path fill="#1ABCFE" d="M19 12.67A6.33 6.33 0 0 0 12.67 6.33H19v6.34Z" />
        <path fill="#0ACF83" d="M25.33 12.67A6.33 6.33 0 0 0 19 6.33v6.34h6.33Z" />
      </svg>
    ),
  },
  {
    name: "Woo",
    mark: (
      <span className="text-[22px] font-bold leading-none tracking-[-0.04em] text-[#7F54B3]">
        woo
      </span>
    ),
  },
  {
    name: "Vercel",
    mark: (
      <span className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-[#0A0A0A]">
        <svg viewBox="0 0 16 14" className="h-3.5 w-4" aria-hidden="true">
          <path fill="currentColor" d="M8 0 16 14H0L8 0Z" />
        </svg>
        Vercel
      </span>
    ),
  },
  {
    name: "Uber",
    mark: (
      <span className="text-[18px] font-semibold tracking-[-0.03em] text-[#000000]">
        Uber
      </span>
    ),
  },
  {
    name: "Anthropic",
    mark: (
      <span className="text-[13px] font-semibold tracking-[0.04em] text-[#141413]">
        ANTHROPIC
      </span>
    ),
  },
  {
    name: "Brightwheel",
    mark: (
      <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#1F6FEB]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <circle cx="12" cy="7" r="3.2" fill="#FF6B6B" />
          <circle cx="17.2" cy="12" r="3.2" fill="#FFD166" />
          <circle cx="12" cy="17" r="3.2" fill="#06D6A0" />
          <circle cx="6.8" cy="12" r="3.2" fill="#4D96FF" />
        </svg>
        brightwheel
      </span>
    ),
  },
  {
    name: "Cursor",
    mark: (
      <span className="inline-flex items-center gap-2 text-[14px] font-semibold tracking-[0.08em] text-[#0A0A0A]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="#8B8B8B"
            d="M4.5 8.2 12 4.5l7.5 3.7v7.6L12 19.5 4.5 15.8V8.2Z"
          />
          <path
            fill="#C8C8C8"
            d="M12 4.5v15l7.5-3.7V8.2L12 4.5Z"
          />
        </svg>
        CURSOR
      </span>
    ),
  },
  {
    name: "OpenAI",
    mark: (
      <span className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-[#0A0A0A]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.056 6.056 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 1.442a5.985 5.985 0 0 0-3.998 2.898 6.056 6.056 0 0 0 .753 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A6.066 6.066 0 0 0 19.019 22.56a5.989 5.989 0 0 0 3.998-2.898 6.057 6.057 0 0 0-.753-7.098 5.99 5.99 0 0 0 .018-2.743Zm-9.063 12.21a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.575a4.504 4.504 0 0 1-4.494 4.502Zm-9.61-4.035a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.368v2.332a.08.08 0 0 1-.033.062L7.74 19.897a4.5 4.5 0 0 1-4.13-1.9ZM2.34 7.895a4.507 4.507 0 0 1 2.353-1.973l-.002.122v5.529a.781.781 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872Zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.578a.79.79 0 0 0-.41-.678Zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66Zm-12.64 4.415L7.28 11.97V9.233l3.027-1.746 3.032 1.745v2.733l-3.03 1.745Zm1.388-8.04L9.4 5.978l4.768 2.791 4.769-2.756-2.02-1.17a.076.076 0 0 0-.07 0l-4.83 2.787-.002.001Z"
          />
        </svg>
        OpenAI
      </span>
    ),
  },
] as const

function LogoTrack() {
  return (
    <ul className="logo-marquee-track flex shrink-0 items-center gap-14 px-7 md:gap-16">
      {logos.map((logo) => (
        <li
          key={logo.name}
          className="flex h-10 shrink-0 items-center justify-center"
        >
          <span className="sr-only">{logo.name}</span>
          {logo.mark}
        </li>
      ))}
    </ul>
  )
}

export function LogoMarquee() {
  return (
    <section
      className="relative z-20 flex min-h-[88px] items-center overflow-hidden"
      aria-label="Trusted by"
    >
      <div className="logo-marquee-fade pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent md:w-16" />
      <div className="logo-marquee-fade pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent md:w-16" />
      <div className="logo-marquee flex w-max items-center">
        <LogoTrack />
        <LogoTrack />
      </div>
    </section>
  )
}
