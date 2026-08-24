'use client'

import { useState } from 'react'
import { useGameStore } from '../../app/stores/gameStore'
import { postBonusAction, claimBonusWinnings } from '../../lib/api'
import { getOrCreateUser } from '../../lib/user'
import { useNeonSound } from '../../hooks/useNeonSound'

const CARD_NAMES: Record<number, string> = {
  0: 'Blank Fate',
  1: 'Fortune',
  2: 'Destiny',
  3: 'Oracle'
}

const CARD_MULT: Record<number, string> = {
  0: '+0x',
  1: '+1x',
  2: '+2x',
  3: '+3x'
}

const CARD_COLOR: Record<number, string> = {
  0: '#64748b',
  1: '#22c55e',
  2: '#a855f7',
  3: '#f59e0b'
}

export default function WildPredictionStage() {
  const bonusGridState = useGameStore((s) => s.bonusGridState)
  const updateBonusReward = useGameStore((s) => s.updateBonusReward)
  const setBonusFinalPayout = useGameStore((s) => s.setBonusFinalPayout)
  const { playNeonShimmer, playNeonReward, playNeonComplete, playLoss } =
    useNeonSound()

  const reconnect = bonusGridState as {
    flipsRevealed?: number
    flippedIndices?: number[]
    cardValues?: number[]
  } | null

  // cardValues are provided by the server via gridState
  const serverCardValues = reconnect?.cardValues ?? null

  const [flipped, setFlipped] = useState<boolean[]>(() => {
    const indices = reconnect?.flippedIndices ?? []
    return [indices.includes(0), indices.includes(1), indices.includes(2)]
  })
  const [revealed, setRevealed] = useState<(number | null)[]>(() => {
    const indices = reconnect?.flippedIndices ?? []
    const vals = reconnect?.cardValues ?? []

    return [
      indices.includes(0) ? (vals[0] ?? null) : null,
      indices.includes(1) ? (vals[1] ?? null) : null,
      indices.includes(2) ? (vals[2] ?? null) : null
    ]
  })
  const [flipsCount, setFlipsCount] = useState(reconnect?.flipsRevealed ?? 0)
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState<boolean[]>([false, false, false])

  const flipCard = async (index: number) => {
    if (flipped[index] || loading) return

    const { userId } = getOrCreateUser()
    // Start flip animation before API call
    setAnimating((prev) => {
      const next = [...prev]
      next[index] = true
      return next
    })

    setLoading(true)
    try {
      const result = await postBonusAction(userId, { flipIndex: index })
      if (!result?.session) return
      const session = result.session as {
        accumulatedPayout: string
        stageStepsCompleted: number
        gridState: {
          cardValues: number[]
          flipsRevealed: number
          flippedIndices: number[]
        } | null
      }
      const newFlipsCount = session.stageStepsCompleted
      const cardValues = session.gridState?.cardValues ?? serverCardValues ?? []

      // Reveal the card after the CSS flip animation.
      setTimeout(() => {
        const val = cardValues[index] ?? 0
        if (val === 0) {
          playLoss()
        } else {
          playNeonShimmer()
          if (val === 3) {
            playNeonReward(3)
          }
        }
        setFlipped((prev) => {
          const next = [...prev]
          next[index] = true
          return next
        })
        setRevealed((prev) => {
          const next = [...prev]
          next[index] = cardValues[index] ?? 0
          return next
        })
        setAnimating((prev) => {
          const next = [...prev]
          next[index] = false
          return next
        })
      }, 300)

      setFlipsCount(newFlipsCount)

      if (newFlipsCount === 3) {
        updateBonusReward(BigInt(session.accumulatedPayout))
        // Auto-claim after all cards revealed
        setTimeout(async () => {
          const claimResult = await claimBonusWinnings(userId)
          if (claimResult?.finalPayout) {
            const finalTotal = cardValues.reduce(
              (a: number, b: number) => a + b,
              0
            )

            setBonusFinalPayout(BigInt(claimResult.finalPayout))
            if (finalTotal >= 9) {
              setTimeout(() => playNeonComplete(true), 400)
            }
          }
        }, 800)
      }
    } catch (err) {
      console.error('[WildPrediction] flip error', err)
      // Reset animation state on error
      setAnimating((prev) => {
        const next = [...prev]
        next[index] = false
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  const total = revealed.reduce<number>(
    (sum, v) => sum + (v !== null ? v : 0),
    0
  )

  return (
    <div className="stage-container stage-wild-prediction">
      <div className="stage-title g-spqg no-pseudo">🃏 WILD PREDICTION</div>
      <p className="stage-subtitle">
        Flip all three cards. Combined value determines your reward
      </p>

      <div className="card-row">
        {[0, 1, 2].map((i) => {
          const isFlipped = flipped[i]
          const isAnimating = animating[i]
          const cardValue = revealed[i]
          const isNext = !flipped[i] && flipsCount < 3
          const color = cardValue !== null ? CARD_COLOR[cardValue] : undefined

          return (
            <div
              key={i}
              className={[
                'card-flip-wrapper',
                isAnimating ? 'card-flipping' : '',
                isFlipped ? 'card-flipped' : '',
                isNext ? 'card-next' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => flipCard(i)}
              role="button"
              tabIndex={isNext ? 0 : -1}
              aria-label={`Flip card ${i + 1}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') flipCard(i)
              }}
            >
              <div className="card-face card-back">
                <span className="card-back-icon">✦</span>
              </div>

              <div
                className="card-face card-front"
                style={color ? { borderColor: color } : undefined}
              >
                {cardValue !== null && (
                  <>
                    <span className="card-value-name" style={{ color }}>
                      {CARD_NAMES[cardValue]}
                    </span>
                    <span className="card-value-mult" style={{ color }}>
                      {CARD_MULT[cardValue]}
                    </span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Running total */}
      {flipsCount > 0 && flipsCount < 3 && (
        <p className="wp-running-total">
          Combined so far: <strong>{total}×</strong>
        </p>
      )}

      {/* Instruction */}
      {flipsCount < 3 && !loading && (
        <p className="stage-subtitle wp-instruction">
          {flipsCount === 0
            ? 'Tap a card to begin'
            : `Tap card ${flipsCount + 1} to continue`}
        </p>
      )}
    </div>
  )
}
