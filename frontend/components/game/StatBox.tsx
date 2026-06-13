import { formatPoints } from "@/lib/format"

export function StatBox({
  label,
  value,
  color = 'text-gray-900',
  useK = false
}: {
  label: string
  value: string | number
  color?: string
  useK?: boolean
}) {
  const isPointValue =
    typeof value === 'string' && /^\d/.test(value) && !value.includes('%')
  const { display, full, capped } = isPointValue
    ? formatPoints(value, useK)
    : { display: String(value), full: String(value), capped: false }

  return (
    <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-1 sm:p-2 py-2 sm:py-6 flex flex-col items-center justify-center text-center transition-all overflow-visible relative">
      <p
        title={capped ? full : undefined}
        style={{ position: 'relative' }}
        className={`${display.toString().length >= 8 ? 'text-[13px] tracking-tighter [@media(min-width:375px)]:text-lg [@media(min-width:375px)]:tracking-tight' : 'text-[15px] tracking-tight [@media(min-width:375px)]:text-lg'} font-black ${color} leading-tight whitespace-nowrap w-full px-0.5`}
      >
        {display}
      </p>
      <p className="text-[8px] sm:text-[10px] text-black/40 mt-0.5 sm:mt-2 uppercase font-black tracking-widest">
        {label}
      </p>
    </div>
  )
}
