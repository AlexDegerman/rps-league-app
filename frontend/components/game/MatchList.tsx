'use client'

import React from 'react'
import Link from 'next/link'
import { formatDateTime, getPlayerResult, resultColor } from '@/lib/format'
import type { Match } from '@/types/rps'
import MoveIcon from '@/components/icons/MoveIcon'
import { useGameStore } from '@/app/stores/gameStore'
import { PredictionRecord } from '@/types/prediction'
import { MODE_CONFIG } from '@/constants/events'

interface MatchRowProps {
  match: Match
  highlightPlayer?: string
  prediction?: PredictionRecord
  alwaysLeft?: boolean
  winStreak?: number
  visualMode?: string | null
  totalMultiplier?: number
  festivalMultiplier?: number
  festivalType?: string | null
}

interface MatchListProps {
  matches: Match[]
  highlightPlayer?: string
  isLoadingMore?: boolean
  hasMore?: boolean
  predictions?: Map<string, PredictionRecord>
  alwaysLeft?: boolean
  winStreak?: number
  visualMode?: string | null
  festivalModeKey?: string | null
}

const getMatchWinner = (match: Match): string => {
  const { playerA, playerB } = match
  const aWins =
    (playerA.played === 'ROCK' && playerB.played === 'SCISSORS') ||
    (playerA.played === 'SCISSORS' && playerB.played === 'PAPER') ||
    (playerA.played === 'PAPER' && playerB.played === 'ROCK')
  return aWins ? playerA.name : playerB.name
}

