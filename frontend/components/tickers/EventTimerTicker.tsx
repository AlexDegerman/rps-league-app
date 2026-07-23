'use client'

import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import {
  GLOBAL_EVENT_REGISTRY,
  GLOBAL_EVENT_MODE_MAP
} from '@/lib/globalEvents'
import { GlobalEventType } from '@/types/rps'

const FESTIVAL_THEME: Record<string, { label: string; color: string }> = {
  SPARK: { label: 'SPARK', color: '#a855f7' },
  GHOST: { label: 'GHOST', color: '#4dd0c4' },
  SAFEGUARD: { label: 'SAFEGUARD', color: '#94a3b8' },
  RESONANCE: { label: 'RESONANCE', color: '#ecc94b' },
  SURGE: { label: 'SURGE', color: '#22d3ee' },
  VAULT: { label: 'VAULT', color: '#748ffc' },
  FEVER: { label: 'FEVER', color: '#f97316' },
  SANGUINE: { label: 'SANGUINE', color: '#991b1b' }
}

const FESTIVAL_DURATIONS: Record<string, number> = {
  SPARK: 45000,
  GHOST: 60000,
  SAFEGUARD: 60000,
  RESONANCE: 40000,
  SURGE: 60000,
  VAULT: 120000,
  FEVER: 30000,
  SANGUINE: 15000
}

const GLOBAL_DURATIONS: Record<GlobalEventType, number> = {
  TIDAL_SURGE: 180000,
  SOLAR_FLARE: 120000,
  CYCLONE_BLITZ: 150000,
  MIRAGE_CATACLYSM: 180000
}

