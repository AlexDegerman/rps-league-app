'use client'

import { useState } from 'react'
import { useGameStore } from '../../app/stores/gameStore'
import { postBonusAction, claimBonusWinnings } from '../../lib/api'
import { getOrCreateUser } from '../../lib/user'
import { formatPoints } from '../../lib/format'
import { useNeonSound } from '../../hooks/useNeonSound'

const STEP_PAYOUTS: Record<number, number> = { 0: 2, 1: 4, 2: 6, 3: 10 }
const STEP_COLORS = ['#94a3b8', '#22d3ee', '#a855f7', '#f59e0b']

export default function DoubleDownStage() {
  const bonusGridState = useGameStore((s) => s.bonusGridState)
  const bonusLastBet = useGameStore((s) => s.bonusLastBet)
  const updateBonusReward = useGameStore((s) => s.updateBonusReward)
  const setBonusFinalPayout = useGameStore((s) => s.setBonusFinalPayout)

  const reconnect = bonusGridState as {
    currentStep?: number
    terminal?: boolean
    lastRoll?: 'WIN' | 'LOSS' | null
  } | null

  const [step, setStep] = useState(reconnect?.currentStep ?? 0)
  const [terminal, setTerminal] = useState(reconnect?.terminal ?? false)
  const [lastRoll, setLastRoll] = useState<'WIN' | 'LOSS' | null>(
    reconnect?.lastRoll ?? null
  )
  const [loading, setLoading] = useState(false)
  const { playNeonReward, playNeonComplete, playLoss } =
    useNeonSound()

  const currentMultiplier = STEP_PAYOUTS[step] ?? 2
  const currentReward = bonusLastBet * BigInt(currentMultiplier)

  const sendAction = async (action: 'GAMBLE' | 'CLAIM') => {
    if (terminal || loading) return
    const { userId } = getOrCreateUser()
    setLoading(true)
    try {
      const result = await postBonusAction(userId, { action })
      if (!result?.session) return
      const session = result.session as {
        accumulatedPayout: string
        stageStepsCompleted: number
        gridState: {
          terminal: boolean
          won: boolean | null
          lastRoll: 'WIN' | 'LOSS' | null
        } | null
      }
      const grid = session.gridState
      const newStep = session.stageStepsCompleted
      const isTerminal = grid?.terminal ?? false
      setStep(newStep)
      setLastRoll(grid?.lastRoll ?? null)
      setTerminal(isTerminal)
      updateBonusReward(BigInt(session.accumulatedPayout))

      if (action === 'GAMBLE') {
        if (grid?.lastRoll === 'LOSS') {
          playLoss()
        } else if (grid?.lastRoll === 'WIN') {
          playNeonReward(STEP_PAYOUTS[newStep] ?? 2)
        }
      }

      if (action === 'CLAIM' || isTerminal) {
        setTimeout(async () => {
          const claimResult = await claimBonusWinnings(userId)
          if (claimResult?.finalPayout) {
            const isJackpot =
              STEP_PAYOUTS[newStep] >= 10 && grid?.lastRoll === 'WIN'
            const isLoss = grid?.lastRoll === 'LOSS'

            const metricText = isJackpot
              ? 'Jackpot : 3/3 Steps Completed'
              : isLoss
                ? `Failed on Step ${newStep + 1} : 2x Floor Locked`
                : `Claimed Winnings : ${newStep}/3 Steps Completed`

            setBonusFinalPayout(BigInt(claimResult.finalPayout), metricText)
            if (isJackpot) {
              setTimeout(() => playNeonComplete(true), 400)
            }
          }
        }, 1500)
      }
    } catch (err) {
      console.error('[DoubleDown] action error', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stage-container stage-double-or-nothing py-1! px-3! gap-1.5! sm:py-3! sm:px-5! sm:gap-4!">
      <div className="stage-title g-sxqg no-pseudo mt-0! mb-0.5! sm:mb-2! leading-none">
        ⚡ Double Down
      </div>

      {/* Payout ladder */}
      <div className="don-ladder gap-1! sm:gap-2!">
        {[3, 2, 1, 0].map((s) => {
          const mult = STEP_PAYOUTS[s] ?? 2
          const color = STEP_COLORS[s] ?? '#94a3b8'
          const isCurrent = s === step
          const isPast = s < step
          return (
            <div
              key={s}
              className={[
                'don-ladder-row py-1! px-2.5! sm:py-2! sm:px-4! text-[10px] sm:text-xs',
                isCurrent ? 'don-ladder-current' : '',
                isPast ? 'don-ladder-past' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              style={isCurrent ? { borderColor: color, color } : undefined}
            >
              <span className="don-ladder-step">Step {s}</span>
              <span className="don-ladder-mult">+{mult}x last bet</span>
              <span
                className={`font-mono text-xs font-bold transition-colors ${
                  isCurrent ? 'text-green-600' : 'text-slate-400'
                }`}
              >
                {formatPoints(bonusLastBet * BigInt(mult)).display}
              </span>
            </div>
          )
        })}
      </div>

      {/* Roll result feedback */}
      {lastRoll && (
        <div className="text-center mt-1! mb-0! sm:mt-3! sm:mb-2! select-none">
          <p
            className={`text-[11px] font-black uppercase tracking-wide leading-none ${
              lastRoll === 'WIN' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {lastRoll === 'WIN'
              ? 'Double down again to advance another step'
              : 'Payout returned to the 2x floor'}
          </p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5! leading-none">
            {lastRoll === 'WIN'
              ? 'Double down again to advance another step'
              : 'Your 2x safety cushion remains secured'}
          </p>
        </div>
      )}

      {/* Current guaranteed reward callout */}
      <div className="text-center mt-1! mb-1! sm:mt-3! sm:mb-3! select-none">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
          Guaranteed now:
        </span>
        <span className="text-xs font-black text-green-600">
          +{formatPoints(currentReward).display}
        </span>
      </div>

      {/* Action buttons */}
      {!terminal && (
        <div className="flex flex-col-reverse sm:flex-row gap-1.5 sm:gap-3 justify-center items-center w-full max-w-xs mx-auto mt-1 sm:mt-4!">
          <button
            onClick={() => sendAction('CLAIM')}
            disabled={loading}
            className="min-h-12 min-w-40 px-6 rounded-full bg-linear-to-br from-green-600 to-green-500 text-white font-extrabold text-[0.88rem] tracking-[0.06em] border-none cursor-pointer shadow-[0_4px_6px_-1px_rgba(22,163,74,0.2)] transition-[background-color,transform,box-shadow] duration-150 w-full sm:w-auto"
          >
            Claim Winnings
          </button>
          {step < 3 && (
            <button
              onClick={() => sendAction('GAMBLE')}
              disabled={loading}
              className="don-gamble-btn w-full sm:w-auto"
            >
              {loading ? 'Processing...' : 'Double Down'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
