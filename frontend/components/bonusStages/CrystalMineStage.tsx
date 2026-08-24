'use client'

import { useState } from 'react'
import { useGameStore } from '../../app/stores/gameStore'
import { postBonusAction, claimBonusWinnings } from '../../lib/api'
import { getOrCreateUser } from '../../lib/user'
import { useNeonSound } from '../../hooks/useNeonSound'

type TileType = 'EMPTY' | 'DIAMOND'

interface Tile {
  type: TileType
  revealed: boolean
}

const TILE_META = {
  EMPTY: { emoji: '🪨', label: 'Empty Rock', color: '#475569' },
  DIAMOND: { emoji: '💎', label: 'Diamond', color: '#22d3ee' }
}

const EMPTY_TILES: Tile[] = Array.from({ length: 25 }, () => ({
  type: 'EMPTY' as TileType,
  revealed: false
}))

export default function CrystalMineStage() {
  const bonusGridState = useGameStore((s) => s.bonusGridState)
  const updateBonusReward = useGameStore((s) => s.updateBonusReward)
  const setBonusFinalPayout = useGameStore((s) => s.setBonusFinalPayout)

  const { playNeonClick, playNeonShimmer, playNeonReward } = useNeonSound()

  // Restore the current grid state if the bonus session reconnects
  const reconnect = bonusGridState as {
    tiles?: Tile[]
    miningCharges?: number
    revealedIndices?: number[]
  } | null

  const [tiles, setTiles] = useState<Tile[]>(reconnect?.tiles ?? EMPTY_TILES)
  const [charges, setCharges] = useState(reconnect?.miningCharges ?? 5)
  const [loading, setLoading] = useState(false)

  const tapTile = async (index: number) => {
    if (tiles[index]?.revealed || charges <= 0 || loading) return
    const { userId } = getOrCreateUser()
    setLoading(true)
    playNeonClick()
    try {
      const result = await postBonusAction(userId, { tileIndex: index })
      if (!result?.session) return
      const session = result.session as {
        accumulatedPayout: string
        gridState: {
          tiles: Tile[]
          miningCharges: number
          revealedIndices: number[]
        } | null
      }
      const newTiles = session.gridState?.tiles ?? tiles
      const newCharges = session.gridState?.miningCharges ?? 0
      const newPayout = BigInt(session.accumulatedPayout)
      const revealedTile = newTiles[index]

      setTiles(newTiles)
      setCharges(newCharges)
      updateBonusReward(newPayout)
      // Play reveal effects when a diamond is discovered
      if (revealedTile?.type === 'DIAMOND') {
        setTimeout(() => {
          playNeonShimmer()
        }, 100)
      }

      // Resolve the bonus after all five mining charges have been spent
      const isExhausted = newCharges <= 0
      const revealedDiamonds = newTiles.filter(
        (t) => t.revealed && t.type === 'DIAMOND'
      ).length

      if (isExhausted) {
        const multiplier =
          revealedDiamonds >= 5
            ? 10
            : revealedDiamonds === 4
              ? 8
              : revealedDiamonds === 3
                ? 6
                : revealedDiamonds === 2
                  ? 4
                  : 2

        const claimResult = await claimBonusWinnings(userId)

        if (claimResult?.finalPayout) {
          setTimeout(() => {
            playNeonReward(multiplier)
          }, 250)

          const metricText = `${revealedDiamonds}/5 Diamonds Found`

          setBonusFinalPayout(BigInt(claimResult.finalPayout), metricText)
        }
      }
    } catch (err) {
      console.error('[CrystalMine] tap error', err)
    } finally {
      setLoading(false)
    }
  }

  const revealedDiamonds = tiles.filter(
    (t) => t.revealed && t.type === 'DIAMOND'
  ).length

  return (
    <div className="stage-container stage-crystal-mine">
      <div className="stage-title g-dqg-s4 no-pseudo">💎 CRYSTAL MINE</div>

      <p className="text-center text-xs text-slate-400 mb-2">
        5 picks • Find 💎 • Win up to 10×
      </p>

      {/* Status bar */}
      <div className="cm-status">
        <div className="cm-charges">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={[
                'cm-charge-pip',
                i < charges ? 'cm-charge-active' : 'cm-charge-spent'
              ].join(' ')}
            >
              ●
            </span>
          ))}
          <span className="cm-charges-label">Charges</span>
        </div>
        <div className="cm-crystals-found">💎 {revealedDiamonds} Found</div>
      </div>

      {/* 5×5 grid */}
      <div className="cm-grid">
        {tiles.map((tile, i) => {
          const meta = TILE_META[tile.type]
          const isRevealed = tile.revealed
          const isEmpty = tile.type === 'EMPTY'

          return (
            <button
              key={i}
              onClick={() => tapTile(i)}
              disabled={isRevealed || charges <= 0 || loading}
              className={[
                'cm-tile',
                isRevealed && isEmpty ? 'cm-tile-empty' : '',
                isRevealed && !isEmpty ? 'cm-tile-crystal' : '',
                !isRevealed ? 'cm-tile-hidden' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                isRevealed && !isEmpty ? { borderColor: meta.color } : undefined
              }
            >
              {isRevealed ? (
                <span
                  className="cm-tile-icon"
                  style={!isEmpty ? { color: meta.color } : undefined}
                >
                  {meta.emoji}
                </span>
              ) : (
                <span className="cm-tile-rock">▪</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Exhausted message */}
      {charges <= 0 && (
        <p className="cm-exhausted">All charges spent. Collecting reward...</p>
      )}
    </div>
  )
}
