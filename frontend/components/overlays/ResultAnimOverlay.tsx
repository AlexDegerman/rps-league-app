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
import { useEffect, useState } from 'react'

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
  SURGE: { name: 'SURGE', effect: '3× all wins', color: '#22d3ee' },
  RESONANCE: {
    name: 'RESONANCE',
    effect: 'bonus guaranteed',
    color: '#ecc94b'
  },
  SPARK: { name: 'SPARK', effect: 'flash event active', color: '#a855f7' },
  VAULT: { name: 'VAULT', effect: 'relic rate ×2', color: '#748ffc' },
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

// Festival confetti color palettes - override streak/bonus colors when festival active
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
  // Festival overrides everything including streak and bonus tier
  if (festivalType && FESTIVAL_CONFETTI_COLORS[festivalType]) {
    return FESTIVAL_CONFETTI_COLORS[festivalType]!
  }
  if (streak && streak >= 5) return ['#f97316', '#ef4444', '#fbbf24', '#fb923c']
  if (streak && streak >= 3) return ['#22c55e', '#4ade80', '#86efac', '#16a34a']
  switch (tier) {
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

  // Festival overrides fever/inferno/normal color palettes
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
              width: `${i % 3 === 0 ? (isLarge ? 9 : 8) : isLarge ? 6 : 6}px`,
              height: `${i % 3 === 0 ? (isLarge ? 11 : 10) : isLarge ? 8 : 8}px`,
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

function GhostEcho({ amount }: { amount: bigint }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 400) // was 1100
    return () => clearTimeout(t)
  }, [amount])

  if (!show || amount === 0n) return null

  return (
    <div className="absolute pointer-events-none ghost-echo-wrap">
      <span className="ghost-echo text-3xl sm:text-4xl font-black tabular-nums tracking-tighter text-teal-300">
        +{formatPoints(amount).display}
      </span>
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

  if (!resultAnim) return null

  const bonusTierKey = (resultAnim.bonus?.tier ?? 'COMMON') as BonusTier
  const bonusTierStyle =
    BONUS_TIER_STYLES[bonusTierKey] ?? BONUS_TIER_STYLES.COMMON
  const confettiType = resultAnim.confettiType ?? 'normal'
  const flashMult = resultAnim.flashMult ?? 1
  const flashType = resultAnim.flashEventType ?? null

  const isWin = resultAnim.win

  // Only apply festival context when no flash event is active
  // Flash events own their own confetti and visual systems
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

  const isGhostActive = activeFestival && festivalType === 'GHOST' && isWin

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

        <div className="relative result-number-wrap">
          {isGhostActive && resultAnim.ghostEchoAmount && (
            <GhostEcho amount={resultAnim.ghostEchoAmount} />
          )}
          <span className="flex items-center gap-1 text-5xl sm:text-6xl font-black animate-bounce leading-tight drop-shadow-lg">
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
                    {formatPoints(animatedResult).display}
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
        (() => {
          const visual = getBonusStyles(bonusTierKey)
          const adjustedScale =
            bonusTierKey === 'LEGENDARY'
              ? 'scale-[1.1]'
              : bonusTierKey === 'EPIC'
                ? 'scale-[1.05]'
                : 'scale-100'
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
                      bonusTierKey === 'LEGENDARY'
                        ? 'text-yellow-700 border-yellow-500 bg-yellow-50'
                        : `${bonusTierStyle.color} ${bonusTierStyle.bg} border-black/5`
                    }`}
                  >
                    {visual.label} {bonusMultDisplay}×
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