const fmt = (ms: number) => {
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

interface TimerEntry {
  label: string
  color: string
  timeLeft: number
  totalDuration: number
  isWarning?: boolean
  kind: 'festival' | 'global' | 'boss_warning' | 'boss_active'
}

export default function EventTimerTicker() {
  const activeFestival = useGameStore((s) => s.activeFestival)
  const festivalType = useGameStore((s) => s.festivalType)
  const festivalEndsAt = useGameStore((s) => s.festivalEndsAt)
  const clearFestival = useGameStore((s) => s.clearFestival)

  const activeGlobalEvent = useGameStore((s) => s.activeGlobalEvent)
  const globalEventPhase = useGameStore((s) => s.globalEventPhase)
  const globalEventActiveAt = useGameStore((s) => s.globalEventActiveAt)
  const globalEventEndsAt = useGameStore((s) => s.globalEventEndsAt)
  const clearGlobalEvent = useGameStore((s) => s.clearGlobalEvent)
  const globalEventStartedAt = useGameStore((s) => s.globalEventStartedAt)

  const worldBossPhase = useGameStore((s) => s.worldBossPhase)
  const worldBossType = useGameStore((s) => s.worldBossType)
  const worldBossWarningActiveAt = useGameStore(
    (s) => s.worldBossWarningActiveAt
  )
  const worldBossEndsAt = useGameStore((s) => s.worldBossEndsAt)
  const clearWorldBoss = useGameStore((s) => s.clearWorldBoss)

  const [entries, setEntries] = useState<TimerEntry[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevTimeRef = useRef<string | null>(null)

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const next: TimerEntry[] = []

      // Festival
      if (activeFestival && festivalType && festivalEndsAt) {
        const left = festivalEndsAt - now
        if (left <= 0) {
          clearFestival()
        } else {
          const theme = FESTIVAL_THEME[festivalType]
          next.push({
            label: theme?.label ?? festivalType,
            color: theme?.color ?? '#eab308',
            timeLeft: left,
            totalDuration: FESTIVAL_DURATIONS[festivalType] ?? 60000,
            kind: 'festival'
          })
        }
      }

      // Global event
      if (activeGlobalEvent) {
        const isWarning = globalEventPhase === 'warning'
        const targetTs = isWarning
          ? (globalEventActiveAt ?? 0)
          : (globalEventEndsAt ?? 0)
        const left = targetTs - now

        if (!isWarning && left <= 0) {
          clearGlobalEvent()
        } else if (left > 0) {
          const modeKey =
            GLOBAL_EVENT_MODE_MAP[activeGlobalEvent as GlobalEventType]
          const config = modeKey ? GLOBAL_EVENT_REGISTRY[modeKey] : null
          next.push({
            label: config?.label ?? activeGlobalEvent,
            color: config?.color ?? '#94a3b8',
            timeLeft: left,
            totalDuration: isWarning
              ? (globalEventActiveAt ?? 0) - (globalEventStartedAt ?? 0)
              : GLOBAL_DURATIONS[activeGlobalEvent as GlobalEventType],
            isWarning,
            kind: 'global'
          })
        }
      }

      // World Boss
      if (worldBossPhase && worldBossType) {
        const isWarning = worldBossPhase === 'WARNING'
        const targetTs = isWarning
          ? (worldBossWarningActiveAt ?? 0)
          : (worldBossEndsAt ?? 0)
        const left = targetTs - now

        if (!isWarning && left <= 0) {
          clearWorldBoss()
        } else if (left > 0 && isWarning) {
          next.push({
            label: worldBossType,
            color: '#e879f9',
            timeLeft: left,
            totalDuration: 30000,
            isWarning: true,
            kind: 'boss_warning'
          })
        }
      }

      const newTimeKey = next
        .map((e) => `${e.label}-${Math.ceil(e.timeLeft / 1000)}`)
        .join('|')

      if (newTimeKey !== prevTimeRef.current) {
        prevTimeRef.current = newTimeKey
        setEntries(next)
      }
    }

    tick()
    intervalRef.current = setInterval(tick, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [
    activeFestival,
    festivalType,
    festivalEndsAt,
    activeGlobalEvent,
    globalEventPhase,
    globalEventActiveAt,
    globalEventEndsAt,
    globalEventStartedAt,
    worldBossPhase,
    worldBossType,
    worldBossWarningActiveAt,
    worldBossEndsAt,
    clearFestival,
    clearGlobalEvent,
    clearWorldBoss
  ])

  if (entries.length === 0) return null

  return (
    <div className="relative overflow-hidden h-7 flex items-center shadow-sm rounded-b-lg border-x border-b border-gray-100 mb-2">
      {/* Background: blend all active event colors */}
      <div
        className="absolute inset-0"
        style={{
          background:
            entries.length === 1
              ? `linear-gradient(to bottom, ${entries[0]!.color}15, transparent)`
              : `linear-gradient(to right, ${entries[0]!.color}15, ${entries[entries.length - 1]!.color}15)`
        }}
      />

      {/* Progress bar for first entry */}
      {entries[0] && (
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700 ease-linear opacity-[0.06]"
          style={{
            width: `${Math.max(0, Math.min(100, (entries[0].timeLeft / entries[0].totalDuration) * 100))}%`,
            background: entries[0].color
          }}
        />
      )}

      <div className="relative z-10 w-full px-2.5 flex items-center justify-between gap-2">
        {/* Left: all event labels */}
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          {entries.map((e, i) => (
            <div
              key={e.label}
              className="flex items-center gap-1.5 min-w-0 shrink-0"
            >
              {i > 0 && (
                <span className="text-[9px] text-gray-400 font-bold shrink-0">
                  /
                </span>
              )}
              <span
                className="text-[9px] font-black uppercase tracking-[0.18em] leading-none truncate"
                style={{
                  color: e.color,
                  textShadow: `0 0 8px ${e.color}60`,
                  opacity: e.isWarning && e.kind !== 'boss_warning' ? 0.7 : 1
                }}
              >
                {e.kind === 'boss_warning' && '⚔️ '}
                {e.kind === 'boss_active' && '💀 '}
                {e.kind === 'global' && e.isWarning && '⚡ '}
                {e.label}
                {e.isWarning && e.kind !== 'boss_active' && (
                  <span className="ml-1 text-[8px] font-medium normal-case tracking-normal opacity-70">
                    {e.kind === 'boss_warning' ? 'spawning' : 'incoming'}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Right: timer pills */}
        <div className="flex items-center gap-1 shrink-0">
          {entries.map((e, i) => (
            <div key={`timer-${e.label}`} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-[9px] text-gray-400 font-bold">/</span>
              )}
              <div
                className="px-2 py-0.5 rounded border flex items-center justify-center min-w-11 shadow-sm"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.15)',
                  borderColor: `${e.color}60`,
                  backdropFilter: 'brightness(0.9)'
                }}
              >
                <span
                  className="text-[12px] font-black tabular-nums font-mono tracking-tight"
                  style={{
                    color: e.color,
                    textShadow: `0px 1px 2px rgba(0,0,0,0.3), 0 0 8px ${e.color}60`
                  }}
                >
                  {fmt(e.timeLeft)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute top-0 left-0 right-0 h-px opacity-30"
        style={{ background: entries[0]?.color }}
      />
    </div>
  )
}
