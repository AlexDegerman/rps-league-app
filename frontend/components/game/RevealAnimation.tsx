'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import MoveIcon from '@/components/icons/MoveIcon'
import { Move, Phase } from '@/types/rps'

const MOVES: Move[] = ['ROCK', 'PAPER', 'SCISSORS']

function randomMove(exclude?: Move): Move {
  const options = exclude ? MOVES.filter((m) => m !== exclude) : MOVES
  return options[Math.floor(Math.random() * options.length)]
}

interface RevealAnimationProps {
  // Null while waiting for the final result.
  leftMove: Move | null
  rightMove: Move | null
  winningSide: 'left' | 'right' | 'draw' | null
  outcomeRewritten?: boolean
  onDone?: () => void
}

export default function RevealAnimation({
  leftMove,
  rightMove,
  winningSide,
  outcomeRewritten = false,
  onDone
}: RevealAnimationProps) {
  const [phase, setPhase] = useState<Phase>('shuffle_fast')
  const [leftDisplay, setLeftDisplay] = useState<Move>('ROCK')
  const [rightDisplay, setRightDisplay] = useState<Move>('SCISSORS')
  const [showImpact, setShowImpact] = useState(false)
  const [showRewrite, setShowRewrite] = useState(false)

  const shuffleRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Tracks the current animation phase for delayed callbacks
  // without triggering re-renders.
  const phaseRef = useRef<Phase>('shuffle_fast')

  // Ensures only one shuffle interval is active at a time.
  const clearShuffle = useCallback(() => {
    if (shuffleRef.current) {
      clearInterval(shuffleRef.current)
      shuffleRef.current = null
    }
  }, [])

  const propsRef = useRef({
    leftMove,
    rightMove,
    winningSide,
    outcomeRewritten
  })
  useEffect(() => {
    propsRef.current = { leftMove, rightMove, winningSide, outcomeRewritten }
  }, [leftMove, rightMove, winningSide, outcomeRewritten])

  const shuffleCompleteRef = useRef(false)

  const triggerClashIfReady = useCallback(() => {
    const latest = propsRef.current
    if (shuffleCompleteRef.current && latest.leftMove && latest.rightMove) {
      if (
        phaseRef.current === 'clash' ||
        phaseRef.current === 'reveal' ||
        phaseRef.current === 'done'
      )
        return

      clearShuffle()
      phaseRef.current = 'clash'
      setPhase('clash')

      setLeftDisplay(latest.leftMove)
      setRightDisplay(latest.rightMove)

      setShowImpact(false)

      setTimeout(() => {
        setShowImpact(true)
        setTimeout(() => setShowImpact(false), 200)
      }, 180)

      setTimeout(() => {
        phaseRef.current = 'reveal'
        setPhase('reveal')

        if (latest.outcomeRewritten) {
          setTimeout(() => setShowRewrite(true), 100)
        }

        setTimeout(() => {
          phaseRef.current = 'done'
          setPhase('done')
          onDone?.()
        }, 600)
      }, 400)
    }
  }, [onDone, clearShuffle])

  useEffect(() => {
    triggerClashIfReady()
  }, [leftMove, rightMove, triggerClashIfReady])

  // Animation sequence:
  // fast shuffle -> slow shuffle -> clash -> reveal -> done.
  // The reveal follows a fixed timeline so the animation feels responsive,
  // even if the server result arrives slightly later.
  useEffect(() => {
    phaseRef.current = 'shuffle_fast'
    const rafId = requestAnimationFrame(() => {
      setPhase('shuffle_fast')
    })

    // Rapid shuffle to simulate quick cycling.
    let fastCount = 0
    const fastLimit = Math.floor(250 / 125)
    shuffleRef.current = setInterval(() => {
      const nextLeft = randomMove()
      const nextRight = randomMove(nextLeft)
      setLeftDisplay(nextLeft)
      setRightDisplay(nextRight)
      fastCount++
      if (fastCount >= fastLimit) {
        clearShuffle()
        phaseRef.current = 'shuffle_slow'
        setPhase('shuffle_slow')

        // Slow the shuffle slightly before the reveal to build anticipation.
        let slowCount = 0
        const slowLimit = Math.floor(350 / 350)
        shuffleRef.current = setInterval(() => {
          const nextLeft = randomMove()
          const nextRight = randomMove(nextLeft)
          setLeftDisplay(nextLeft)
          setRightDisplay(nextRight)
          slowCount++
          if (slowCount >= slowLimit) {
            shuffleCompleteRef.current = true
            const latest = propsRef.current
            if (latest.leftMove) {
              triggerClashIfReady()
            } else {
              phaseRef.current = 'waiting_for_result'
              setPhase('waiting_for_result')
            }
          }
        }, 350)
      }
    }, 125)

    return () => {
      cancelAnimationFrame(rafId)
      clearShuffle()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If the server result arrives after the reveal has started,
  // immediately replace the temporary icons with the final moves.
  useEffect(() => {
    let rafId: number
    if (phaseRef.current === 'reveal' || phaseRef.current === 'done') {
      rafId = requestAnimationFrame(() => {
        if (leftMove) setLeftDisplay(leftMove)
        if (rightMove) setRightDisplay(rightMove)
      })
    }
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [leftMove, rightMove])

  const isClash = phase === 'clash'
  const isReveal = phase === 'reveal' || phase === 'done'
  const isShuffling =
    phase === 'shuffle_fast' ||
    phase === 'shuffle_slow' ||
    phase === 'waiting_for_result'

  const leftWins = isReveal && winningSide === 'left'
  const rightWins = isReveal && winningSide === 'right'

  return (
    <div className="relative flex items-center justify-center gap-4 px-1 select-none w-full">
      {/* Left icon */}
      <span
        className={[
          'inline-flex transition-all leading-none shrink-0',
          isShuffling &&
            (phase === 'shuffle_fast'
              ? 'rps-shuffle-fast'
              : 'rps-shuffle-slow'),
          (isClash || isReveal) && 'rps-clash-left',
          isReveal && leftWins && 'rps-reveal-winner',
          isReveal && !leftWins && winningSide !== 'draw' && 'rps-reveal-loser'
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <MoveIcon move={leftDisplay} size={36} />
      </span>

      {/* Center: VS / impact flash */}
      <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
        {showImpact && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-8 h-8 rounded-full bg-white rps-impact-flash"
              style={{ boxShadow: '0 0 12px 4px rgba(255,255,255,0.9)' }}
            />
          </div>
        )}
        {showRewrite && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="outcome-rewrite-badge text-[8px] font-black uppercase tracking-widest text-cyan-400 whitespace-nowrap"
              style={{ textShadow: '0 0 8px rgba(34,211,238,0.7)' }}
            >
              Rewritten
            </span>
          </div>
        )}
        {!showImpact && !showRewrite && (
          <span className="text-[10px] font-black text-gray-300 uppercase">
            vs
          </span>
        )}
      </div>

      {/* Right icon */}
      <span
        className={[
          'inline-flex transition-all leading-none shrink-0',
          isShuffling &&
            (phase === 'shuffle_fast'
              ? 'rps-shuffle-fast'
              : 'rps-shuffle-slow'),
          (isClash || isReveal) && 'rps-clash-right',
          isReveal && rightWins && 'rps-reveal-winner',
          isReveal && !rightWins && winningSide !== 'draw' && 'rps-reveal-loser'
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <MoveIcon move={rightDisplay} size={36} />
      </span>
    </div>
  )
}
