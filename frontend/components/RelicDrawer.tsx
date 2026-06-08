'use client'

import { useEffect } from 'react'
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
  Package,
  X,
  Radar
} from 'lucide-react'
import {
  RELICS,
  RARITY_STYLES,
  type RelicRarity,
  type RelicDef
} from '@/lib/relics'
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

const RARITY_ORDER: RelicRarity[] = [
  'MYTHICAL',
  'LEGENDARY',
  'EPIC',
  'RARE',
  'COMMON'
]

export default function RelicDrawer() {
  const {
    drawerOpen,
    setDrawerOpen,
    inventory,
    inventoryLoaded,
    equippedRelic,
    equipRelic,
    unequipRelic,
    fetchInventory
  } = useRelicStore()

  useEffect(() => {
    if (drawerOpen) fetchInventory()
  }, [drawerOpen, fetchInventory])

  if (!drawerOpen) return null

const renderRelicCard = (relic: RelicDef, isEquipped: boolean) => {
  const Icon = ICON_MAP[relic.icon] ?? Package
  const styles = RARITY_STYLES[relic.rarity]

  // Calculate progress percentage safely
  const progress = relic.threshold
    ? Math.min(((relic.counter || 0) / relic.threshold) * 100, 100)
    : 0

  return (
    <div
      key={relic.key}
      className={`relative flex flex-col p-4 rounded-[22px] border transition-all duration-300 ${
        isEquipped
          ? `${styles.border} ${styles.bg} ${styles.glow} shadow-xl`
          : 'bg-gray-900/20 border-gray-900 hover:border-gray-800'
      }`}
    >
      <div className="flex items-center gap-3.5 mb-2.5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gray-950 border ${isEquipped ? styles.border : 'border-gray-800'}`}
        >
          <Icon
            size={20}
            className={isEquipped ? styles.text : 'text-gray-500'}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-black text-white tracking-tight leading-tight">
            {relic.name}
          </h4>
          {isEquipped && (
            <span
              className={`mt-0.5 inline-block text-[7px] font-black px-1.5 py-0.5 rounded-md ${styles.bg} ${styles.text} border ${styles.border} animate-pulse uppercase tracking-widest`}
            >
              Active
            </span>
          )}
        </div>
      </div>

      {/* PROGRESS BAR SECTION */}
      {relic.threshold !== undefined && (
        <div className="mb-3 space-y-1.5">
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">
              Charge Level
            </span>
            <span className="text-[9px] font-black text-white/90 tabular-nums">
              {relic.counter || 0} / {relic.threshold}
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-950 rounded-full border border-white/5 overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ease-out ${isEquipped ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-gray-700'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div
        className={`pt-2.5 border-t ${isEquipped ? 'border-white/10' : 'border-gray-900/50'}`}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">
            Effect
          </span>
          <p className="text-[11px] text-slate-200 font-bold leading-relaxed flex-1">
            {relic.effect}
          </p>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        {isEquipped ? (
          <button
            onClick={unequipRelic}
            className="text-[9px] font-black text-gray-500 hover:text-red-400 transition-colors uppercase tracking-[0.2em] px-3 py-1.5 bg-gray-950/50 rounded-lg border border-gray-800"
          >
            Remove
          </button>
        ) : (
          <button
            onClick={() => equipRelic(relic)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${styles.bg} ${styles.text} border ${styles.border} hover:brightness-125 active:scale-95 shadow-lg`}
          >
            Equip
          </button>
        )}
      </div>
    </div>
  )
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pb-24 sm:p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={() => setDrawerOpen(false)}
      />

      <div className="relative w-full max-w-md bg-gray-950 border border-gray-800 rounded-4xl shadow-2xl flex flex-col max-h-[75vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-900 shrink-0">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="text-indigo-500 text-base">🧿</span> Relic Vault
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
              {inventory.length} / {RELICS.length} Discovered
            </p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2.5 rounded-full bg-gray-900 text-gray-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="px-5 py-6 space-y-6">
            {!inventoryLoaded ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">
                  Opening Vault...
                </p>
              </div>
            ) : inventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4 border border-gray-800 shadow-inner">
                  <Radar
                    size={24}
                    className="text-gray-700 animate-pulse mb-4"
                  />
                </div>
                <h3 className="text-white font-black uppercase text-xs tracking-widest mb-2">
                  No Relics Discovered
                </h3>
                <p className="text-gray-500 text-[10px] uppercase tracking-wider">
                  Keep playing to find them
                </p>
              </div>
            ) : (
              <>
                {/* 1. PINNED ACTIVE RELIC */}
                {equippedRelic && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] font-black uppercase tracking-[0.25em] text-indigo-400">
                        Active Relic
                      </span>
                      <div className="h-px flex-1 bg-indigo-500/10" />
                    </div>
                    {renderRelicCard(equippedRelic, true)}
                  </div>
                )}

                {/*THE VAULT */}
                {RARITY_ORDER.map((rarity) => {
                  const ownedItems = inventory.filter(
                    (r) => r.rarity === rarity && r.key !== equippedRelic?.key
                  )
                  if (ownedItems.length === 0) return null
                  const styles = RARITY_STYLES[rarity]

                  return (
                    <div key={rarity} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[8px] font-black uppercase tracking-[0.25em] ${styles.text}`}
                        >
                          {rarity}
                        </span>
                        <div className="h-px flex-1 bg-gray-900" />
                      </div>

                      <div className="grid grid-cols-1 gap-3 w-full">
                        {ownedItems.map((relic) =>
                          renderRelicCard(relic, false)
                        )}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-gray-900/30 border-t border-gray-900 shrink-0">
          <p className="text-[9px] text-center text-gray-600 font-bold uppercase tracking-[0.2em]">
            One relic can be socketed at a time
          </p>
        </div>
      </div>
    </div>
  )
}
