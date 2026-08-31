"use client"

import type { ReactNode } from "react"

function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export { ThemeProvider }
