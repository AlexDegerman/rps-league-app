'use client'

import { useEffect, useState, useRef } from 'react'
import { useGameStore } from '@/app/stores/gameStore'

const FESTIVAL_THEME: Record<
  string,
  { key: string; label: string; color: string }
> = {
  SPARK: { key: 'festival_spark', label: 'SPARK', color: '#a855f7' },
  GHOST: { key: 'festival_ghost', label: 'GHOST', color: '#4dd0c4' },
  SAFEGUARD: {
    key: 'festival_safeguard',
    label: 'SAFEGUARD',
    color: '#94a3b8'
  },
  RESONANCE: {
    key: 'festival_resonance',
    label: 'RESONANCE',
    color: '#ecc94b'
  },
  SURGE: { key: 'festival_surge', label: 'SURGE', color: '#22d3ee' },
  VAULT: { key: 'festival_vault', label: 'VAULT', color: '#748ffc' },
  FEVER: { key: 'festival_fever', label: 'FEVER', color: '#f97316' },
  SANGUINE: { key: 'festival_sanguine', label: 'SANGUINE', color: '#991b1b' }
}

export default function FestivalTicker() {
  const activeFestival = useGameStore((s) => s.activeFestival)
  const festivalEndsAt = useGameStore((s) => s.festivalEndsAt)
  const festivalType = useGameStore((s) => s.festivalType)
  const clearFestival = useGameStore((s) => s.clearFestival)

  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [expired, setExpired] = useState(false)
  const [prevEndsAt, setPrevEndsAt] = useState(festivalEndsAt)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // FIX: Sync state directly during render to prevent cascading effect updates
  if (festivalEndsAt !== prevEndsAt) {
    setPrevEndsAt(festivalEndsAt)
    setExpired(false)
  }

  useEffect(() => {
    if (!festivalEndsAt) return
    const tick = () => {
      const remaining = Math.max(0, festivalEndsAt - Date.now())
      if (remaining <= 0) {
        setExpired(true)
        clearFestival()
        if (intervalRef.current) clearInterval(intervalRef.current)
      } else setTimeLeft(remaining)
    }
    tick()
    intervalRef.current = setInterval(tick, 500)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [festivalEndsAt, festivalType, clearFestival])

  const formatTime = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000)
    return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`
  }

  const theme = festivalType ? FESTIVAL_THEME[festivalType] : null
  if (!activeFestival || !theme || expired) return null

  const DURATIONS: Record<string, number> = {
    SPARK: 45000,
    GHOST: 60000,
    SAFEGUARD: 60000,
    RESONANCE: 40000,
    SURGE: 60000,
    VAULT: 120000,
    FEVER: 30000,
    SANGUINE: 15000
  }
  const totalDuration = festivalType
    ? (DURATIONS[festivalType] ?? 60000)
    : 60000
  const progress = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100))

  return (
    <div
      className="relative overflow-hidden h-7 flex items-center shadow-sm rounded-b-lg border-x border-b border-gray-100 mb-2"
      style={{
        background: `linear-gradient(to bottom, ${theme.color}15, transparent)`,
        backdropFilter: 'blur(10px)'
      }}
    >
      <div
        className="absolute inset-y-0 left-0 transition-all duration-700 ease-linear opacity-[0.06]"
        style={{ width: `${progress}%`, background: theme.color }}
      />

      <div className="relative z-10 w-full px-2.5 flex items-center justify-between">
        <span
          className="text-[9px] font-black uppercase tracking-[0.2em] leading-none"
          style={{
            color: theme.color,
            textShadow: `0 0 8px ${theme.color}60`
          }}
        >
          {theme.label} FESTIVAL
        </span>

        <div
          className="px-2 py-0.5 rounded border flex items-center justify-center min-w-11 shadow-sm"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            borderColor: `${theme.color}60`,
            backdropFilter: 'brightness(0.9)'
          }}
        >
          <span
            className="text-[12px] font-black tabular-nums font-mono tracking-tight"
            style={{
              color: theme.color,
              textShadow: `0px 1px 2px rgba(0,0,0,0.3), 0 0 8px ${theme.color}60`
            }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div
        className="absolute top-0 left-0 right-0 h-px opacity-30"
        style={{ background: theme.color }}
      />
    </div>
  )
}