const MatchRow = React.memo(
  ({
    match,
    highlightPlayer,
    prediction,
    alwaysLeft,
    winStreak = 0,
    visualMode = null,
    festivalModeKey = null
  }: MatchRowProps & { festivalModeKey?: string | null }) => {
    const isFlipped =
      alwaysLeft && highlightPlayer && match.playerB.name === highlightPlayer
    const left = isFlipped ? match.playerB : match.playerA
    const right = isFlipped ? match.playerA : match.playerB
    const winner = getMatchWinner(match)

    const storeVisualMode = useGameStore((s) => s.visualMode)
    const storeFestivalModeKey = useGameStore((s) => s.festivalModeKey)

    const activeVisualMode = visualMode || storeVisualMode
    const activeFestivalKey = festivalModeKey || storeFestivalModeKey

    const modeKey = activeVisualMode || activeFestivalKey || null

    const hasPrediction = !!prediction
    const isInferno = winStreak >= 5
    const isFever = winStreak >= 3 && winStreak < 5

    const activeKey = (
      modeKey
        ? modeKey
        : isInferno
          ? 'winstreak_inferno'
          : isFever
            ? 'winstreak_fever'
            : 'default'
    ) as keyof typeof MODE_CONFIG

    const cfg = MODE_CONFIG[activeKey] || MODE_CONFIG.default
    const isActive = hasPrediction && activeKey !== 'default'

    return (
      <li
        className={`relative rounded-xl shadow-sm border-2 p-3 overflow-hidden transition-all duration-300
        ${cfg.border} ${cfg.bg} ${isActive ? cfg.cardAnim : ''}`}
      >
        {/* Ambient glow */}
        {isActive && cfg.glowColor && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${cfg.glowColor} 0%, transparent 60%)`
            }}
          />
        )}

        {/* Top row: winner badge + date */}
        <div className="flex justify-between items-center mb-1 gap-2 relative z-10">
          {winner === left.name ? (
            <>
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-lg shrink-0 text-white ${cfg.winnerBadge}`}
              >
                {winner.split(' ')[0]} wins
              </span>
              <span className={`text-xs shrink-0 ${cfg.dateText}`}>
                {formatDateTime(match.time)}
              </span>
            </>
          ) : (
            <>
              <span className={`text-xs shrink-0 ${cfg.dateText}`}>
                {formatDateTime(match.time)}
              </span>
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-lg shrink-0 text-white ${cfg.winnerBadge}`}
              >
                {winner.split(' ')[0]} wins
              </span>
            </>
          )}
        </div>

        {/* Players + moves */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          {/* Left player */}
          <div className="flex flex-col items-start flex-1 min-w-0">
            <Link
              href={`/player/${encodeURIComponent(left.name)}`}
              onClick={(e) => e.stopPropagation()}
              className={`font-medium text-sm underline decoration-gray-300 transition truncate max-w-full
              ${
                winner === left.name && isActive
                  ? cfg.winnerText
                  : winner === left.name
                    ? 'text-green-600 font-bold hover:decoration-green-600'
                    : 'text-gray-800 hover:decoration-indigo-600 hover:text-indigo-600'
              }`}
            >
              {left.name}
            </Link>
            {highlightPlayer === left.name && (
              <span
                className={`text-xs font-bold mt-1 px-2 py-0.5 rounded text-white ${resultColor(getPlayerResult(match, left.name))}`}
              >
                {getPlayerResult(match, left.name)}
              </span>
            )}
          </div>

          {/* Move icons */}
          <div className="flex items-center gap-2 shrink-0">
            <MoveIcon move={left.played} />
            <span
              className={`text-sm font-black ${isActive ? cfg.vsText : 'text-gray-300'}`}
            >
              vs
            </span>
            <MoveIcon move={right.played} />
          </div>
          {/* Outcome Rewritten overlay, permanent on card */}
          {match.outcomeRewritten && (
            <div
              className="absolute inset-x-0 flex justify-center"
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            >
              <span
                className="outcome-rewrite-badge text-[8px] font-black uppercase tracking-widest text-cyan-400 px-2 py-0.5 rounded"
                style={{
                  background: 'rgba(8,145,178,0.08)',
                  border: '1px solid rgba(34,211,238,0.25)',
                  textShadow: '0 0 6px rgba(34,211,238,0.6)'
                }}
              >
                Outcome Rewritten
              </span>
            </div>
          )}

          {/* Right player */}
          <div className="flex flex-col items-end flex-1 min-w-0">
            <Link
              href={`/player/${encodeURIComponent(right.name)}`}
              onClick={(e) => e.stopPropagation()}
              className={`font-medium text-sm text-right underline decoration-gray-300 transition truncate max-w-full
              ${
                winner === right.name && isActive
                  ? cfg.winnerText
                  : winner === right.name
                    ? 'text-green-600 font-bold hover:decoration-green-600'
                    : 'text-gray-800 hover:decoration-indigo-600 hover:text-indigo-600'
              }`}
            >
              {right.name}
            </Link>
            {highlightPlayer === right.name && (
              <span
                className={`text-xs font-bold mt-1 px-2 py-0.5 rounded text-white ${resultColor(getPlayerResult(match, right.name))}`}
              >
                {getPlayerResult(match, right.name)}
              </span>
            )}
          </div>
        </div>

        {prediction?.result && (
          <div
            className={`flex mt-1 relative z-10 ${
              prediction.pick === left.name ? 'justify-start' : 'justify-end'
            }`}
          >
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-lg text-white
            inline-flex items-center justify-center whitespace-nowrap leading-none tracking-wide
            ${prediction.result === 'WIN' ? cfg.youWon : 'bg-red-500'}`}
            >
              {prediction.result === 'WIN' ? '✨ You won!' : 'You lost'}
            </span>
          </div>
        )}
      </li>
    )
  },
  (prev, next) => {
    return (
      prev.match.gameId === next.match.gameId &&
      prev.match.time === next.match.time &&
      prev.match.playerA.played === next.match.playerA.played &&
      prev.match.playerB.played === next.match.playerB.played &&
      prev.highlightPlayer === next.highlightPlayer &&
      prev.prediction?.confirmed === next.prediction?.confirmed &&
      prev.prediction?.result === next.prediction?.result &&
      prev.prediction?.pick === next.prediction?.pick &&
      prev.alwaysLeft === next.alwaysLeft &&
      prev.winStreak === next.winStreak &&
      prev.visualMode === next.visualMode &&
      prev.festivalModeKey === next.festivalModeKey
    )
  }
)

MatchRow.displayName = 'MatchRow'

interface MatchListProps {
  matches: Match[]
  highlightPlayer?: string
  isLoadingMore?: boolean
  hasMore?: boolean
  predictions?: Map<string, PredictionRecord>
  alwaysLeft?: boolean
  winStreak?: number
  visualMode?: string | null
  festivalModeKey?: string | null
}

const MatchList = ({
  matches,
  highlightPlayer,
  isLoadingMore,
  hasMore,
  predictions,
  alwaysLeft,
  winStreak = 0,
  visualMode = null,
  festivalModeKey = null
}: MatchListProps) => {
  return (
    <>
      <ul className="space-y-3">
        {matches.map((match) => (
          <MatchRow
            key={match.gameId}
            match={match}
            highlightPlayer={highlightPlayer}
            prediction={predictions?.get(match.gameId)}
            alwaysLeft={alwaysLeft}
            winStreak={winStreak}
            visualMode={visualMode}
            festivalModeKey={festivalModeKey}
          />
        ))}
      </ul>
      {isLoadingMore && (
        <p className="text-center text-gray-400 py-6">Loading more...</p>
      )}
      {!hasMore && matches.length > 0 && (
        <p className="text-center text-gray-400 py-6">
          You&apos;ve reached the end
        </p>
      )}
    </>
  )
}

export default MatchList
