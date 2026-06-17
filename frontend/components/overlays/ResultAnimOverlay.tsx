'use client'

import GemIcon from '@/components/icons/GemIcon'
import {
  formatPoints,
  getAmountColor,
  getBonusStyles,
  getDisplayTierClass
} from '@/lib/format'
import { BONUS_TIER_STYLES } from '@/lib/constants'
import type { BonusTier, ConfettiType, ResultAnim } from '@/types/rps'
import { useUserStore } from '@/app/stores/userStore'
import { useGameStore } from '@/app/stores/gameStore'
import { useEffect, useState, useRef } from 'react'
import { useSound } from '@/hooks/useSound'
import { slamState } from '@/lib/slamState'

interface ConfettiParticle {
  vx: number
  vy: number
  leftOffset: number
  delay: number
}

interface ResultAnimOverlayProps {
  resultAnim: ResultAnim | null
  streakMult: number
  animatedResult: bigint
}

const FESTIVAL_WIN_BADGE: Record<
  string,
  { name: string; effect: string; color: string }
> = {
  SURGE: { name: 'SURGE', effect: '2x all wins', color: '#22d3ee' },
  RESONANCE: {
    name: 'RESONANCE',
    effect: 'bonus guaranteed',
    color: '#ecc94b'
  },
  SPARK: { name: 'SPARK', effect: 'flash event active', color: '#a855f7' },
  VAULT: { name: 'VAULT', effect: 'relic rate x2', color: '#748ffc' },
  GHOST: { name: 'GHOST', effect: 'win echo +20%', color: '#4dd0c4' },
  SANGUINE: {
    name: 'SANGUINE',
    effect: '100% win (override)',
    color: '#991b1b'
  }
}

const FESTIVAL_LOSS_BADGE = {
  SAFEGUARD: {
    name: 'SAFEGUARD',
    effect: 'loss deduction 40%',
    color: '#94a3b8'
  },
  FEVER: { name: 'FEVER', effect: 'streak loss protected', color: '#f97316' }
}

const GLOBAL_EVENT_WIN_BADGE: Record<
  string,
  { name: string; effect: string; color: string; textClass: string }
> = {
  TIDAL_SURGE: {
    name: 'TIDAL SURGE',
    effect: '+20% echo',
    color: '#22d3ee',
    textClass: 'text-cyan-300'
  },
  SOLAR_FLARE: {
    name: 'SOLAR FLARE',
    effect: '2x win',
    color: '#fb923c',
    textClass: 'text-orange-300'
  },
  CYCLONE_BLITZ: {
    name: 'CYCLONE BLITZ',
    effect: '+1 streak',
    color: '#a3e635',
    textClass: 'text-lime-300'
  },
  MIRAGE_CATACLYSM: {
    name: 'MIRAGE CATACLYSM',
    effect: '',
    color: '#c084fc',
    textClass: 'text-purple-300'
  }
}
const FESTIVAL_CONFETTI_COLORS: Record<string, string[]> = {
  GHOST: ['#4dd0c4', '#b2f5ea', '#ffffff', '#0d9488', '#99f6e4'],
  SAFEGUARD: ['#94a3b8', '#cbd5e1', '#ffffff', '#64748b', '#e2e8f0'],
  RESONANCE: ['#ecc94b', '#f6e05e', '#fefce8', '#d69e2e', '#fbbf24'],
  SURGE: ['#22d3ee', '#a5f3fc', '#ffffff', '#06b6d4', '#cffafe'],
  VAULT: ['#748ffc', '#c8d3f5', '#ffffff', '#3b5bdb', '#e8eeff'],
  FEVER: ['#f97316', '#ef4444', '#fbbf24', '#fb923c', '#dc2626'],
  SANGUINE: ['#991b1b', '#fca5a5', '#ffffff', '#7f1d1d', '#fee2e2'],
  SPARK: ['#a855f7', '#e9d8fd', '#ffffff', '#7c3aed', '#f3e8ff']
}

function getConfettiColors(
  tier?: string,
  streak?: number,
  festivalType?: string | null
): string[] {
  if (festivalType && FESTIVAL_CONFETTI_COLORS[festivalType]) {
    return FESTIVAL_CONFETTI_COLORS[festivalType]!
  }
  if (streak && streak >= 5) return ['#f97316', '#ef4444', '#fbbf24', '#fb923c']
  if (streak && streak >= 3) return ['#22c55e', '#4ade80', '#86efac', '#16a34a']
  switch (tier) {
    case 'MYTHICAL':
      return ['#dc2626', '#ef4444', '#b91c1c', '#f87171', '#7f1d1d', '#fca5a5']
    case 'LEGENDARY':
      return ['#FFD700', '#FCD34D', '#F59E0B', '#FBBF24']
    case 'EPIC':
      return ['#A855F7', '#C084FC', '#7C3AED', '#F0ABFC', '#9333EA', '#E9D5FF']
    case 'RARE':
      return ['#60A5FA', '#3B82F6', '#93C5FD', '#2563EB']
    default:
      return ['#22C55E', '#4ADE80', '#86EFAC', '#16A34A']
  }
}

