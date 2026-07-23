'use client'

import { useState } from 'react'
import {
  Package,
} from 'lucide-react'
import type { RelicDef } from '@/lib/relics'
import { RARITY_STYLES } from '@/lib/relics'
import { useRelicStore } from '@/app/stores/relicStore'
import { ICON_MAP } from '@/lib/relicIcons'

export default function RelicSlot({
  relic: propRelic,
  readonly = false,
  size = 'md',
  align = 'center',
  totalSlots = 3
}: {
  relic?: RelicDef | null
  readonly?: boolean
  size?: 'sm' | 'md'
  align?: 'left' | 'right' | 'center'
  totalSlots?: number
}) {
  const equippedRelics = useRelicStore((s) => s.equippedRelics)
  const setDrawerOpen = useRelicStore((s) => s.setDrawerOpen)

  const firstActiveRelic = equippedRelics.find(Boolean) || null
  const relic = propRelic !== undefined ? propRelic : firstActiveRelic

  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const iconSize = size === 'sm' ? 16 : 20

  const filledCount = equippedRelics.filter(Boolean).length
  const capacityLabel = `${filledCount}/${totalSlots}`

  if (!relic) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={readonly ? undefined : () => setDrawerOpen(true)}
          className={`
            relative ${dim} rounded-xl flex items-center justify-center shrink-0
            bg-gray-50 border-2 border-dashed border-gray-200
            ${!readonly ? 'hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group' : 'cursor-default'}
          `}
        >
          <Package
            size={iconSize}
            className="text-gray-300 group-hover:text-indigo-300 transition-colors"
          />
        </button>
        <span className="text-[10.5px] font-black text-gray-450 leading-none tabular-nums tracking-wider mt-0.5">
          {capacityLabel}
        </span>
      </div>
    )
  }

  const styles = RARITY_STYLES[relic.rarity]
  const Icon = ICON_MAP[relic.icon] ?? Package

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative">
        <button
          onClick={readonly ? undefined : () => setDrawerOpen(true)}
          className={`
            relative ${dim} rounded-xl flex items-center justify-center shrink-0
            bg-gray-950 border-2 ${styles.border}
            ${!readonly ? 'hover:scale-110 hover:border-gray-600 active:scale-95 transition-all cursor-pointer' : 'cursor-default'}
          `}
        >
          <Icon size={iconSize} className={styles.text} />
        </button>
      </div>

      {/* Capacity, always visible even when relic equipped */}
      <span
        className={`text-[10.5px] font-black leading-none tabular-nums tracking-wider mt-0.5 ${styles.text}`}
      >
        {capacityLabel}
      </span>

      {/* Charge counter for threshold relics */}
      {relic.threshold !== undefined && (
        <span className="text-[10px] font-black tabular-nums tracking-tighter leading-none text-black opacity-80">
          {relic.counter ?? 0}/{relic.threshold}
        </span>
      )}
    </div>
  )
}
