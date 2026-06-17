'use client'

import { useState, useRef, useEffect } from 'react'
import { getUnlockedTiers } from '@/lib/format'

export function StyleSelect({
  value,
  allTimePeak,
  onChange
}: {
  value: string | null
  allTimePeak: bigint
  onChange: (val: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const tiers = getUnlockedTiers(allTimePeak)
  const selected = tiers.find((t) => t.cls === value) ?? null

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative overflow-hidden isolate w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 text-[11px] font-black uppercase tracking-wider focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none flex items-center justify-between"
      >
        <span
          className={`relative z-10 ${selected ? selected.cls : 'text-gray-400'}`}
        >
          {selected ? selected.label : '- Select a style -'}
        </span>
        <span className="relative z-10 text-gray-400 text-[10px]">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
            className="w-full px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider text-gray-400 hover:bg-gray-50 transition-colors"
          >
            Select a style
          </button>
          {tiers.map((tier) => (
            <button
              key={tier.cls}
              type="button"
              onClick={() => {
                onChange(tier.cls)
                setOpen(false)
              }}
              className={`relative overflow-hidden isolate w-full px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-wider hover:bg-gray-50 transition-colors ${value === tier.cls ? 'bg-gray-50' : ''}`}
            >
              <span className={`relative z-10 ${tier.cls}`}>{tier.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
