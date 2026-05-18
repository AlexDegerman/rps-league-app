import GemIcon from '@/components/icons/GemIcon'
import { formatPoints, getAmountColor, getBonusStyles } from '@/lib/format'
import { BONUS_TIER_STYLES } from '@/lib/constants'
import type { BonusTier, ConfettiType, ResultAnim } from '@/types/rps'

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

function getConfettiColors(tier?: string, streak?: number): string[] {
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
  streakAfter
}: {
  confettiType: ConfettiType
  confetti: ConfettiParticle[]
  bonus?: ResultAnim['bonus']
  streakAfter?: number
}) {
  if (confettiType === 'fever') {
    const colors = [
      '#22c55e',
      '#4ade80',
      '#86efac',
      '#16a34a',
      '#bbf7d0',
      '#15803d'
    ]
    return (
      <div className="relative w-0 h-0">
        {confetti.map((c, i) => (
          <div
            key={i}
            className="absolute rounded-sm pointer-events-none"
            style={
              {
                width: `${i % 3 === 0 ? 9 : 6}px`,
                height: `${i % 3 === 0 ? 11 : 8}px`,
                left: `${c.leftOffset}px`,
                top: 0,
                backgroundColor: colors[i % colors.length],
                boxShadow: `0 0 4px ${colors[i % colors.length]}`,
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

  if (confettiType === 'inferno') {
    const colors = [
      '#f97316',
      '#ef4444',
      '#fbbf24',
      '#fb923c',
      '#dc2626',
      '#fed7aa'
    ]
    return (
      <div className="relative w-0 h-0">
        {confetti.map((c, i) => (
          <div
            key={i}
            className="absolute rounded-sm pointer-events-none"
            style={
              {
                width: `${i % 3 === 0 ? 9 : 6}px`,
                height: `${i % 3 === 0 ? 11 : 8}px`,
                left: `${c.leftOffset}px`,
                top: 0,
                backgroundColor: colors[i % colors.length],
                boxShadow: `0 0 5px ${colors[i % colors.length]}`,
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

  if (['hellfire', 'lunar', 'electric', 'cards'].includes(confettiType)) {
    return null
  }

  const colors = getConfettiColors(bonus?.tier, streakAfter)
  return (
    <div className="relative w-0 h-0">
      {confetti.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-sm pointer-events-none"
          style={
            {
              width: `${i % 3 === 0 ? 8 : 6}px`,
              height: `${i % 3 === 0 ? 10 : 8}px`,
              left: `${c.leftOffset}px`,
              top: 0,
              backgroundColor: colors[i % colors.length],
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

const FLASH_BADGE_STYLES: Record<string, string> = {
  HELLFIRE: 'bg-red-900/80 text-red-200 border-red-500/40',
  LUNAR: 'bg-blue-900/80 text-blue-200 border-blue-400/40',
  ELECTRIC: 'bg-purple-900/80 text-purple-200 border-purple-400/40',
  CARDS: 'bg-yellow-900/80 text-yellow-200 border-yellow-400/40'
}

export default function ResultAnimOverlay({
  resultAnim,
  streakMult,
  animatedResult
}: ResultAnimOverlayProps) {
  if (!resultAnim) return null

  const bonusTierKey = (resultAnim.bonus?.tier ?? 'COMMON') as BonusTier
  const bonusTierStyle =
    BONUS_TIER_STYLES[bonusTierKey] ?? BONUS_TIER_STYLES.COMMON
  const confettiType = resultAnim.confettiType ?? 'normal'
  const flashMult = resultAnim.flashMult ?? 1
  const flashType = resultAnim.flashEventType ?? null

  return (
    <div className="absolute -bottom-35 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col-reverse items-center w-full max-w-sm px-4">
      <span className="flex items-center gap-1 text-5xl sm:text-6xl font-black animate-bounce leading-tight drop-shadow-lg">
        {resultAnim.win && (resultAnim.streakAfter ?? 0) >= 3 && (
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
        {resultAnim.win ? (
          <>
            <span className="text-green-500">+</span>
            <span className="text-5xl sm:text-6xl font-black">
              <span className={getAmountColor(animatedResult)}>
                {formatPoints(animatedResult).display}
              </span>
            </span>
          </>
        ) : (
          <>
            <span className="text-red-500">-</span>
            <span className="text-5xl sm:text-6xl font-black">
              <span className={getAmountColor(animatedResult)}>
                {formatPoints(animatedResult).display}
              </span>
            </span>
          </>
        )}
      </span>

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

                {!resultAnim.win && (
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
                      {resultAnim.win ? '+' : ''}
                      {formatPoints(resultAnim.bonus.amount).display}
                    </span>
                  </span>
                  <GemIcon size={20} />
                </div>

                {resultAnim.win && flashMult > 1 && flashType && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                      then
                    </span>
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                        FLASH_BADGE_STYLES[flashType] ??
                        'bg-gray-800 text-white border-gray-600'
                      }`}
                    >
                      {flashMult}× {flashType}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

      {resultAnim.win && (
        <BottomConfetti
          confettiType={confettiType}
          confetti={resultAnim.confetti ?? []}
          bonus={resultAnim.bonus}
          streakAfter={resultAnim.streakAfter}
        />
      )}
    </div>
  )
}
