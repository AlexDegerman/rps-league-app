'use client'

import { useEffect, useState, useRef } from 'react'
import { Package, X, Radar, ChevronDown, AlertTriangle } from 'lucide-react'
import { useRelicStore } from '@/app/stores/relicStore'
import { useGameStore } from '@/app/stores/gameStore'
import {
  ICON_MAP,
  RARITY_STYLES,
  RELICS,
  getRelicCategory
} from '@/constants/relics'
import { RelicRarity, RelicDef, LoadoutType } from '@/types/relics'
import { tryAutoEquipRelic } from '@/lib/relicEquipper'

const RARITY_ORDER: RelicRarity[] = [
  'MYTHICAL',
  'LEGENDARY',
  'EPIC',
  'RARE',
  'COMMON'
]

const LOADOUT_TABS: {
  id: LoadoutType
  label: string
  shortLabel: string
  icon: string
}[] = [
  { id: 'prediction', label: 'Prediction', shortLabel: 'Predict', icon: '🎯' },
  { id: 'world_boss', label: 'World Boss', shortLabel: 'Boss', icon: '⚔️' },
  {
    id: 'neon_paradise',
    label: 'Neon Paradise',
    shortLabel: 'Neon',
    icon: '🌴'
  }
]

export default function RelicDrawer() {
  const drawerOpen = useRelicStore((s) => s.drawerOpen)
  if (!drawerOpen) return null
  return <RelicDrawerContent />
}