function BottomConfetti({
  confettiType,
  confetti,
  bonus,
  streakAfter,
  festivalType
}: {
  confettiType: ConfettiType
  confetti: ConfettiParticle[]
  bonus?: ResultAnim['bonus']
  streakAfter?: number
  festivalType?: string | null
}) {
  if (['hellfire', 'lunar', 'electric', 'cards'].includes(confettiType))
    return null

  const colors = getConfettiColors(bonus?.tier, streakAfter, festivalType)
  const isLarge = confettiType === 'fever' || confettiType === 'inferno'

  return (
    <div className="relative w-0 h-0">
      {confetti.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-sm pointer-events-none"
          style={
            {
              width: `${i % 3 === 0 ? (isLarge ? 9 : 8) : 6}px`,
              height: `${i % 3 === 0 ? (isLarge ? 11 : 10) : 8}px`,
              left: `${c.leftOffset}px`,
              top: 0,
              backgroundColor: colors[i % colors.length],
              boxShadow: festivalType
                ? `0 0 5px ${colors[i % colors.length]}`
                : undefined,
              animation: `confetti-burst 1.2s ease-out ${c.delay}s forwards`,
              '--vx': `${c.vx}px`,
              '--vy': `${c.vy}px`
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

function EchoBubble({
  amount,
  side,
  colorClass,
  label
}: {
  amount: bigint
  side: 'left' | 'right'
  colorClass: string
  label: string
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 400)
    return () => clearTimeout(t)
  }, [amount])

  if (!show || amount === 0n) return null

  const sideStyle =
    side === 'left'
      ? 'left-[-45%] sm:left-[-55%] -rotate-12'
      : 'right-[-45%] sm:right-[-55%] rotate-12'

  return (
    <div
      className={`absolute pointer-events-none ghost-echo-wrap flex flex-col items-center select-none ${sideStyle}`}
    >
      <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </span>
      <span
        className={`ghost-echo text-2xl sm:text-3xl font-black tabular-nums tracking-tighter ${colorClass}`}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))'
        }}
      >
        +{formatPoints(amount).display}
      </span>
    </div>
  )
}

