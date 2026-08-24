'use client'

import { useState } from 'react'
import { useGameStore } from '../../app/stores/gameStore'
import { postBonusAction, claimBonusWinnings } from '../../lib/api'
import { getOrCreateUser } from '../../lib/user'
import { useNeonSound } from '../../hooks/useNeonSound'

const TIER_META: Record<
  string,
  {
    label: string
    emoji: string
    color: string
    multiplier: number
  }
> = {
  BRONZE: {
    label: 'Bronze',
    emoji: '🟫',
    color: '#cd7f32',
    multiplier: 2
  },
  SILVER: {
    label: 'Silver',
    emoji: '⚪',
    color: '#c0c0c0',
    multiplier: 4
  },
  GOLD: {
    label: 'Gold',
    emoji: '🟨',
    color: '#ffd700',
    multiplier: 6
  },
  DIAMOND: {
    label: 'Diamond',
    emoji: '💎',
    color: '#b9f2ff',
    multiplier: 8
  },
  ROYAL: {
    label: 'Royal',
    emoji: '👑',
    color: '#ff9500',
    multiplier: 10
  }
}

export default function KingsVaultStage() {
  const updateBonusReward = useGameStore((s) => s.updateBonusReward)
  const setBonusFinalPayout = useGameStore((s) => s.setBonusFinalPayout)

  const [chosenIndex, setChosenIndex] = useState<number | null>(null)
  const [revealed, setRevealed] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const { playNeonReward, playNeonComplete } =
    useNeonSound()

  const pickChest = async (index: number) => {
    if (chosenIndex !== null || loading) return
    const { userId } = getOrCreateUser()
    setLoading(true)
    setChosenIndex(index)
    const multMap: Record<string, number> = {
      BRONZE: 2,
      SILVER: 4,
      GOLD: 6,
      DIAMOND: 8,
      ROYAL: 10
    }
    playNeonReward(multMap['BRONZE'] ?? 2)
    try {
      const result = await postBonusAction(userId, { chestIndex: index })
      if (!result?.session) return
      const session = result.session as {
        accumulatedPayout: string
        gridState: { positions: string[]; chosenIndex: number } | null
      }
      setRevealed(session.gridState?.positions ?? [])
      updateBonusReward(BigInt(session.accumulatedPayout))

      // Wait briefly for the reveal animation before auto-claiming
      setTimeout(async () => {
        const tier = session.gridState?.positions?.[index] ?? 'BRONZE'
        const multMap: Record<string, number> = {
          BRONZE: 2,
          SILVER: 4,
          GOLD: 6,
          DIAMOND: 8,
          ROYAL: 10
        }
        const mult = multMap[tier] ?? 2
        playNeonReward(mult)
        if (tier === 'ROYAL') setTimeout(() => playNeonComplete(true), 300)
        const claimResult = await claimBonusWinnings(userId)
        if (claimResult?.finalPayout) {
          const metricText = `${TIER_META[tier]?.label || 'Bronze'} Chest Found`
          setBonusFinalPayout(BigInt(claimResult.finalPayout), metricText)
        }
      }, 1400)
    } catch (err) {
      console.error('[KingsVault] pick error', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stage-container stage-kings-vault">
      <div className="stage-title g-tqg-s4 no-pseudo">👑 KING&apos;S VAULT</div>
      <p className="stage-subtitle">One chest holds the Royal reward</p>

      <div className="chest-row chest-row-five">
        {Array.from({ length: 5 }).map((_, i) => {
          const isChosen = chosenIndex === i
          const tierKey = revealed?.[i] ?? null
          const tierData = tierKey ? TIER_META[tierKey] : null
          const isRevealed = revealed !== null

          return (
            <button
              key={i}
              onClick={() => pickChest(i)}
              disabled={chosenIndex !== null || loading}
              className={[
                'chest-btn',
                'chest-btn-kings',
                isChosen ? 'chest-chosen' : '',
                isRevealed ? 'chest-revealed' : '',
                chosenIndex === null ? 'chest-idle' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                isRevealed && tierData
                  ? { borderColor: tierData.color }
                  : undefined
              }
            >
              <span className="chest-icon">
                {isRevealed && tierData ? tierData.emoji : '📦'}
              </span>
              {isRevealed && tierData && (
                <span
                  className="chest-tier-label"
                  style={{ color: tierData.color }}
                >
                  {tierData.label}
                  <br />
                  <span className="chest-tier-mult">
                    +{tierData.multiplier}×
                  </span>
                </span>
              )}
              {isChosen && !isRevealed && (
                <span className="chest-label">Opening...</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}