function RelicDrawerContent() {
  const setDrawerOpen = useRelicStore((s) => s.setDrawerOpen)
  const inventory = useRelicStore((s) => s.inventory)
  const inventoryLoaded = useRelicStore((s) => s.inventoryLoaded)
  const activeLoadout = useRelicStore((s) => s.activeLoadout)
  const loadouts = useRelicStore((s) => s.loadouts)
  const equipRelic = useRelicStore((s) => s.equipRelic)
  const unequipRelic = useRelicStore((s) => s.unequipRelic)
  const fetchInventory = useRelicStore((s) => s.fetchInventory)
  const worldBossPhase = useGameStore((s) => s.worldBossPhase)
  const bossActive = worldBossPhase === 'ACTIVE'

  const [selectedTab, setSelectedTab] = useState<LoadoutType>(activeLoadout)
  const [pendingRelic, setPendingRelic] = useState<RelicDef | null>(null)
  const [collapsedRarities, setCollapsedRarities] = useState<
    Record<string, boolean>
  >({})
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [selectedTab])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  const isLockedInCombat = bossActive && selectedTab === 'world_boss'
  const currentTabEquipped = loadouts[selectedTab] ?? [null, null, null]

  const toggleRarity = (rarity: string) => {
    setCollapsedRarities((prev) => ({
      ...prev,
      [rarity]: !prev[rarity]
    }))
  }

  const handleEquipClick = (relic: RelicDef) => {
    if (isLockedInCombat) return

    tryAutoEquipRelic({
      relic,
      slots: currentTabEquipped,
      loadout: selectedTab,
      equipRelic,
      onAutoEquipped: () => setPendingRelic(null),
      onPromptReplace: () =>
        setPendingRelic((prev) => (prev?.key === relic.key ? null : relic))
    })
  }

  const handleSlotSelect = (slotIndex: number) => {
    if (!pendingRelic || isLockedInCombat) return
    equipRelic(pendingRelic, slotIndex, selectedTab)
    setPendingRelic(null)
  }

  const equippedKeys = new Set(
    currentTabEquipped.filter(Boolean).map((r) => r!.key)
  )

  const tabInventory = inventory.filter(
    (r) => (r.category ?? getRelicCategory(r.key)) === selectedTab
  )
  const unequippedCount = tabInventory.filter(
    (r) => !equippedKeys.has(r.key)
  ).length

  const renderSlotSelector = (relic: RelicDef) => (
    <div className="mt-3 pt-3 border-t border-indigo-950/40 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-400">
          Choose a slot to replace (
          {LOADOUT_TABS.find((t) => t.id === selectedTab)?.label})
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
          const occupant = currentTabEquipped[i]
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

        {isLockedInCombat && (
          <div className="mt-2.5 px-2 py-1 bg-red-950/30 border border-red-900/20 rounded-md">
            <p className="text-[8px] text-red-400 font-bold uppercase tracking-widest text-center">
              🔒 Locked in Combat
            </p>
          </div>
        )}

        {isPending && !isLockedInCombat && renderSlotSelector(relic)}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20">
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

        {/* Loadout Preset Tabs */}
        <div className="flex border-b border-gray-900 shrink-0 bg-gray-950 px-3 max-[409px]:px-1.5 pt-2 gap-1.5 max-[409px]:gap-1">
          {LOADOUT_TABS.map((tab) => {
            const isActive = selectedTab === tab.id

            const tabSlots = loadouts[tab.id] ?? [null, null, null]
            const hasEmptySlot = tabSlots.some((r) => r === null)
            const equippedKeys = new Set(
              tabSlots.filter(Boolean).map((r) => r!.key)
            )
            const hasEquippable =
              hasEmptySlot &&
              inventory.some(
                (r) =>
                  (r.category ?? getRelicCategory(r.key)) === tab.id &&
                  !equippedKeys.has(r.key)
              )

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedTab(tab.id)
                  setPendingRelic(null)
                }}
                className={`flex-1 py-2 px-2 max-[409px]:px-1 text-[10px] max-[409px]:text-[9px] font-black uppercase tracking-wider max-[409px]:tracking-tight rounded-t-xl transition-all flex items-center justify-center gap-1.5 max-[409px]:gap-1 border-t border-x ${
                  isActive
                    ? 'bg-gray-900 text-white border-gray-800'
                    : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="max-[409px]:hidden">{tab.label}</span>
                <span className="hidden max-[409px]:inline">
                  {tab.shortLabel}
                </span>
                {hasEquippable && (
                  <AlertTriangle
                    size={11}
                    className="text-amber-400 shrink-0"
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="px-4 py-3 border-b border-gray-900/60 shrink-0 flex flex-col gap-2 bg-gray-900/10">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
              {LOADOUT_TABS.find((t) => t.id === selectedTab)?.label} Slots
            </p>
            {activeLoadout === selectedTab && (
              <span className="text-[7.5px] font-black uppercase tracking-widest text-emerald-400">
                Active In-Game
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {currentTabEquipped.map((r, i) => {
              if (!r) {
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-gray-900 bg-gray-950/20 h-14.5 min-w-0 text-center"
                  >
                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-wider mb-0.5">
                      Slot {i + 1}
                    </span>
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tight">
                      Empty
                    </span>
                  </div>
                )
              }

              const styles = RARITY_STYLES[r.rarity]
              const Icon = ICON_MAP[r.icon] ?? Package

              return (
                <div
                  key={i}
                  title={`${r.name} (${r.rarity}): ${r.effect}`}
                  className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl border bg-gray-900/40 h-14.5 min-w-0 text-center transition-all ${styles.border}`}
                >
                  <span
                    className={`absolute top-1 left-1.5 text-[8px] font-black opacity-50 ${styles.text}`}
                  >
                    {i + 1}
                  </span>

                  {!isLockedInCombat && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        unequipRelic(i, selectedTab)
                      }}
                      aria-label="Unequip"
                      className="absolute! top-1 right-1 p-0.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  )}

                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-gray-950 border ${styles.border} mb-1`}
                  >
                    <Icon size={13} className={styles.text} />
                  </div>

                  <p
                    className={`text-[9px] font-black leading-none truncate w-full px-1 ${styles.text}`}
                  >
                    {r.name}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto flex-1 custom-scrollbar"
        >
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
                  {tabInventory.length === 0
                    ? `No ${LOADOUT_TABS.find((t) => t.id === selectedTab)?.label} Relics`
                    : `All ${LOADOUT_TABS.find((t) => t.id === selectedTab)?.label} Relics Equipped`}
                </h3>
                <p className="text-gray-600 text-[8px] uppercase tracking-wider">
                  {tabInventory.length === 0
                    ? 'Keep playing to discover specialized relics'
                    : 'All discovered relics for this mode are active!'}
                </p>
              </div>
            ) : (
              <>
                {RARITY_ORDER.map((rarity) => {
                  const ownedItems = tabInventory.filter(
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
            Select any relic to equip or swap slots in this preset
          </p>
        </div>
      </div>
    </div>
  )
}
