import { Geist_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils";

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Diatel — Delivery across Ghana",
  description:
    "Request, track, and manage deliveries with Diatel — same-day pickup and drop-off across Accra and beyond.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("bg-white antialiased font-sans", fontMono.variable)}
    >
      <body className="min-h-svh bg-white font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
