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
        <div className="text-[1.15rem] font-extrabold tracking-wider text-center text-slate-800 g-uqg-s4 no-pseudo">
          🔮 ORACLE VISION
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-[background] duration-200 ${
                i < seqIndex
                  ? 'bg-[#00cc44]'
                  : i === seqIndex
                    ? 'bg-[#a855f7] shadow-[0_0_6px_rgba(168,85,247,0.7)]'
                    : 'bg-[rgba(255,255,255,0.1)]'
              }`}
            />
          ))}
          <span className="text-[0.72rem] text-slate-500">
            Sequence {seqIndex + 1} / 5
          </span>
        </div>

        {phase === 'show' && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-[0.8rem] text-slate-400">
              Memorise this sequence
            </p>
            <div className="flex gap-3">
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
          <div className="flex items-center justify-center min-h-20">
            <p className="text-[0.85rem] text-green-500 font-bold">
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
            <p className="text-[0.75rem] text-slate-500 self-end">
              {timeLeft}s
            </p>

            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 transition-[background,border-color] duration-150 ${
                    feedback === 'wrong'
                      ? 'bg-red-500 border-red-500'
                      : feedback === 'correct' && i === inputProgress.length - 1
                        ? 'bg-green-500 border-green-500'
                        : i < inputProgress.length
                          ? 'bg-[#a855f7] border-[#a855f7]'
                          : 'border-[rgba(255,255,255,0.2)]'
                  }`}
                />
              ))}
            </div>

            {/* 4×4 glyph grid */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-[320px]">
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
          <div className="flex flex-col items-center gap-2 mt-4 w-full">
            <p className="text-[0.8rem] text-slate-400 font-semibold animate-[np-pulse_1.5s_infinite_ease-in-out]">
              Collecting reward...
            </p>
          </div>
        )}

        {phase === 'input' && (
          <p className="text-[0.7rem] text-slate-600 text-center">
            Floor if you stop now: +{SEQ_PAYOUTS[seqIndex] ?? 2}x ·{' '}
            {
              formatPoints(bonusLastBet * BigInt(SEQ_PAYOUTS[seqIndex] ?? 2))
                .display
            }
          </p>
        )}
      </div>
    )
}