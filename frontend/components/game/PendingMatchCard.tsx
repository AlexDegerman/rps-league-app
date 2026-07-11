'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import type { PendingMatch, PredictionRecord } from '@/types/rps'
import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import RevealAnimation from './RevealAnimation'

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

function PendingMatchCardComponent({
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
  const [revealPhase, setRevealPhase] = useState<'idle' | 'animating' | 'done'>(
    'idle'
  )
  const revealTriggeredRef = useRef(false)
  const revealResults = useGameStore((s) => s.revealResults)
  const revealResult = revealResults.get(pending.gameId)

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)

      if (remaining <= 1.0 && !revealTriggeredRef.current) {
        revealTriggeredRef.current = true
        setRevealPhase('animating')
      }

      if (remaining <= 0) clearInterval(id)
    }, 100)
    return () => clearInterval(id)
  }, [calculateTimeLeft])

  const canPick = timeLeft > 0 && !prediction

  const storeVisualMode = useGameStore((s) => s.visualMode)
  const storeFestivalModeKey = useGameStore((s) => s.festivalModeKey)
  const notification = useUIStore((s) => s.notification)
  const isNewUser = notification === 'new_visitor'

  const activeVisualMode = visualMode || storeVisualMode
  const activeFestivalKey = festivalModeKey || storeFestivalModeKey

  const modeKey = activeVisualMode || activeFestivalKey || null

  const isInferno = winStreak >= 5
  const isFever = winStreak >= 3 && winStreak < 5

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
    // Global Events
    global_tidal_surge: {
      border: 'border-cyan-300',
      card: 'bg-gradient-to-b from-white to-cyan-50/40',
      glowColor: 'rgba(34,211,238,0.07)',
      cardAnim: 'tidal-ring',
      dateText: 'text-cyan-600/70',
      vsText: 'text-cyan-300',
      btnClass: 'bg-cyan-500 hover:bg-cyan-600 text-white',
      label: '🌊 PICK',
      confirmBg: 'bg-cyan-500'
    },
    global_solar_flare: {
      border: 'border-amber-400',
      card: 'bg-gradient-to-b from-white to-amber-50/40',
      glowColor: 'rgba(245,158,11,0.07)',
      cardAnim: 'solar-ring',
      dateText: 'text-amber-600/70',
      vsText: 'text-amber-300',
      btnClass: 'bg-amber-500 hover:bg-amber-600 text-white',
      label: '☀️ PICK',
      confirmBg: 'bg-amber-500'
    },
    global_cyclone_blitz: {
      border: 'border-slate-300',
      card: 'bg-gradient-to-b from-white to-slate-50/40',
      glowColor: 'rgba(148,163,184,0.07)',
      cardAnim: 'cyclone-ring',
      dateText: 'text-slate-500/70',
      vsText: 'text-slate-300',
      btnClass: 'bg-slate-500 hover:bg-slate-600 text-white',
      label: '🌀 PICK',
      confirmBg: 'bg-slate-500'
    },
    global_mirage_cataclysm: {
      border: 'border-purple-300',
      card: 'bg-gradient-to-b from-white to-purple-50/40',
      glowColor: 'rgba(168,85,247,0.07)',
      cardAnim: 'mirage-ring',
      dateText: 'text-purple-600/70',
      vsText: 'text-amber-300',
      btnClass: 'bg-gradient-to-r from-purple-500 to-amber-500 text-white',
      label: '🏜️ PICK',
      confirmBg: 'bg-amber-500'
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
    modeKey
      ? modeKey
      : isInferno
        ? 'winstreak_inferno'
        : isFever
          ? 'winstreak_fever'
          : 'default'
  ) as keyof typeof modeConfig

  const cfg = modeConfig[activeKey] ?? modeConfig.default
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

  let leftMove: 'ROCK' | 'PAPER' | 'SCISSORS' | null = null
  let rightMove: 'ROCK' | 'PAPER' | 'SCISSORS' | null = null
  let winningSide: 'left' | 'right' | 'draw' | null = null
  let outcomeRewritten = false

  if (revealResult) {
    const isAOnLeft = revealResult.playerA.name === pending.playerA
    const leftPlayer = isAOnLeft ? revealResult.playerA : revealResult.playerB
    const rightPlayer = isAOnLeft ? revealResult.playerB : revealResult.playerA

    leftMove = leftPlayer.played as 'ROCK' | 'PAPER' | 'SCISSORS'
    rightMove = rightPlayer.played as 'ROCK' | 'PAPER' | 'SCISSORS'
    outcomeRewritten = !!revealResult.outcomeRewritten

    if (leftMove === rightMove) {
      winningSide = 'draw'
    } else if (
      (leftMove === 'ROCK' && rightMove === 'SCISSORS') ||
      (leftMove === 'SCISSORS' && rightMove === 'PAPER') ||
      (leftMove === 'PAPER' && rightMove === 'ROCK')
    ) {
      winningSide = 'left'
    } else {
      winningSide = 'right'
    }
  }

  return (
    <div
      className={`relative z-0 rounded-xl shadow-sm border-2 py-2 px-3 sm:p-4 mb-3 animate-in fade-in zoom-in duration-300 overflow-hidden
        ${cfg.border} ${cfg.cardAnim}`}
    >
      <div className="absolute inset-0 bg-white -z-20" />
      <div className={`absolute inset-0 -z-10 ${cfg.card}`} />

      {/* Ambient glow layer */}
      {isActive && cfg.glowColor && (
        <div
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            background: `radial-gradient(ellipse at top, ${cfg.glowColor} 0%, transparent 70%)`
          }}
        />
      )}

      {/* Top row: Timer only */}
      <div className="flex items-center justify-between relative z-10 px-1 mb-1">
        <span className="text-[11px] font-bold text-gray-400 truncate w-[35%] text-left leading-tight">
          {pending.playerA}
        </span>
        <span
          className={`text-[13px] font-black px-3 py-1 rounded-lg shrink-0 transition-colors min-w-18.75 text-center shadow-sm ${timerClass}`}
        >
          {timeLeft > 0 ? `${timeLeft}s left` : 'Revealing...'}
        </span>
        <span className="text-[11px] font-bold text-gray-400 truncate w-[35%] text-right leading-tight">
          {pending.playerB}
        </span>
      </div>

      {/* Name & Duel Row */}
      <div className="flex justify-center items-center h-9 mb-2 relative z-10">
        <div className="shrink-0 w-28 sm:w-36 px-1">
          {/* VS divider, becomes RevealAnimation when timer expires */}
          {revealPhase !== 'idle' ? (
            <RevealAnimation
              leftMove={leftMove}
              rightMove={rightMove}
              winningSide={winningSide}
              outcomeRewritten={outcomeRewritten}
              onDone={() => setRevealPhase('done')}
            />
          ) : (
            <div className="flex items-center justify-between w-full px-1">
              <span
                className={`w-9 h-9 flex items-center justify-center text-lg font-black ${cfg.vsText}`}
              >
                ?
              </span>
              <span
                className={`text-[10px] font-black uppercase ${cfg.vsText}`}
              >
                vs
              </span>
              <span
                className={`w-9 h-9 flex items-center justify-center text-lg font-black ${cfg.vsText}`}
              >
                ?
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Pick Buttons / Badges */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        {/* Left Button / Badge */}
        <div className="flex-1 flex justify-center">
          {canPick ? (
            <button
              onClick={() => onPick(pending.gameId, pending.playerA)}
              className={`${betBtnClass} ${oracleSide === 'left' ? 'oracle-glow-btn' : isNewUser ? 'new-user-glow-btn' : ''}`}
            >
              {oracleSide === 'left' ? '👁️ PICK' : cfg.label}
            </button>
          ) : prediction?.pick === pending.playerA ? (
            <span
              className={`text-[10px] font-black px-4 py-2 rounded-lg text-white uppercase tracking-widest text-center w-full ${cfg.confirmBg}`}
            >
              {prediction.confirmed ? 'PICKED' : 'CONFIRMING...'}
            </span>
          ) : (
            <div className="h-10 w-full" />
          )}
        </div>

        {/* Right Button / Badge */}
        <div className="flex-1 flex justify-center">
          {canPick ? (
            <button
              onClick={() => onPick(pending.gameId, pending.playerB)}
              className={`${betBtnClass} ${oracleSide === 'right' ? 'oracle-glow-btn' : isNewUser ? 'new-user-glow-btn' : ''}`}
            >
              {oracleSide === 'right' ? '👁️ PICK' : cfg.label}
            </button>
          ) : prediction?.pick === pending.playerB ? (
            <span
              className={`text-[10px] font-black px-4 py-2 rounded-lg text-white uppercase tracking-widest text-center w-full ${cfg.confirmBg}`}
            >
              {prediction.confirmed ? 'PICKED' : 'CONFIRMING...'}
            </span>
          ) : (
            <div className="h-10 w-full" />
          )}
        </div>
      </div>
    </div>
  )
}

const PendingMatchCard = React.memo(
  PendingMatchCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.pending.gameId === nextProps.pending.gameId &&
      prevProps.pending.expiresAt === nextProps.pending.expiresAt &&
      prevProps.prediction?.confirmed === nextProps.prediction?.confirmed &&
      prevProps.prediction?.pick === nextProps.prediction?.pick &&
      prevProps.serverOffset === nextProps.serverOffset &&
      prevProps.winStreak === nextProps.winStreak &&
      prevProps.visualMode === nextProps.visualMode &&
      prevProps.festivalModeKey === nextProps.festivalModeKey &&
      prevProps.oracleSide === nextProps.oracleSide &&
      prevProps.onPick === nextProps.onPick
    )
  }
)

PendingMatchCard.displayName = 'PendingMatchCard'
export default PendingMatchCard
