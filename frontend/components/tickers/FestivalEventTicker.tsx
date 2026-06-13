'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { FESTIVAL_REGISTRY } from '@/lib/festivals'
import { getFestivalEffectDescription } from '@/lib/oracleTemplates'
import { FestivalModeKey, FestivalType } from '@/types/rps'

const LOCAL_FESTIVAL_MAP: Record<string, FestivalModeKey> = {
  SPARK: 'festival_spark',
  GHOST: 'festival_ghost',
  SAFEGUARD: 'festival_safeguard',
  RESONANCE: 'festival_resonance',
  SURGE: 'festival_surge',
  VAULT: 'festival_vault',
  FEVER: 'festival_fever',
  SANGUINE: 'festival_sanguine'
}

export default function FestivalEffectTicker() {
  const now = useGameStore((s) => s.now)
  const serverOffset = useGameStore((s) => s.serverOffset)
  const activeFestival = useGameStore((s) => s.activeFestival)
  const festivalType = useGameStore((s) => s.festivalType)
  const festivalEndsAt = useGameStore((s) => s.festivalEndsAt)

  const syncedNow = now + serverOffset
  const isExpired = festivalEndsAt ? syncedNow >= festivalEndsAt : false

  if (!activeFestival || !festivalType || isExpired) {
    return null
  }

  const modeKey = LOCAL_FESTIVAL_MAP[festivalType]
  const config = modeKey ? FESTIVAL_REGISTRY[modeKey] : null

  const effectText =
    config?.effectText ||
    getFestivalEffectDescription(festivalType as FestivalType)
  const color = config?.color || '#eab308'

  if (!effectText) return null

  return (
    <div
      className="relative overflow-hidden h-9 flex items-center border-b border-white/5 animate-in fade-in slide-in-from-top-2 duration-500"
      style={{ background: `${color}15`, backdropFilter: 'blur(10px)' }}
    >
      <div className="absolute inset-0 sheen-effect opacity-10 pointer-events-none" />

      <div className="flex-1 overflow-hidden relative flex items-center h-full">
        <div
          className="festival-effect-scroll whitespace-nowrap"
          style={{ animationDuration: '5s' }}
        >
          <span
            className="text-[10px] font-black uppercase tracking-[0.15em] inline-block pr-32"
            style={{ color, textShadow: `0 0 8px ${color}40` }}
          >
            {effectText}
          </span>
          <span
            className="text-[10px] font-black uppercase tracking-[0.15em] inline-block pr-32"
            style={{ color, textShadow: `0 0 8px ${color}40` }}
          >
            {effectText}
          </span>
        </div>
      </div>
    </div>
  )
}
