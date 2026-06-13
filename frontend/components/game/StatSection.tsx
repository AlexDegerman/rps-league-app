export function StatSection({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/30 mb-3 ml-1">
        {label}
      </h3>
      <div className="grid grid-cols-3 gap-2">{children}</div>
    </div>
  )
}
