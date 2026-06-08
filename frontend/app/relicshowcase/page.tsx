'use client'

import { RELICS, RARITY_STYLES, RelicRarity, RelicDef } from '@/lib/relics'
import * as Icons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

function RelicCard({ relic }: { relic: RelicDef }) {
  const style = RARITY_STYLES[relic.rarity]
  const IconComponent =
    (Icons[relic.icon as keyof typeof Icons] as unknown as LucideIcon) ||
    Icons.HelpCircle

  return (
    <div
      className={`bg-white rounded-xl border ${style.border} p-4 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${style.glow}`}
    >
      <div className={`absolute inset-0 ${style.bg} opacity-40 -z-10`} />

      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gray-900 text-white shadow-lg">
            <IconComponent size={18} className={style.text} />
          </div>
          <div className="font-[DM_Mono]">
            <span
              className={`text-[13px] font-bold block leading-none mb-1 ${style.text}`}
            >
              {relic.name}
            </span>
            <span className="text-[9px] text-[#999] uppercase tracking-[0.15em] font-bold">
              {relic.rarity}
            </span>
          </div>
        </div>
        <span className="text-[9px] text-[#bbb] font-[DM_Mono] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
          {relic.key}
        </span>
      </div>

      <div className="text-[12px] font-medium text-[#333] mb-2 leading-snug">
        {relic.effect}
      </div>

      <div className="border-t border-black/5 pt-2 mt-2 flex justify-between items-center">
        <p className="text-[10px] text-[#aaa] font-[DM_Mono] italic">
          Socket Commitment Required
        </p>
        <Icons.ChevronRight size={12} className="text-gray-300" />
      </div>
    </div>
  )
}

export default function RelicsShowcase() {
  const groupedRelics = RELICS.reduce(
    (acc, relic) => {
      if (!acc[relic.rarity]) acc[relic.rarity] = []
      acc[relic.rarity].push(relic)
      return acc
    },
    {} as Record<RelicRarity, RelicDef[]>
  )

  const rarities: RelicRarity[] = [
    'COMMON',
    'RARE',
    'EPIC',
    'LEGENDARY',
    'MYTHICAL'
  ]

  return (
    <div className="bg-[#f8f7f4] min-h-screen font-[Space_Grotesk] antialiased">
      <div className="max-w-2xl mx-auto px-4">
        <div className="pt-6 pb-8 text-center">
          <div className="text-[10px] tracking-[0.2em] uppercase text-[#999] mb-3 font-[DM_Mono] font-bold">
            System Protocol · Relics
          </div>
          <h1 className="text-[32px] font-black text-[#1a1a1a] leading-tight mb-2 tracking-tight">
            Relic Catalogue
          </h1>
          <p className="text-[13px] text-[#777] font-[DM_Mono] max-w-sm mx-auto">
            Permanent account modifications. Duplicate protected collection.
          </p>
        </div>

        {/* Discovery Box */}
        <div className="bg-white rounded-2xl p-6 mb-10 shadow-sm border border-[#e8e6e1] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-2 w-2 rounded-full bg-indigo-600" />
              <span className="text-[10px] tracking-[0.2em] uppercase text-indigo-600 font-bold font-[DM_Mono]">
                Drop Logic & Anti-Swap Protocol
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
              <div className="space-y-1.5 flex-1">
                <div className="text-[14px] font-black text-gray-900 tracking-tight leading-tight">
                  Duplicate Protected
                </div>
                <div className="text-[11px] text-gray-500 font-[DM_Mono] leading-relaxed">
                  Collected relics are removed from the pool. Discovery is
                  guaranteed.
                </div>
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="text-[14px] font-black text-gray-900 tracking-tight leading-tight">
                  Lap Scaling
                </div>
                <div className="text-[11px] text-gray-500 font-[DM_Mono] leading-relaxed">
                  Base rates increase permanently with every Chrono-Lap.
                </div>
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="text-[14px] font-black text-indigo-600 tracking-tight leading-tight">
                  Socket Snapshots
                </div>
                <div className="text-[11px] text-gray-500 font-[DM_Mono] leading-relaxed">
                  Event bonuses are locked at trigger. Progress only ticks while
                  equipped.
                </div>
              </div>
            </div>

            {/* Rates Table */}
            <div className="space-y-1 bg-[#f8f9fa] p-4 rounded-xl border border-[#eef0f2]">
              <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">
                <span>Rarity Tier</span>
                <div className="flex gap-16 pr-4">
                  <span>Base</span>
                  <span>Lap</span>
                </div>
              </div>

              {[
                {
                  r: 'Common',
                  base: '3.0%',
                  lap: '+0.50%',
                  color: 'text-green-600'
                },
                {
                  r: 'Rare',
                  base: '1.0%',
                  lap: '+0.20%',
                  color: 'text-blue-600'
                },
                {
                  r: 'Epic',
                  base: '0.3%',
                  lap: '+0.08%',
                  color: 'text-purple-600'
                },
                {
                  r: 'Legendary',
                  base: '0.1%',
                  lap: '+0.03%',
                  color: 'text-yellow-600'
                },
                {
                  r: 'Mythical',
                  base: '0.03%',
                  lap: '+0.01%',
                  color: 'text-red-600'
                }
              ].map((row) => (
                <div
                  key={row.r}
                  className="flex justify-between items-center text-[11px] font-[DM_Mono] bg-white border border-[#f0f0f0] p-3 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center">
                    <span
                      className={`${row.color} font-black uppercase tracking-wider`}
                    >
                      {row.r}
                    </span>
                  </div>
                  <div className="flex gap-12 tabular-nums text-right">
                    <span className="text-gray-900 font-bold w-10">
                      {row.base}
                    </span>
                    <span className="text-indigo-600 font-bold w-12">
                      {row.lap}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Relic Sections */}
        <div className="flex flex-col gap-12 pb-24">
          {rarities.map((rarity) => (
            <div key={rarity}>
              <div className="flex items-center gap-4 mb-5">
                <h2
                  className={`text-[11px] font-black uppercase tracking-[0.25em] ${RARITY_STYLES[rarity].text}`}
                >
                  {rarity}
                </h2>
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-[10px] text-gray-400 font-[DM_Mono]">
                  {groupedRelics[rarity]?.length || 0} Units
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {groupedRelics[rarity]?.map((relic) => (
                  <RelicCard key={relic.key} relic={relic} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-4 pb-12 text-[10px] text-[#bbb] font-[DM_Mono] leading-relaxed uppercase tracking-widest">
          Swappable in drawer · Multipliers snapshot at event start
        </div>
      </div>
    </div>
  )
}