function RelicSlamOverlay({
  show,
  multiplier,
  preSoulAmount,
  finalAmount
}: {
  show: boolean
  multiplier: 2 | 3
  preSoulAmount: bigint
  finalAmount: bigint
}) {
  const [phase, setPhase] = useState<'slam' | 'tick'>('slam')
  const [displayAmount, setDisplayAmount] = useState(preSoulAmount)
  const rafRef = useRef<number | null>(null)

  const tierKey = multiplier === 3 ? 'MYTHICAL' : 'LEGENDARY'
  const style = BONUS_TIER_STYLES[tierKey]
  const visual = getBonusStyles(tierKey)
  const isMythical = multiplier === 3
  const glowClass = isMythical ? 'mythical-slam-glow' : 'legendary-slam-glow'

  useEffect(() => {
    if (!show) return

    let isMounted = true
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const base = preSoulAmount
    const diff = finalAmount > base ? finalAmount - base : 0n
    setDisplayAmount(base)

    const t = setTimeout(() => {
      if (!isMounted) return
      setPhase('tick')
      const start = Date.now()
      const duration = 2500

      const tick = () => {
        if (!isMounted) return
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 4)
        const easedScaled = BigInt(Math.floor(eased * 10000))
        setDisplayAmount(base + (diff * easedScaled) / 10000n)
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setDisplayAmount(finalAmount)
          slamState.active = false
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }, 500)

    return () => {
      isMounted = false
      clearTimeout(t)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [show, finalAmount, preSoulAmount])

  if (!show) return null

  return (
    <div
      className={`fixed inset-x-0 top-[15%] flex flex-col items-center pointer-events-none z-999 gap-2 ${phase === 'slam' ? 'animate-light-shake' : ''}`}
    >
      <div
        className={`slam-drop-in font-black tabular-nums ${style.color} ${glowClass}`}
        style={{
          fontSize: isMythical ? '9rem' : '7rem',
          lineHeight: 1,
          textShadow: isMythical
            ? '0 0 40px rgba(220,38,38,0.9), 0 0 80px rgba(220,38,38,0.5), 0 4px 20px rgba(0,0,0,0.8)'
            : '0 0 40px rgba(234,179,8,0.9), 0 0 80px rgba(234,179,8,0.5), 0 4px 20px rgba(0,0,0,0.8)',
          WebkitTextStroke: isMythical
            ? '2px rgba(255,100,100,0.3)'
            : '2px rgba(255,220,50,0.3)'
        }}
      >
        x{multiplier}
      </div>

      <div
        className={`transition-all duration-500 ${phase === 'tick' ? 'opacity-100 scale-100' : 'opacity-100 scale-95'}`}
      >
        <div
          className={`relative overflow-hidden p-6 sm:p-8 rounded-4xl border-2 bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] min-w-65 ${style.cardClass} ${visual.glow}`}
        >
          <div className="flex flex-col items-center px-4 text-center gap-3">
            <div
              className={`badge-aura-wrapper ${style.auraClass} inline-flex items-center`}
            >
              <span
                className={`text-[10px] px-5 py-1.5 font-black uppercase tracking-[0.25em] rounded-full border relative z-10 bg-white ${style.color} border-black/5`}
              >
                {isMythical ? 'Machine Soul' : 'Kinetic Capacitor'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span
                className={`text-4xl sm:text-5xl font-black tabular-nums tracking-tighter ${getAmountColor(displayAmount)}`}
              >
                +{formatPoints(displayAmount).display}
              </span>
              <GemIcon size={36} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResultAnimOverlay({
  resultAnim,
  streakMult,
  animatedResult
}: ResultAnimOverlayProps) {
  const { stylePreference } = useUserStore()
  const festivalType = useGameStore((s) => s.festivalType)
  const activeFestival = useGameStore((s) => s.activeFestival)

  const [slamActive, setSlamActive] = useState(false)
  const slamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { playJackpot } = useSound()

  const willSlam = !!(
    resultAnim?.win &&
    (resultAnim.soulProc || resultAnim.kineticFired)
  )
  const slamIdRef = useRef(0)
  const lastSlamResultRef = useRef<ResultAnim | null>(null)

  useEffect(() => {
    if (slamTimerRef.current) clearTimeout(slamTimerRef.current)
    setSlamActive(false)

    if (!willSlam || resultAnim === lastSlamResultRef.current) return

    lastSlamResultRef.current = resultAnim
    const thisSlam = ++slamIdRef.current

    slamTimerRef.current = setTimeout(() => {
      if (slamIdRef.current !== thisSlam) return
      setSlamActive(true)
      slamState.active = true
      playJackpot()
    }, 2400)

    return () => {
      if (slamTimerRef.current) clearTimeout(slamTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [willSlam, resultAnim])

  const slamPropsRef = useRef({
    multiplier: 2 as 2 | 3,
    preSoulAmount: 0n,
    finalAmount: 0n
  })
  if (resultAnim?.win && (resultAnim.soulProc || resultAnim.kineticFired)) {
    slamPropsRef.current = {
      multiplier: resultAnim.soulProc ? 3 : 2,
      preSoulAmount: resultAnim.preSoulAmount ?? 0n,
      finalAmount: resultAnim.amount
    }
  }

  if (!resultAnim) return null

  const bonusTierKey = (resultAnim.bonus?.tier ?? 'COMMON') as BonusTier
  const bonusTierStyle =
    BONUS_TIER_STYLES[bonusTierKey] ?? BONUS_TIER_STYLES.COMMON
  const confettiType = resultAnim.confettiType ?? 'normal'
  const flashMult = resultAnim.flashMult ?? 1
  const flashType = resultAnim.flashEventType ?? null
  const isWin = resultAnim.win

  const activeFestivalType = activeFestival && !flashType ? festivalType : null

  const festivalBadge =
    activeFestival && festivalType
      ? isWin
        ? (FESTIVAL_WIN_BADGE[festivalType] ?? null)
        : festivalType in FESTIVAL_LOSS_BADGE
          ? FESTIVAL_LOSS_BADGE[
              festivalType as keyof typeof FESTIVAL_LOSS_BADGE
            ]
          : null
      : null

  const globalEventBadge =
    isWin && resultAnim.globalEventType
      ? (() => {
          const entry = GLOBAL_EVENT_WIN_BADGE[resultAnim.globalEventType]
          if (!entry) return null
          let effect = entry.effect
          if (
            resultAnim.globalEventType === 'MIRAGE_CATACLYSM' &&
            resultAnim.globalEchoAmount != null &&
            resultAnim.globalEchoAmount > 0n
          ) {
            const base = resultAnim.amount - resultAnim.globalEchoAmount
            const pct =
              base > 0n
                ? Math.round(
                    Number((resultAnim.globalEchoAmount * 100n) / base)
                  )
                : 0
            effect = `+${pct}% echo`
          }
          return { ...entry, effect }
        })()
      : null

  const isGhostActive = activeFestival && festivalType === 'GHOST' && isWin

  const slamMultiplier = slamPropsRef.current.multiplier
  const preSoulAmount = slamPropsRef.current.preSoulAmount

  const adjustedScale =
    bonusTierKey === 'MYTHICAL'
      ? 'scale-[1.15]'
      : bonusTierKey === 'LEGENDARY'
        ? 'scale-[1.1]'
        : bonusTierKey === 'EPIC'
          ? 'scale-[1.05]'
          : 'scale-100'

  return (
    <div className="absolute -bottom-35 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col-reverse items-center w-full max-w-sm px-4">
      {isWin && (
        <BottomConfetti
          confettiType={confettiType}
          confetti={resultAnim.confetti ?? []}
          bonus={resultAnim.bonus}
          streakAfter={resultAnim.streakAfter}
          festivalType={activeFestivalType}
        />
      )}

      {flashMult > 1 && flashType && (
        <div
          className={`mb-2 px-4 py-1.5 rounded-xl border font-black text-sm uppercase tracking-widest text-center animate-in zoom-in duration-200 ${
            flashType === 'LUNAR'
              ? 'bg-blue-950/80 border-[rgba(144,205,244,0.7)]'
              : flashType === 'ELECTRIC'
                ? 'bg-purple-950/80 border-[rgba(159,122,234,0.7)]'
                : flashType === 'CARDS'
                  ? 'bg-yellow-950/80 border-[rgba(236,201,75,0.7)]'
                  : 'bg-red-950/80 border-[rgba(220,38,38,0.7)]'
          }`}
        >
          <span className="text-white/50 font-bold text-xs mr-1.5">
            x{flashMult}
          </span>
          <span
            className={
              flashType === 'LUNAR'
                ? 'g-dvg'
                : flashType === 'ELECTRIC'
                  ? 'g-tvg'
                  : flashType === 'CARDS'
                    ? 'g-qiv'
                    : 'g-spv'
            }
          >
            {flashType === 'LUNAR'
              ? "Moon's Blessing"
              : flashType === 'ELECTRIC'
                ? 'Electric Surge'
                : flashType === 'CARDS'
                  ? 'Luck in the Cards'
                  : 'Hellfire'}
          </span>
        </div>
      )}

      <div className="flex flex-col items-center relative pt-6">
        {isWin && (resultAnim.streakAfter ?? 0) >= 3 && (
          <div
            className={`mb-2 px-3 py-1 rounded-lg border font-black text-xs uppercase tracking-widest text-center animate-in zoom-in duration-200 ${
              (resultAnim.streakAfter ?? 0) >= 5
                ? 'bg-orange-950 border-orange-500 text-orange-400 streak-fire-text'
                : 'bg-green-950 border-green-500 text-green-400'
            }`}
          >
            x{streakMult} STREAK BONUS
          </div>
        )}

        {festivalBadge && (
          <div
            className="mb-2 px-3 py-1 rounded-lg border-2 font-black text-[10px] uppercase tracking-widest text-center animate-in zoom-in duration-200"
            style={{
              background: `color-mix(in srgb, ${festivalBadge.color} 20%, #000000 80%)`,
              borderColor: festivalBadge.color,
              boxShadow: `0 0 12px ${festivalBadge.color}60`
            }}
          >
            <span style={{ color: festivalBadge.color }}>
              {festivalBadge.name} FESTIVAL
            </span>
            <span className="text-white/40 mx-1.5">·</span>
            <span style={{ color: `${festivalBadge.color}dd` }}>
              {festivalBadge.effect}
            </span>
          </div>
        )}

        {globalEventBadge && (
          <div
            className="mb-2 px-3 py-1 rounded-lg border-2 font-black text-[10px] uppercase tracking-widest text-center animate-in zoom-in duration-200"
            style={{
              background: `color-mix(in srgb, ${globalEventBadge.color} 20%, #000000 80%)`,
              borderColor: globalEventBadge.color,
              boxShadow: `0 0 12px ${globalEventBadge.color}60`
            }}
          >
            <span style={{ color: globalEventBadge.color }}>
              {globalEventBadge.name}
            </span>
            <span className="text-white/40 mx-1.5">·</span>
            <span style={{ color: `${globalEventBadge.color}dd` }}>
              {globalEventBadge.effect}
            </span>
          </div>
        )}

        <div className="relative result-number-wrap">
          {/* Ghost Festival Echo */}
          {isGhostActive && resultAnim.ghostEchoAmount && (
            <EchoBubble
              amount={resultAnim.ghostEchoAmount}
              side="left"
              colorClass="text-teal-600"
              label="Ghost Echo"
            />
          )}

          {/* Global Event Echoes */}
          {resultAnim.globalEchoAmount && resultAnim.globalEventType && (
            <EchoBubble
              amount={resultAnim.globalEchoAmount}
              side="right"
              colorClass={
                resultAnim.globalEventType === 'TIDAL_SURGE'
                  ? 'text-sky-600'
                  : 'text-amber-600'
              }
              label={
                resultAnim.globalEventType === 'TIDAL_SURGE'
                  ? 'Tidal Echo'
                  : 'Mirage Echo'
              }
            />
          )}

          {(willSlam || slamActive) && (
            <RelicSlamOverlay
              key={slamMultiplier}
              show={slamActive}
              multiplier={slamMultiplier}
              preSoulAmount={preSoulAmount}
              finalAmount={slamPropsRef.current.finalAmount}
            />
          )}

          <span
            className={`flex items-center gap-1 text-5xl sm:text-6xl font-black animate-bounce leading-tight drop-shadow-lg transition-all duration-500 ${
              slamActive
                ? 'opacity-0 scale-75 blur-sm'
                : 'opacity-100 scale-100 blur-0'
            }`}
          >
            {isWin ? (
              <>
                <span className="text-green-500">+</span>
                <span className="text-5xl sm:text-6xl font-black">
                  <span
                    className={getDisplayTierClass(
                      animatedResult,
                      stylePreference
                    )}
                  >
                    {
                      formatPoints(
                        willSlam
                          ? slamPropsRef.current.preSoulAmount
                          : animatedResult
                      ).display
                    }
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className="text-red-500">-</span>
                <span className="text-5xl sm:text-6xl font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  <span
                    className={getDisplayTierClass(
                      animatedResult,
                      stylePreference
                    )}
                  >
                    {formatPoints(animatedResult).display}
                  </span>
                </span>
              </>
            )}
          </span>
        </div>
      </div>

      {resultAnim.bonus &&
        !slamActive &&
        (() => {
          const visual = getBonusStyles(bonusTierKey)
          const bonusMultDisplay = (
            (resultAnim.bonus.visualMultiplier ?? 0) / 100
          ).toFixed(1)
          return (
            <div
              className={`relative overflow-hidden w-fit mx-auto p-4 rounded-3xl border-2 mb-3 animate-in zoom-in slide-in-from-bottom-4 duration-300 ${bonusTierStyle.cardClass} ${adjustedScale} ${visual.glow}`}
            >
              <div className="flex flex-col items-center px-4 text-center gap-1">
                <div
                  className={`badge-aura-wrapper ${bonusTierStyle.auraClass} inline-flex items-center`}
                >
                  <span
                    className={`text-[10px] px-2.5 py-0.5 font-black uppercase tracking-widest rounded-full border relative z-10 ${
                      bonusTierKey === 'MYTHICAL'
                        ? 'text-red-300 border-red-600 bg-red-950'
                        : bonusTierKey === 'LEGENDARY'
                          ? 'text-yellow-700 border-yellow-500 bg-yellow-50'
                          : `${bonusTierStyle.color} ${bonusTierStyle.bg} border-black/5`
                    }`}
                  >
                    {visual.label} {bonusMultDisplay}x
                  </span>
                </div>
                {!isWin && (
                  <div
                    className={`text-[14px] font-black uppercase italic tracking-tighter leading-none ${bonusTierStyle.color}`}
                  >
                    Lucky Save
                  </div>
                )}
                <div
                  className={`flex items-center gap-2 transition-all ${visual.glow}`}
                >
                  <span className="text-2xl sm:text-3xl font-black tabular-nums tracking-tighter">
                    <span
                      className={getAmountColor(
                        BigInt(resultAnim.bonus.amount)
                      )}
                    >
                      {isWin ? '+' : ''}
                      {formatPoints(resultAnim.bonus.amount).display}
                    </span>
                  </span>
                  <GemIcon size={20} />
                </div>
              </div>
            </div>
          )
        })()}
    </div>
  )
}
