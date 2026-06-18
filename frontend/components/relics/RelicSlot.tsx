'use client'

import { useState } from 'react'
import {
  Settings,
  Zap,
  Search,
  Moon,
  CloudLightning,
  Spade,
  Flame,
  Cpu,
  Waves,
  ShieldCheck,
  Repeat,
  Gem,
  BatteryCharging,
  CircuitBoard,
  Fingerprint,
  Anchor,
  Diamond,
  Package
} from 'lucide-react'
import type { RelicDef } from '@/lib/relics'
import { RARITY_STYLES } from '@/lib/relics'
import { useRelicStore } from '@/app/stores/relicStore'

const ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  Settings,
  Zap,
  Search,
  Moon,
  CloudLightning,
  Spade,
  Flame,
  Cpu,
  Waves,
  ShieldCheck,
  Repeat,
  Gem,
  BatteryCharging,
  CircuitBoard,
  Fingerprint,
  Anchor,
  Diamond
}

export default function RelicSlot({
  relic: propRelic,
  readonly = false,
  size = 'md',
  align = 'center'
}: {
  relic?: RelicDef | null
  readonly?: boolean
  size?: 'sm' | 'md'
  align?: 'left' | 'right' | 'center'
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const equippedRelic = useRelicStore((s) => s.equippedRelic)
  const setDrawerOpen = useRelicStore((s) => s.setDrawerOpen)
  const relic = propRelic !== undefined ? propRelic : equippedRelic

  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const iconSize = size === 'sm' ? 16 : 20

  if (!relic) {
    return (
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
        {!readonly && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
          </div>
        )}
      </button>
    )
  }

  const styles = RARITY_STYLES[relic.rarity]
  const Icon = ICON_MAP[relic.icon] ?? Package

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <button
          onClick={readonly ? undefined : () => setDrawerOpen(true)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`
            relative ${dim} rounded-xl flex items-center justify-center shrink-0
            bg-gray-950 border-2 ${styles.border}
            ${!readonly ? 'hover:scale-110 hover:border-gray-600 active:scale-95 transition-all cursor-pointer' : 'cursor-default'}
          `}
        >
          <Icon size={iconSize} className={styles.text} />
        </button>

        {showTooltip && (
          <div
            className={`absolute bottom-full mb-3 z-50 w-52 p-3 bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none ${
              align === 'left'
                ? 'left-0'
                : align === 'right'
                  ? 'right-0'
                  : 'left-1/2 -translate-x-1/2'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={14} className={styles.text} />
              <span
                className={`text-[10px] font-black uppercase tracking-wider ${styles.text}`}
              >
                {relic.name}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-snug">
              {relic.effect}
            </p>
            <div
              className={`absolute top-full w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-gray-950 ${
                align === 'left'
                  ? 'left-4'
                  : align === 'right'
                    ? 'right-4'
                    : 'left-1/2 -translate-x-1/2'
              }`}
            />
          </div>
        )}
      </div>
      
      {relic.threshold !== undefined && (
        <span
          className={`text-[11px] font-black tabular-nums tracking-tighter leading-none text-black opacity-80`}
        >
          {relic.counter || 0}/{relic.threshold}
        </span>
      )}
    </div>
  )
}
