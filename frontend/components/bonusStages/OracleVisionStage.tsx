'use client'

import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../app/stores/gameStore'
import { postBonusAction, claimBonusWinnings } from '../../lib/api'
import { getOrCreateUser } from '../../lib/user'
import { formatPoints } from '../../lib/format'
import { useNeonSound } from '../../hooks/useNeonSound'

// 16 glyphs shown on the keypad grid
const GLYPHS = [
  'Ψ',
  'Ω',
  'Δ',
  'Σ',
  'Φ',
  'Λ',
  'Θ',
  'Ξ',
  'Π',
  'Γ',
  'β',
  'α',
  'μ',
  'ζ',
  'η',
  'ρ'
]

const SEQ_PAYOUTS: Record<number, number> = {
  0: 2,
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10
}

type Phase = 'show' | 'input' | 'between' | 'terminal'

export default function OracleVisionStage() {
  const bonusLastBet = useGameStore((s) => s.bonusLastBet)
  const bonusGridState = useGameStore((s) => s.bonusGridState)
  const updateBonusReward = useGameStore((s) => s.updateBonusReward)
  const setBonusFinalPayout = useGameStore((s) => s.setBonusFinalPayout)
  const {
    playNeonClick,
    playNeonReward,
    playNeonComplete,
    playLoss,
    playLayer
  } = useNeonSound()

  const initData = bonusGridState as {
    firstSequence?: number[]
    currentSequence?: number[]
    currentSequenceIndex?: number
    terminal?: boolean
  } | null

  const [seqIndex, setSeqIndex] = useState(initData?.currentSequenceIndex ?? 0)
  const [currentSeq, setCurrentSeq] = useState<number[]>(
    initData?.currentSequence ?? initData?.firstSequence ?? []
  )
  const [phase, setPhase] = useState<Phase>(
    initData?.terminal ? 'terminal' : 'show'
  )
  const [inputProgress, setInputProgress] = useState<number[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timeLeft, setTimeLeft] = useState(8)
  const [loading, setLoading] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleTimerExpiry = async () => {
    // Timeout locks the current payout
    setPhase('terminal')
    const { userId } = getOrCreateUser()
    try {
      const result = await postBonusAction(
        userId,
        { glyphIndex: -1 } // Sentinel for timeout
      )
      if (result?.session) {
        const session = result.session as { accumulatedPayout: string }
        updateBonusReward(BigInt(session.accumulatedPayout))
      }
      playLoss()
      const claimResult = await claimBonusWinnings(userId)
      if (claimResult?.finalPayout) {
        const metricText = `${seqIndex}/5 Sequences Completed`
        setBonusFinalPayout(BigInt(claimResult.finalPayout), metricText)
      }
    } catch (err) {
      console.error('[OracleVision] timeout claim error', err)
    }
  }

  useEffect(() => {
    if (phase !== 'show') return
    // Play the mystical sound while the Oracle displays the glyphs
    playLayer('mirage_cataclysm')
  }, [phase, seqIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const startInputPhase = () => {
    setTimeLeft(8)
    setPhase('input')
  }

  // Input phase uses an 8-second countdown
  useEffect(() => {
    if (phase !== 'input') return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleTimerExpiry()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, seqIndex])

  const tapGlyph = async (glyphIndex: number) => {
    if (phase !== 'input' || loading) return
    const { userId } = getOrCreateUser()
    playNeonClick()
    setLoading(true)
    try {
      const result = await postBonusAction(userId, { glyphIndex })
      if (!result?.session) return
      const session = result.session as {
        accumulatedPayout: string
        stageStepsCompleted: number
        gridState: {
          currentSequenceIndex: number
          sequences: number[][]
          failed: boolean
          complete: boolean
        } | null
      }
      const grid = session.gridState
      const isFailed = grid?.failed ?? false
      const isComplete = grid?.complete ?? false
      const newSeqIndex = grid?.currentSequenceIndex ?? seqIndex
      const expectedGlyph = currentSeq[inputProgress.length]
      const isCorrect = glyphIndex === expectedGlyph

      setFeedback(isCorrect ? 'correct' : 'wrong')
      setTimeout(() => setFeedback(null), 400)

      if (!isCorrect || isFailed) {
        if (timerRef.current) clearInterval(timerRef.current)
        playLoss()
        setPhase('terminal')
        updateBonusReward(BigInt(session.accumulatedPayout))
        const claimResult = await claimBonusWinnings(userId)
        if (claimResult?.finalPayout) {
          const metricText = `${seqIndex}/5 Sequences Completed`
          setBonusFinalPayout(BigInt(claimResult.finalPayout), metricText)
        }
        return
      }

      const newProgress = [...inputProgress, glyphIndex]
      setInputProgress(newProgress)

      if (newProgress.length === 3) {
        if (timerRef.current) clearInterval(timerRef.current)
        updateBonusReward(BigInt(session.accumulatedPayout))
        playNeonReward(SEQ_PAYOUTS[newSeqIndex] ?? 2)

        if (isComplete) {
          const claimResult = await claimBonusWinnings(userId)
          if (claimResult?.finalPayout) {
            setBonusFinalPayout(
              BigInt(claimResult.finalPayout),
              'Perfect Recall : 5/5 Sequences'
            )
            setTimeout(() => playNeonComplete(true), 400)
          }
          setPhase('terminal')
        } else {
          const nextSeq = grid?.sequences[newSeqIndex] ?? []
          setPhase('between')
          setTimeout(() => {
            setSeqIndex(newSeqIndex)
            setCurrentSeq(nextSeq)
            setInputProgress([])
            setPhase('show')
          }, 800)
        }
      }
    } catch (err) {
      console.error('[OracleVision] glyph error', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stage-container stage-oracle-vision">
      <div className="stage-title g-uqg-s4 no-pseudo">🔮 ORACLE VISION</div>

      <div className="ov-seq-counter">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={[
              'ov-seq-pip',
              i < seqIndex ? 'ov-seq-done' : '',
              i === seqIndex ? 'ov-seq-current' : '',
              i > seqIndex ? 'ov-seq-future' : ''
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
        <span className="ov-seq-label">Sequence {seqIndex + 1} / 5</span>
      </div>

      {phase === 'show' && (
        <div className="ov-show-phase">
          <p className="ov-show-label">Memorise this sequence</p>
          <div className="ov-show-glyphs">
            {currentSeq.map((gi, pos) => (
              <div key={pos} className="ov-show-glyph">
                {GLYPHS[gi]}
              </div>
            ))}
          </div>
          <button
            onClick={startInputPhase}
            className="mt-6 w-full py-3.5 px-6 bg-linear-to-r from-indigo-600 to-violet-600 text-white font-bold text-base tracking-wider rounded-xl shadow-[0_4px_20px_rgba(99,102,241,0.4)] active:scale-[0.98] transition-all cursor-pointer"
          >
            Start Sequence
          </button>
        </div>
      )}

      {phase === 'between' && (
        <div className="ov-between">
          <p className="ov-between-label">
            ✅ Sequence complete. Next incoming
          </p>
        </div>
      )}

      {phase === 'input' && (
        <>
          <div className="ov-timer-bar">
            <div
              className="ov-timer-fill"
              style={{ width: `${(timeLeft / 8) * 100}%` }}
            />
          </div>
          <p className="ov-timer-label">{timeLeft}s</p>

          <div className="ov-progress-dots">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={[
                  'ov-dot',
                  i < inputProgress.length ? 'ov-dot-filled' : '',
                  feedback === 'correct' && i === inputProgress.length - 1
                    ? 'ov-dot-correct'
                    : '',
                  feedback === 'wrong' ? 'ov-dot-wrong' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            ))}
          </div>

          {/* 4×4 glyph grid */}
          <div className="ov-grid">
            {GLYPHS.map((glyph, gi) => (
              <button
                key={gi}
                onClick={() => tapGlyph(gi)}
                disabled={loading}
                className={[
                  'ov-glyph-btn',
                  feedback === 'correct' &&
                  gi === inputProgress[inputProgress.length - 1]
                    ? 'ov-glyph-correct'
                    : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {glyph}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'terminal' && (
        <div className="stage-result">
          <p className="stage-resolving">Collecting reward...</p>
        </div>
      )}

      {phase === 'input' && (
        <p className="ov-floor-reminder">
          Floor if you stop now: +{SEQ_PAYOUTS[seqIndex] ?? 2}× ·{' '}
          {
            formatPoints(bonusLastBet * BigInt(SEQ_PAYOUTS[seqIndex] ?? 2))
              .display
          }
        </p>
      )}
    </div>
  )
}