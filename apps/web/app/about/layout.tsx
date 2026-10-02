import { AboutShell } from "@/components/about-shell"

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AboutShell>{children}</AboutShell>
}
