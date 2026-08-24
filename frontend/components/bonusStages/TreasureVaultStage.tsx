'use client'

import { useState } from 'react'
import { useGameStore } from '../../app/stores/gameStore'
import { postBonusAction, claimBonusWinnings } from '../../lib/api'
import { getOrCreateUser } from '../../lib/user'
import { useNeonSound } from '../../hooks/useNeonSound'
import { formatPoints } from '../../lib/format'

type ChestState = 'idle' | 'chosen' | 'revealed'

const CHEST_LABELS = ['Left', 'Center', 'Right']
const CHEST_EMOJI = ['📦', '📦', '📦']

export default function TreasureVaultStage() {
  const bonusLastBet = useGameStore((s) => s.bonusLastBet)
  const bonusGridState = useGameStore((s) => s.bonusGridState)
  const updateBonusReward = useGameStore((s) => s.updateBonusReward)
  const setBonusFinalPayout = useGameStore((s) => s.setBonusFinalPayout)

  const reconnect = bonusGridState as {
    rewards?: number[]
    chosen?: number | null
  } | null

  const [chestState, setChestState] = useState<ChestState>(
    reconnect?.chosen !== null && reconnect?.chosen !== undefined
      ? 'chosen'
      : 'idle'
  )
  const [chosenIndex, setChosenIndex] = useState<number | null>(
    reconnect?.chosen ?? null
  )
  const [revealedRewards, setRevealedRewards] = useState<number[] | null>(
    reconnect?.rewards ?? null
  )
  const [revealOthers, setRevealOthers] = useState(
    reconnect?.chosen !== null && reconnect?.chosen !== undefined
  )
  const [loading, setLoading] = useState(false)

  const { playNeonShimmer, playNeonReward, playNeonComplete } =
    useNeonSound()

  const pickChest = async (index: number) => {
    if (chestState !== 'idle' || loading) return
    const { userId } = getOrCreateUser()
    setLoading(true)
    try {
      const result = await postBonusAction(userId, { chestIndex: index })
      if (!result?.session) return

      const session = result.session as {
        accumulatedPayout: string
        gridState: { rewards: number[]; chosen: number } | null
      }

      const rewards = session.gridState?.rewards ?? []
      const chosenMultiplier = rewards[index] ?? 2
      setChosenIndex(index)
      setRevealedRewards(rewards)

      const previewPayout = bonusLastBet * BigInt(chosenMultiplier)
      updateBonusReward(previewPayout)
      setChestState('chosen')
      playNeonShimmer()

      setTimeout(async () => {
        setRevealOthers(true)

        setTimeout(async () => {
          const claimResult = await claimBonusWinnings(userId)

          if (claimResult?.finalPayout) {
            const metricText =
              chosenMultiplier >= 10
                ? 'Royal Chest Unlocked'
                : chosenMultiplier >= 5
                  ? 'Gilded Chest Unlocked'
                  : 'Silver Chest Unlocked'

            setBonusFinalPayout(BigInt(claimResult.finalPayout), metricText)
            playNeonReward(chosenMultiplier)

            if (chosenMultiplier >= 10) {
              setTimeout(() => playNeonComplete(true), 400)
            }
          }

          setChestState('revealed')
        }, 800)
      }, 1200)
    } catch (err) {
      console.error('[TreasureVault] pick error', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stage-container stage-treasure-vault">
      <div className="stage-title g-qnqg no-pseudo">🏛️ TREASURE VAULT</div>
      <p className="stage-subtitle">Choose a chest to claim your reward</p>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-sm mx-auto my-4">
        {CHEST_LABELS.map((label, i) => {
          const isChosen = chosenIndex === i
          const isRevealed =
            chestState === 'revealed' ||
            (chestState === 'chosen' && (isChosen || revealOthers))
          const rewardMultiplier = revealedRewards?.[i] ?? 2

          const points = bonusLastBet * BigInt(rewardMultiplier)

          const getEmoji = () => {
            if (!isRevealed) return CHEST_EMOJI[i]
            if (rewardMultiplier >= 10) return '👑'
            if (rewardMultiplier >= 5) return '💎'
            return '🎁'
          }

          const getBorderColor = () => {
            if (!isRevealed) return undefined
            if (rewardMultiplier >= 10) return '#facc15'
            if (rewardMultiplier >= 5) return '#38bdf8'
            return '#c084fc'
          }

          return (
            <button
              key={i}
              onClick={() => pickChest(i)}
              disabled={chestState !== 'idle' || loading}
              className={`w-full aspect-square flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all duration-150 select-none ${
                isChosen
                  ? 'border-indigo-500 bg-violet-50/50'
                  : 'border-slate-200 bg-slate-50/50'
              } ${
                chestState === 'idle'
                  ? 'hover:border-slate-300 hover:bg-slate-100/50 active:scale-95 cursor-pointer'
                  : 'cursor-default'
              }`}
              style={{
                borderColor: getBorderColor(),
                opacity: isRevealed && !isChosen ? 0.45 : 1,
                transition: 'opacity 0.3s ease'
              }}
            >
              <span className="text-xl sm:text-2xl md:text-3xl leading-none">
                {getEmoji()}
              </span>
              <span className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                {label}
              </span>
              {isRevealed && (
                <span
                  className={`text-[10px] sm:text-xs font-bold mt-1 block leading-tight ${
                    isChosen ? 'text-green-600' : 'text-slate-400'
                  }`}
                >
                  {rewardMultiplier}x
                  <span className="text-[8px] sm:text-[9px] font-medium block mt-0.5">
                    +{formatPoints(points).display}
                  </span>
                </span>
              )}
            </button>
          )
        })}
      </div>
      {chestState === 'chosen' && (
        <p className="stage-resolving">Opening chest...</p>
      )}
    </div>
  )
}
