import { ServicesShell } from "@/components/services-shell"

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ServicesShell>{children}</ServicesShell>
}
