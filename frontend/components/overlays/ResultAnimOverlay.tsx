import GemIcon from '@/components/icons/GemIcon'
import { formatPoints, getAmountColor, getBonusStyles, getDisplayTierClass } from '@/lib/format'
import { BONUS_TIER_STYLES } from '@/lib/constants'
import type { BonusTier, ConfettiType, ResultAnim } from '@/types/rps'
import { useUserStore } from '@/app/stores/userStore'

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
  if (['hellfire', 'lunar', 'electric', 'cards'].includes(confettiType))
    return null
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

export default function ResultAnimOverlay({
  resultAnim,
  streakMult,
  animatedResult
}: ResultAnimOverlayProps) {
  const { stylePreference } = useUserStore()

  if (!resultAnim) return null

  const bonusTierKey = (resultAnim.bonus?.tier ?? 'COMMON') as BonusTier
  const bonusTierStyle =
    BONUS_TIER_STYLES[bonusTierKey] ?? BONUS_TIER_STYLES.COMMON
  const confettiType = resultAnim.confettiType ?? 'normal'
  const flashMult = resultAnim.flashMult ?? 1
  const flashType = resultAnim.flashEventType ?? null

  return (
    <div className="absolute -bottom-35 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col-reverse items-center w-full max-w-sm px-4">
      {/* Confetti */}
      {resultAnim.win && (
        <BottomConfetti
          confettiType={confettiType}
          confetti={resultAnim.confetti ?? []}
          bonus={resultAnim.bonus}
          streakAfter={resultAnim.streakAfter}
        />
      )}

      {/* Flash label */}
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

      {/* Streak badge + result number */}
      <div className="flex flex-col items-center">
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
        <span className="flex items-center gap-1 text-5xl sm:text-6xl font-black animate-bounce leading-tight drop-shadow-lg">
          {resultAnim.win ? (
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

      {/* bonus card */}
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
              </div>
            </div>
          )
        })()}
    </div>
  )
}
