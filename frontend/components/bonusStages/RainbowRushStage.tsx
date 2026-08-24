'use client'

import { useState } from 'react'
import { useGameStore } from '../../app/stores/gameStore'
import { postBonusAction, claimBonusWinnings } from '../../lib/api'
import { getOrCreateUser } from '../../lib/user'
import { formatPoints } from '../../lib/format'
import { useNeonSound } from '../../hooks/useNeonSound'

const TIER_META: Record<
  number,
  { label: string; color: string; multiplier: number }
> = {
  1: { label: 'Low', color: '#64748b', multiplier: 2 },
  2: { label: 'Bright', color: '#22d3ee', multiplier: 4 },
  3: { label: 'Radiant', color: '#a855f7', multiplier: 6 },
  4: { label: 'Prismatic', color: '#f59e0b', multiplier: 8 },
  5: { label: 'Rainbow', color: '#ff0080', multiplier: 10 }
}
export default function RainbowRushStage() {
  const bonusLastBet = useGameStore((s) => s.bonusLastBet)
  const bonusGridState = useGameStore((s) => s.bonusGridState)
  const updateBonusReward = useGameStore((s) => s.updateBonusReward)
  const setBonusFinalPayout = useGameStore((s) => s.setBonusFinalPayout)
  const { playNeonClick, playNeonReward, playNeonComplete, playCards } =
    useNeonSound()

  // Restore spins already revealed by the server after reconnect
  const reconnect = bonusGridState as {
    revealedSpins?: number[]
    spinsRevealed?: number
  } | null

  const [spinResults, setSpinResults] = useState<(number | null)[]>(
    reconnect?.revealedSpins
      ? [
          reconnect.revealedSpins[0] ?? null,
          reconnect.revealedSpins[1] ?? null,
          reconnect.revealedSpins[2] ?? null
        ]
      : [null, null, null]
  )
  const [spinsRevealed, setSpinsRevealed] = useState(
    reconnect?.spinsRevealed ?? 0
  )
  const [spinning, setSpinning] = useState(false)
  const [loading, setLoading] = useState(false)

  const triggerSpin = async () => {
    if (spinsRevealed >= 3 || loading) return
    const { userId } = getOrCreateUser()
    playNeonClick()
    playCards()
    setLoading(true)
    setSpinning(true)

    try {
      const result = await postBonusAction(userId, { action: 'SPIN' })
      if (!result?.session) return
      const session = result.session as {
        accumulatedPayout: string
        stageStepsCompleted: number
        gridState: { spinResults: number[]; spinsRevealed: number } | null
      }
      const newRevealed = session.stageStepsCompleted
      const results = session.gridState?.spinResults ?? []
      // Hold the reel animation briefly before revealing the server result
      setTimeout(() => {
        setSpinResults([
          newRevealed >= 1 ? (results[0] ?? null) : null,
          newRevealed >= 2 ? (results[1] ?? null) : null,
          newRevealed >= 3 ? (results[2] ?? null) : null
        ])
        setSpinsRevealed(newRevealed)
        setSpinning(false)

        // Play the reward sound when the reel locks on its server-generated tier
        const lockedTier = results[newRevealed - 1] ?? 1
        playNeonReward(lockedTier * 2)

        if (newRevealed === 3) {
          updateBonusReward(BigInt(session.accumulatedPayout))

          setTimeout(async () => {
            const claimResult = await claimBonusWinnings(userId)

            if (claimResult?.finalPayout) {
              const finalSpec = Math.floor(
                results.reduce((sum: number, tier: number) => sum + tier, 0) / 3
              )
              const label = TIER_META[finalSpec]?.label || 'Low'
              const metricText = `${label} Spectrum Analyzed`

              setBonusFinalPayout(BigInt(claimResult.finalPayout), metricText)

              if (finalSpec >= 5) {
                setTimeout(() => playNeonComplete(true), 400)
              }
            }
          }, 600)
        }
      }, 1000)
    } catch (err) {
      console.error('[RainbowRush] spin error', err)
      setSpinning(false)
    } finally {
      setLoading(false)
    }
  }

  const sum = spinResults.reduce<number>(
    (acc, v) => acc + (v !== null ? v : 0),
    0
  )
  const finalSpectrum = spinsRevealed === 3 ? Math.floor(sum / 3) : null
  const finalTier = finalSpectrum !== null ? TIER_META[finalSpectrum] : null

  return (
    <div className="stage-container stage-rainbow-rush">
      <div className="stage-title g-noqg no-pseudo">🌈 RAINBOW RUSH</div>
      <p className="stage-subtitle">
        Three spins. Average spectrum tier determines your reward
      </p>

      <div className="rr-slots">
        {[0, 1, 2].map((i) => {
          const value = spinResults[i]
          const meta = value !== null ? TIER_META[value] : null
          const isActive = i === spinsRevealed && spinning

          return (
            <div
              key={i}
              className={[
                'rr-slot',
                isActive ? 'rr-slot-spinning' : '',
                value !== null ? 'rr-slot-revealed' : '',
                i >= spinsRevealed && !spinning ? 'rr-slot-pending' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              style={meta ? { borderColor: meta.color } : undefined}
            >
              {isActive && <span className="rr-slot-spinner">🌀</span>}
              {!isActive && meta && (
                <>
                  <span className="rr-slot-label" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span className="rr-slot-tier" style={{ color: meta.color }}>
                    {value}
                  </span>
                </>
              )}
              {!isActive && value === null && (
                <span className="rr-slot-empty">?</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Show remaining spins while the stage is active */}
      {spinsRevealed < 3 && (
        <p className="rr-counter">
          Spins remaining: <strong>{3 - spinsRevealed}</strong>
        </p>
      )}

      {/* Show the calculated final spectrum after all three spins */}
      {finalTier && (
        <div
          className="rr-final-tier"
          style={{ color: finalTier.color, borderColor: finalTier.color }}
        >
          <span>Final Spectrum: {finalTier.label}</span>
          <span>+{finalTier.multiplier}×</span>
        </div>
      )}

      {/* Allow the player to trigger the next spin */}
      {spinsRevealed < 3 && (
        <button
          onClick={triggerSpin}
          disabled={loading || spinning}
          className="rr-spin-btn"
        >
          {spinning ? 'Spinning...' : `Spin ${spinsRevealed + 1} of 3`}
        </button>
      )}

      {/* Show the complete reward multiplier reference */}
      <div className="rr-payout-table">
        {Object.entries(TIER_META).map(([tier, meta]) => (
          <div
            key={tier}
            className={[
              'rr-payout-row',
              finalSpectrum === Number(tier) ? 'rr-payout-active' : ''
            ].join(' ')}
            style={
              finalSpectrum === Number(tier) ? { color: meta.color } : undefined
            }
          >
            <span>{meta.label}</span>
            <span>+{meta.multiplier}×</span>
            <span>
              {formatPoints(bonusLastBet * BigInt(meta.multiplier)).display}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}