'use client'

import { useMemo } from 'react'
import { Package, AlertTriangle } from 'lucide-react'
import { useRelicStore } from '@/app/stores/relicStore'
import { RARITY_STYLES, ICON_MAP, getRelicCategory } from '@/constants/relics'
import { RelicDef, LoadoutType } from '@/types/relics'

export default function RelicSlot({
  relic: propRelic,
  readonly = false,
  size = 'md',
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
  const loadouts = useRelicStore((s) => s.loadouts)
  const inventory = useRelicStore((s) => s.inventory)

  const firstActiveRelic = equippedRelics.find(Boolean) || null
  const relic = propRelic !== undefined ? propRelic : firstActiveRelic

  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const iconSize = size === 'sm' ? 16 : 20

  const filledCount = equippedRelics.filter(Boolean).length
  const capacityLabel = `${filledCount}/${totalSlots}`

  const unassignedLoadouts = useMemo(() => {
    const labels: Record<LoadoutType, string> = {
      prediction: 'Prediction',
      world_boss: 'World Boss',
      neon_paradise: 'Neon Paradise'
    }
    const types: LoadoutType[] = ['prediction', 'world_boss', 'neon_paradise']
    return types
      .filter((type) => {
        const slots = loadouts[type] ?? [null, null, null]
        const hasEmptySlot = slots.some((r) => r === null)
        if (!hasEmptySlot) return false

        const equippedKeys = new Set(slots.filter(Boolean).map((r) => r!.key))
        return inventory.some(
          (r) =>
            (r.category ?? getRelicCategory(r.key)) === type &&
            !equippedKeys.has(r.key)
        )
      })
      .map((t) => labels[t])
  }, [loadouts, inventory])

  const renderWarningBadge = () => {
    if (readonly || unassignedLoadouts.length === 0) return null

    return (
      <div
        style={{
          position: 'absolute',
          top: -6,
          right: -6,
          bottom: 'auto',
          left: 'auto',
          zIndex: 30
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setDrawerOpen(true)
          }}
          className="tooltip-right w-4 h-4 rounded-full bg-amber-500 text-gray-950 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          title={`Equippable in: ${unassignedLoadouts.join(', ')}`}
        >
          <AlertTriangle size={10} className="stroke-3" />
        </button>
      </div>
    )
  }

  const styles = relic ? RARITY_STYLES[relic.rarity] : null
  const Icon = relic ? (ICON_MAP[relic.icon] ?? Package) : Package

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative">
        <button
          onClick={readonly ? undefined : () => setDrawerOpen(true)}
          className={`
            ${dim} rounded-xl flex items-center justify-center shrink-0 border-2 transition-all
            ${
              relic
                ? `bg-gray-950 ${styles!.border} ${!readonly ? 'hover:scale-110 hover:border-gray-600 active:scale-95 cursor-pointer' : 'cursor-default'}`
                : `bg-gray-50 border-dashed border-gray-200 ${!readonly ? 'hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer group' : 'cursor-default'}`
            }
          `}
        >
          {relic ? (
            <Icon size={iconSize} className={styles!.text} />
          ) : (
            <Package
              size={iconSize}
              className="text-gray-300 group-hover:text-indigo-300 transition-colors"
            />
          )}
        </button>
        {renderWarningBadge()}
      </div>

      {/* Capacity, always visible even when relic equipped */}
      <span
        className={`text-[10.5px] font-black leading-none tabular-nums tracking-wider mt-0.5 ${
          relic ? styles!.text : 'text-gray-450'
        }`}
      >
        {capacityLabel}
      </span>

      {/* Charge counter for threshold relics */}
      {relic && relic.threshold !== undefined && (
        <span className="text-[10px] font-black tabular-nums tracking-tighter leading-none text-black opacity-80">
          {relic.counter ?? 0}/{relic.threshold}
        </span>
      )}
    </div>
  )
}
