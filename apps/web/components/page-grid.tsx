export function PageGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-grid">
      <div className="page-grid-lines" aria-hidden="true">
        <span className="v-outer-left" />
        <span className="v-outer-right" />
      </div>
      {children}
    </div>
  )
}

export function GridRule() {
  return <div className="page-grid-h" aria-hidden="true" />
}
