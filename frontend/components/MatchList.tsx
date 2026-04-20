'use client'

import Link from 'next/link'
import { formatDateTime, getPlayerResult, resultColor } from '@/lib/format'
import type { Match, MatchRowProps, PredictionRecord } from '@/types/rps'
import MoveIcon from '@/components/icons/MoveIcon'
import { MODE_CONFIG } from '@/lib/constants'

const getMatchWinner = (match: Match): string => {
  const { playerA, playerB } = match
  const aWins =
    (playerA.played === 'ROCK' && playerB.played === 'SCISSORS') ||
    (playerA.played === 'SCISSORS' && playerB.played === 'PAPER') ||
    (playerA.played === 'PAPER' && playerB.played === 'ROCK')
  return aWins ? playerA.name : playerB.name
}

const MatchRow = ({
  match,
  highlightPlayer,
  prediction,
  alwaysLeft,
  winStreak = 0,
  visualMode = null
}: MatchRowProps) => {
  const isFlipped =
    alwaysLeft && highlightPlayer && match.playerB.name === highlightPlayer
  const left = isFlipped ? match.playerB : match.playerA
  const right = isFlipped ? match.playerA : match.playerB
  const winner = getMatchWinner(match)

  // Only apply themed styling to rows where the user has a prediction
  const hasPrediction = !!prediction
  const isFlash = visualMode?.startsWith('flash_') ?? false
  const isInferno = !isFlash && winStreak >= 5
  const isFever = !isFlash && winStreak >= 3 && winStreak < 5
  const isActive = hasPrediction && (isFlash || isInferno || isFever)

  const activeKey = (
    isActive
      ? visualMode && visualMode in MODE_CONFIG
        ? visualMode
        : isInferno
          ? 'inferno'
          : isFever
            ? 'fever'
            : 'default'
      : 'default'
  ) as keyof typeof MODE_CONFIG

  const cfg = MODE_CONFIG[activeKey]

  return (
    <li
      className={`relative rounded-xl shadow-sm border-2 p-4 overflow-hidden transition-all duration-300
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
      <div className="flex justify-between items-center mb-2 gap-2 relative z-10">
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
        <div className="flex flex-col items-start flex-1">
          <Link
            href={`/player/${encodeURIComponent(left.name)}`}
            onClick={(e) => e.stopPropagation()}
            className={`font-medium text-sm underline decoration-gray-300 transition
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
          {prediction?.pick === left.name && prediction.result && (
            <span
              className={`text-xs font-black mt-1 px-2.5 py-0.5 rounded-lg text-white
              inline-flex items-center justify-center whitespace-nowrap w-fit leading-none tracking-wide
              ${prediction.result === 'WIN' ? cfg.youWon : 'bg-red-500'}`}
            >
              {prediction.result === 'WIN' ? '✨ You won!' : 'You lost'}
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

        {/* Right player */}
        <div className="flex flex-col items-end flex-1">
          <Link
            href={`/player/${encodeURIComponent(right.name)}`}
            onClick={(e) => e.stopPropagation()}
            className={`font-medium text-sm text-right underline decoration-gray-300 transition
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
          {prediction?.pick === right.name && prediction.result && (
            <span
              className={`text-xs font-black mt-1 px-2.5 py-0.5 rounded-lg text-white
              inline-flex items-center justify-center whitespace-nowrap w-fit leading-none tracking-wide
              ${prediction.result === 'WIN' ? cfg.youWon : 'bg-red-500'}`}
            >
              {prediction.result === 'WIN' ? '✨ You won!' : 'You lost'}
            </span>
          )}
        </div>
      </div>
    </li>
  )
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
}

const MatchList = ({
  matches,
  highlightPlayer,
  isLoadingMore,
  hasMore,
  predictions,
  alwaysLeft,
  winStreak = 0,
  visualMode = null
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
