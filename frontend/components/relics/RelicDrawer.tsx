'use client'

import { useEffect, useState } from 'react'
import {
  Package,
  X,
  Radar,
  ChevronDown
} from 'lucide-react'
import {
  RELICS,
  RARITY_STYLES,
  type RelicRarity,
  type RelicDef
} from '@/lib/relics'
import { useRelicStore } from '@/app/stores/relicStore'
import { useGameStore } from '@/app/stores/gameStore'
import { ICON_MAP } from '@/lib/relicIcons'

const RARITY_ORDER: RelicRarity[] = [
  'MYTHICAL',
  'LEGENDARY',
  'EPIC',
  'RARE',
  'COMMON'
]

export default function RelicDrawer() {
  const drawerOpen = useRelicStore((s) => s.drawerOpen)
  const setDrawerOpen = useRelicStore((s) => s.setDrawerOpen)
  const inventory = useRelicStore((s) => s.inventory)
  const inventoryLoaded = useRelicStore((s) => s.inventoryLoaded)
  const equippedRelics = useRelicStore((s) => s.equippedRelics)
  const equipRelic = useRelicStore((s) => s.equipRelic)
  const unequipRelic = useRelicStore((s) => s.unequipRelic)
  const fetchInventory = useRelicStore((s) => s.fetchInventory)
  const worldBossPhase = useGameStore((s) => s.worldBossPhase)
  const bossActive = worldBossPhase === 'ACTIVE'

  const [pendingRelic, setPendingRelic] = useState<RelicDef | null>(null)
  const [collapsedRarities, setCollapsedRarities] = useState<
    Record<string, boolean>
  >({})

  useEffect(() => {
    if (drawerOpen) fetchInventory()
  }, [drawerOpen, fetchInventory])

  useEffect(() => {
    if (!drawerOpen) {
      const raf = requestAnimationFrame(() => setPendingRelic(null))
      return () => cancelAnimationFrame(raf)
    }
  }, [drawerOpen])

  if (!drawerOpen) return null

  const toggleRarity = (rarity: string) => {
    setCollapsedRarities((prev) => ({
      ...prev,
      [rarity]: !prev[rarity]
    }))
  }

  const handleEquipClick = (relic: RelicDef) => {
    if (bossActive) return
    setPendingRelic((prev) => (prev?.key === relic.key ? null : relic))
  }

  const handleSlotSelect = (slotIndex: number) => {
    if (!pendingRelic || bossActive) return
    equipRelic(pendingRelic, slotIndex)
    setPendingRelic(null)
  }

  // Create a set of equipped relic keys to easily hide them below
  const equippedKeys = new Set(
    equippedRelics.filter(Boolean).map((r) => r!.key)
  )

  const renderSlotSelector = (relic: RelicDef) => (
    <div className="mt-3 pt-3 border-t border-indigo-950/40 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-400">
          Choose a slot to equip
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setPendingRelic(null)
          }}
          className="text-[8px] font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="flex gap-2">
        {[0, 1, 2].map((i) => {
          const occupant = equippedRelics[i]
          const isSameRelic = occupant?.key === relic.key
          return (
            <button
              key={i}
              disabled={isSameRelic}
              onClick={(e) => {
                e.stopPropagation()
                handleSlotSelect(i)
              }}
              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex flex-col items-center justify-center ${
                isSameRelic
                  ? 'border-gray-800 bg-gray-950/40 text-gray-700 cursor-not-allowed'
                  : occupant
                    ? 'border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 hover:border-amber-500/50 active:scale-95'
                    : 'border-dashed border-indigo-500/30 text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/15 hover:border-indigo-500/50 active:scale-95'
              }`}
            >
              <span className="text-[7px] opacity-60 mb-0.5 tracking-normal">
                SLOT {i + 1}
              </span>
              {isSameRelic ? 'Equipped' : occupant ? 'Replace' : 'Empty'}
            </button>
          )
        })}
      </div>
    </div>
  )

  // Renders unequipped relics only
  const renderRelicCard = (relic: RelicDef) => {
    const Icon = ICON_MAP[relic.icon] ?? Package
    const styles = RARITY_STYLES[relic.rarity]
    const isPending = pendingRelic?.key === relic.key
    const progress = relic.threshold
      ? Math.min(((relic.counter ?? 0) / relic.threshold) * 100, 100)
      : 0

    return (
      <div
        key={relic.key}
        onClick={() => handleEquipClick(relic)}
        className={`relative flex flex-col p-3.5 rounded-xl border transition-all duration-200 ${
          isPending
            ? 'bg-indigo-950/20 border-indigo-500/50 cursor-pointer shadow-lg'
            : 'bg-gray-900/20 border-gray-900 hover:border-gray-800 cursor-pointer'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-950 border ${styles.border}`}
          >
            <Icon size={18} className={styles.text} />
          </div>

          <div className="flex-1 min-w-0">
            <h4
              className={`text-[12px] font-black tracking-tight leading-tight ${styles.text}`}
            >
              {relic.name}
            </h4>
            <p className="text-[10px] text-slate-300 font-medium leading-relaxed mt-1">
              {relic.effect}
            </p>
          </div>
        </div>

        {relic.threshold !== undefined && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[6.5px] font-black text-white/20 uppercase tracking-[0.15em] shrink-0">
              Charge
            </span>
            <div className="h-1 w-full bg-gray-950 rounded-full border border-white/5 overflow-hidden">
              <div
                className="h-full bg-gray-600 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[8px] font-black text-white/75 tabular-nums shrink-0">
              {relic.counter ?? 0}/{relic.threshold}
            </span>
          </div>
        )}

        {bossActive && (
          <div className="mt-2.5 px-2 py-1 bg-red-950/30 border border-red-900/20 rounded-md">
            <p className="text-[8px] text-red-400 font-bold uppercase tracking-widest text-center">
              🔒 Locked in Combat
            </p>
          </div>
        )}

        {isPending && !bossActive && renderSlotSelector(relic)}
      </div>
    )
  }

  // Count how many discovered relics are currently not equipped
  const unequippedCount = inventory.filter(
    (r) => !equippedKeys.has(r.key)
  ).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20 sm:p-4">
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setDrawerOpen(false)}
      />
      <div className="relative w-full max-w-md bg-gray-950 border border-gray-900 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-900 shrink-0">
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-1.5">
              <span className="text-indigo-500 text-sm">🧿</span> Relic Vault
            </h2>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
              {inventory.length} / {RELICS.length} Discovered
            </p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-full bg-gray-900 text-gray-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-gray-900/60 shrink-0 flex flex-col gap-2 bg-gray-900/10">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
            Equipped Slots
          </p>
          <div className="flex flex-col gap-1.5">
            {equippedRelics.map((r, i) => {
              const styles = r ? RARITY_STYLES[r.rarity] : null
              const Icon = r ? (ICON_MAP[r.icon] ?? Package) : Package
              return (
                <div
                  key={i}
                  className={`flex justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                    r
                      ? `items-start bg-gray-900/40 ${styles!.border}`
                      : 'items-center border-dashed border-gray-900 bg-gray-950/20'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black ${
                        r
                          ? `bg-gray-950 ${styles!.text} mt-0.5`
                          : 'bg-gray-900/50 text-gray-700'
                      }`}
                    >
                      {i + 1}
                    </div>

                    {r ? (
                      <>
                        <Icon
                          size={16}
                          className={`${styles!.text} shrink-0 mt-1`}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-[11px] font-black leading-snug ${styles!.text}`}
                          >
                            {r.name}
                          </p>
                          <p className="text-[9px] text-slate-300 font-semibold leading-snug mt-0.5 pr-2">
                            {r.effect}
                          </p>
                        </div>
                      </>
                    ) : (
                      <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">
                        Empty
                      </span>
                    )}
                  </div>

                  {r && !bossActive && (
                    <button
                      onClick={() => unequipRelic(i)}
                      title="Unequip"
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center active:scale-95 shrink-0 mt-0.5"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="px-4 py-4 space-y-4">
            {!inventoryLoaded ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest text-center">
                  Accessing Vault...
                </p>
              </div>
            ) : unequippedCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mb-3 border border-gray-800">
                  <Radar size={20} className="text-gray-700 animate-pulse" />
                </div>
                <h3 className="text-white font-black uppercase text-[10px] tracking-widest mb-1">
                  {inventory.length === 0
                    ? 'No Relics Discovered'
                    : 'All Relics Equipped'}
                </h3>
                <p className="text-gray-600 text-[8px] uppercase tracking-wider">
                  {inventory.length === 0
                    ? 'Keep playing to find them'
                    : 'All of your discovered relics are currently active!'}
                </p>
              </div>
            ) : (
              <>
                {RARITY_ORDER.map((rarity) => {
                  const ownedItems = inventory.filter(
                    (r) => r.rarity === rarity && !equippedKeys.has(r.key)
                  )

                  if (ownedItems.length === 0) return null
                  const styles = RARITY_STYLES[rarity]
                  const isCollapsed = !!collapsedRarities[rarity]

                  return (
                    <div key={rarity} className="space-y-2">
                      <button
                        onClick={() => toggleRarity(rarity)}
                        className="flex items-center gap-2 w-full text-left focus:outline-none"
                      >
                        <span
                          className={`text-[8px] font-black uppercase tracking-[0.25em] ${styles.text}`}
                        >
                          {rarity}
                        </span>
                        <div className="h-px flex-1 bg-gray-900" />
                        <ChevronDown
                          size={12}
                          className={`transition-transform duration-200 ${styles.text} ${
                            isCollapsed ? '-rotate-90' : ''
                          }`}
                        />
                      </button>
                      {!isCollapsed && (
                        <div className="grid grid-cols-1 gap-2 w-full animate-in fade-in duration-150">
                          {ownedItems.map((relic) => renderRelicCard(relic))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>

        <div className="p-3 bg-gray-900/25 border-t border-gray-900 shrink-0">
          <p className="text-[8px] text-center text-gray-600 font-bold uppercase tracking-[0.2em]">
            Select any relic to equip or swap slots
          </p>
        </div>
      </div>
    </div>
  )
}
