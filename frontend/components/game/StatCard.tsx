interface StatCardProps {
  label: string
  value: number
  color?: string
}

export function StatCard({ label, value, color = 'text-gray-900' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
