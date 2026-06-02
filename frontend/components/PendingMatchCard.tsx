'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PendingMatch, PredictionRecord } from '@/types/rps'
import { formatDateTime } from '@/lib/format'

interface PendingMatchCardProps {
  pending: PendingMatch
  prediction: PredictionRecord | null
  onPick: (gameId: string, playerName: string) => void
  serverOffset: number
  winStreak?: number
  visualMode?: string | null
  festivalModeKey?: string | null
  oracleSide?: 'left' | 'right' | null
}

export default function PendingMatchCard({
  pending,
  prediction,
  onPick,
  serverOffset,
  winStreak = 0,
  visualMode = null,
  festivalModeKey = null,
  oracleSide
}: PendingMatchCardProps) {
  const calculateTimeLeft = useCallback(() => {
    if (!pending.expiresAt) return 0
    const correctedNow = Date.now() + serverOffset
    return Math.max(0, Math.ceil((pending.expiresAt - correctedNow) / 1000))
  }, [pending.expiresAt, serverOffset])

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      if (remaining <= 0) clearInterval(id)
    }, 200)
    return () => clearInterval(id)
  }, [calculateTimeLeft])

  const canPick = timeLeft > 0 && !prediction

  const isFlash = visualMode?.startsWith('flash_')

  const isInferno = !isFlash && winStreak >= 5
  const isFever = !isFlash && winStreak >= 3 && winStreak < 5

  const modeConfig = {
    flash_lunar: {
      border: 'border-blue-300',
      card: 'bg-gradient-to-b from-white to-blue-50/40',
      glowColor: 'rgba(190,227,248,0.08)',
      cardAnim: 'lunar-ring',
      dateText: 'text-blue-400/70',
      vsText: 'text-blue-200',
      btnClass: 'lunar-btn',
      label: '🌙 PICK',
      confirmBg: 'bg-blue-500'
    },
    flash_electric: {
      border: 'border-purple-400',
      card: 'bg-gradient-to-b from-white to-purple-50/40',
      glowColor: 'rgba(159,122,234,0.08)',
      cardAnim: 'electric-ring',
      dateText: 'text-purple-400/70',
      vsText: 'text-purple-200',
      btnClass: 'electric-btn',
      label: '⚡ PICK',
      confirmBg: 'bg-purple-500'
    },
    flash_cards: {
      border: 'border-yellow-400',
      card: 'bg-gradient-to-b from-white to-yellow-50/40',
      glowColor: 'rgba(236,201,75,0.07)',
      cardAnim: 'cards-ring',
      dateText: 'text-yellow-600/70',
      vsText: 'text-yellow-300',
      btnClass: 'cards-btn',
      label: '🃏 PICK',
      confirmBg: 'bg-yellow-500'
    },
    flash_hellfire: {
      border: 'border-red-500',
      card: 'bg-gradient-to-b from-white to-red-50/40',
      glowColor: 'rgba(197,48,48,0.08)',
      cardAnim: 'hellfire-ring',
      dateText: 'text-red-400/70',
      vsText: 'text-red-200',
      btnClass: 'flash-hellfire-btn',
      label: '🔥 PICK',
      confirmBg: 'bg-red-600'
    },
    winstreak_inferno: {
      border: 'border-orange-400',
      card: 'bg-gradient-to-b from-white to-orange-50/40',
      glowColor: 'rgba(249,115,22,0.07)',
      cardAnim: 'card-inferno',
      dateText: 'text-orange-400/70',
      vsText: 'text-orange-300',
      btnClass: 'inferno-btn',
      label: '🔥 PICK',
      confirmBg: 'bg-orange-500'
    },
    winstreak_fever: {
      border: 'border-green-400',
      card: 'bg-gradient-to-b from-white to-green-50/40',
      glowColor: 'rgba(34,197,94,0.07)',
      cardAnim: 'card-fever',
      dateText: 'text-green-600/70',
      vsText: 'text-green-300',
      btnClass: 'fever-btn',
      label: '⚡ PICK',
      confirmBg: 'bg-green-500'
    },
    festival_ghost: {
      border: 'border-teal-300',
      card: 'bg-gradient-to-b from-white to-teal-50/40',
      glowColor: 'rgba(77,208,196,0.07)',
      cardAnim: 'ghost-ring',
      dateText: 'text-teal-400/70',
      vsText: 'text-teal-200',
      btnClass: 'bg-teal-500 hover:bg-teal-600 text-white',
      label: '👻 PICK',
      confirmBg: 'bg-teal-500'
    },
    festival_safeguard: {
      border: 'border-slate-300',
      card: 'bg-gradient-to-b from-white to-slate-50/40',
      glowColor: 'rgba(100,116,139,0.07)',
      cardAnim: 'safeguard-ring',
      dateText: 'text-slate-400/70',
      vsText: 'text-slate-300',
      btnClass: 'bg-slate-500 hover:bg-slate-600 text-white',
      label: '🛡️ PICK',
      confirmBg: 'bg-slate-500'
    },
    festival_resonance: {
      border: 'border-yellow-300',
      card: 'bg-gradient-to-b from-white to-yellow-50/40',
      glowColor: 'rgba(236,201,75,0.07)',
      cardAnim: 'resonance-ring',
      dateText: 'text-yellow-600/70',
      vsText: 'text-yellow-300',
      btnClass: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      label: '🔮 PICK',
      confirmBg: 'bg-yellow-500'
    },
    festival_surge: {
      border: 'border-cyan-300',
      card: 'bg-gradient-to-b from-white to-cyan-50/40',
      glowColor: 'rgba(34,211,238,0.07)',
      cardAnim: 'surge-ring',
      dateText: 'text-cyan-400/70',
      vsText: 'text-cyan-200',
      btnClass: 'bg-cyan-500 hover:bg-cyan-600 text-white',
      label: '⚡ PICK',
      confirmBg: 'bg-cyan-500'
    },
    festival_vault: {
      border: 'border-indigo-300',
      card: 'bg-gradient-to-b from-white to-indigo-50/40',
      glowColor: 'rgba(59,91,219,0.07)',
      cardAnim: 'vault-ring',
      dateText: 'text-indigo-400/70',
      vsText: 'text-indigo-200',
      btnClass: 'bg-indigo-500 hover:bg-indigo-600 text-white',
      label: '🏛️ PICK',
      confirmBg: 'bg-indigo-500'
    },
    festival_spark: {
      border: 'border-purple-300',
      card: 'bg-gradient-to-b from-white to-purple-50/40',
      glowColor: 'rgba(168,85,247,0.07)',
      cardAnim: 'spark-ring',
      dateText: 'text-purple-400/70',
      vsText: 'text-purple-200',
      btnClass: 'electric-btn',
      label: '⚡ PICK',
      confirmBg: 'bg-purple-500'
    },
    festival_sanguine: {
      border: 'border-red-900',
      card: 'bg-gradient-to-b from-white to-red-50/40',
      glowColor: 'rgba(153,27,27,0.08)',
      cardAnim: 'sanguine-ring',
      dateText: 'text-red-800/70',
      vsText: 'text-red-300',
      btnClass: 'bg-red-800 hover:bg-red-900 text-white',
      label: '🩸 PICK',
      confirmBg: 'bg-red-800'
    },
    festival_fever: {
      border: 'border-orange-500',
      card: 'bg-gradient-to-b from-white to-orange-50/40',
      glowColor: 'rgba(249,115,22,0.1)',
      cardAnim: 'fever-festival-ring',
      dateText: 'text-orange-400/60',
      vsText: 'text-orange-300',
      btnClass: 'bg-orange-600 text-white',
      label: '🔥 PICK',
      confirmBg: 'bg-orange-600'
    },
    default: {
      border: 'border-indigo-200',
      card: 'bg-white',
      glowColor: null,
      cardAnim: '',
      dateText: 'text-gray-400',
      vsText: 'text-gray-300',
      btnClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      label: 'PICK',
      confirmBg: 'bg-indigo-400'
    }
  } as const

  const activeKey = (
    isFlash
      ? visualMode
      : (festivalModeKey ??
        (isInferno
          ? 'winstreak_inferno'
          : isFever
            ? 'winstreak_fever'
            : 'default'))
  ) as keyof typeof modeConfig

  const cfg = modeConfig[activeKey] ?? modeConfig.default

  // Components are "active" if they aren't using the default theme
  const isActive = activeKey !== 'default'

  const timerClass =
    timeLeft <= 0
      ? 'bg-gray-100 text-gray-400'
      : timeLeft <= 2
        ? 'bg-red-500 text-white animate-pulse'
        : isActive
          ? cfg.btnClass
          : 'bg-indigo-600 text-white'

  const betBtnClass = `w-full py-3 rounded-xl font-black text-sm active:scale-95 shadow-md transition-all tracking-wide ${cfg.btnClass}`

  return (
    <div
      className={`relative rounded-xl shadow-sm border-2 p-2 sm:p-4 mb-3 animate-in fade-in zoom-in duration-300 overflow-hidden
        ${cfg.border} ${cfg.card} ${cfg.cardAnim}`}
    >
      {/* Ambient glow layer */}
      {isActive && cfg.glowColor && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top, ${cfg.glowColor} 0%, transparent 70%)`
          }}
        />
      )}

      {/* Top row: date + timer */}
      <div className="flex justify-between items-center gap-2 mb-2 relative z-10">
        <span className={`text-xs shrink-0 font-medium ${cfg.dateText}`}>
          {formatDateTime(pending.time)}
        </span>
        <span
          className={`text-[13px] font-black px-3 py-1 rounded-lg shrink-0 transition-colors min-w-18.75 text-center shadow-sm ${timerClass}`}
        >
          {timeLeft > 0 ? `${timeLeft}s left` : 'Revealing...'}
        </span>
      </div>

      {/* VS row */}
      <div className="flex items-start justify-between gap-0.5 sm:gap-3 relative z-10">
        {/* Left player */}
        <div className="flex flex-col items-center flex-1 gap-2">
          <span className="font-bold text-sm text-center leading-tight min-h-7 flex items-center text-gray-800">
            {pending.playerA}
          </span>
          {canPick ? (
            <button
              onClick={() => onPick(pending.gameId, pending.playerA)}
              className={`${betBtnClass} ${oracleSide === 'left' ? 'oracle-glow-btn' : ''}`}
            >
              {oracleSide === 'left' ? '👁️ PICK' : cfg.label}
            </button>
          ) : (
            prediction?.pick === pending.playerA && (
              <span
                className={`text-[10px] font-black px-3 py-1 rounded-lg text-white uppercase tracking-widest ${cfg.confirmBg}`}
              >
                {prediction.confirmed ? 'PICKED' : 'CONFIRMING...'}
              </span>
            )
          )}
        </div>

        {/* VS divider */}
        <div className="flex flex-col items-center pt-2 shrink-0">
          <div className="flex items-center gap-0.5 sm:gap-2">
            <span
              className={`w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-lg font-black ${cfg.vsText}`}
            >
              ?
            </span>
            <span
              className={`text-[8px] sm:text-[10px] font-black uppercase ${cfg.vsText}`}
            >
              vs
            </span>
            <span
              className={`w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-lg font-black ${cfg.vsText}`}
            >
              ?
            </span>
          </div>
        </div>

        {/* Right player */}
        <div className="flex flex-col items-center flex-1 gap-2">
          <span className="font-bold text-sm text-center leading-tight min-h-7 flex items-center text-gray-800">
            {pending.playerB}
          </span>
          {canPick ? (
            <button
              onClick={() => onPick(pending.gameId, pending.playerB)}
              className={`${betBtnClass} ${oracleSide === 'right' ? 'oracle-glow-btn' : ''}`}
            >
              {oracleSide === 'right' ? '👁️ PICK' : cfg.label}
            </button>
          ) : (
            prediction?.pick === pending.playerB && (
              <span
                className={`text-[10px] font-black px-3 py-1 rounded-lg text-white uppercase tracking-widest ${cfg.confirmBg}`}
              >
                {prediction.confirmed ? 'PICKED' : 'CONFIRMING...'}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  )
}
