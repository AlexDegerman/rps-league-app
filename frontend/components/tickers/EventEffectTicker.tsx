'use client'

import { useGameStore } from '@/app/stores/gameStore'
import {
  FESTIVAL_REGISTRY,
  getFestivalEffectDescription
} from '@/lib/festivals'
import {
  GLOBAL_EVENT_REGISTRY,
  GLOBAL_EVENT_MODE_MAP
} from '@/lib/globalEvents'
import { BOSS_COLORS, BOSS_EFFECT_TEXT } from '@/lib/worldBosses'
import { FestivalModeKey, FestivalType, GlobalEventType } from '@/types/rps'

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

interface EffectRowProps {
  text: string
  color: string
  durationS?: number
}

function EffectRow({ text, color, durationS = 14 }: EffectRowProps) {
  return (
    <div
      className="relative overflow-hidden h-9 flex items-center border-b border-white/5 animate-in fade-in slide-in-from-top-2 duration-500"
      style={{ background: `${color}15`, backdropFilter: 'blur(10px)' }}
    >
      <div className="absolute inset-0 sheen-effect opacity-10 pointer-events-none" />
      <div className="flex-1 overflow-hidden relative flex items-center h-full">
        <div
          className="festival-effect-scroll whitespace-nowrap"
          style={{ animationDuration: `${durationS}s` }}
        >
          <span
            className="text-[10px] font-black uppercase tracking-[0.15em] inline-block pr-32"
            style={{ color, textShadow: `0 0 8px ${color}40` }}
          >
            {text}
          </span>
          <span
            className="text-[10px] font-black uppercase tracking-[0.15em] inline-block pr-32"
            style={{ color, textShadow: `0 0 8px ${color}40` }}
          >
            {text}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function EventEffectTicker() {
  const activeFestival = useGameStore((s) => s.activeFestival)
  const festivalType = useGameStore((s) => s.festivalType)
  const activeGlobalEvent = useGameStore((s) => s.activeGlobalEvent)
  const globalEventPhase = useGameStore((s) => s.globalEventPhase)

  // World boss
  const worldBossPhase = useGameStore((s) => s.worldBossPhase)
  const worldBossType = useGameStore((s) => s.worldBossType)

  const showFestival = activeFestival && festivalType
  const showGlobal = activeGlobalEvent && globalEventPhase === 'active'
  const showBoss = worldBossPhase === 'ACTIVE' && !!worldBossType

  if (!showFestival && !showGlobal && !showBoss) return null

  // Festival row
  const festivalRow = (() => {
    if (!showFestival) return null
    const modeKey = LOCAL_FESTIVAL_MAP[festivalType!]
    const config = modeKey ? FESTIVAL_REGISTRY[modeKey] : null
    const text =
      config?.effectText ||
      getFestivalEffectDescription(festivalType as FestivalType)
    const color = config?.color || '#eab308'
    if (!text) return null
    return (
      <EffectRow key={`festival-${festivalType}`} text={text} color={color} />
    )
  })()

  // Global event row
  const globalRow = (() => {
    if (!showGlobal) return null
    const modeKey = GLOBAL_EVENT_MODE_MAP[activeGlobalEvent as GlobalEventType]
    const config = modeKey ? GLOBAL_EVENT_REGISTRY[modeKey] : null
    if (!config) return null
    return (
      <EffectRow
        key={`global-${activeGlobalEvent}`}
        text={config.effectText}
        color={config.color}
        durationS={16}
      />
    )
  })()

  // World boss row
  const bossRow = (() => {
    if (!showBoss) return null
    const color = BOSS_COLORS[worldBossType!] ?? '#e879f9'
    const text =
      BOSS_EFFECT_TEXT[worldBossType!] ??
      'WORLD BOSS ENCOUNTER ACTIVE, STRIKE NOW'
    return (
      <EffectRow
        key={`boss-${worldBossType}`}
        text={text}
        color={color}
        durationS={18}
      />
    )
  })()

  return (
    <>
      {bossRow}
      {globalRow}
      {festivalRow}
    </>
  )
}
