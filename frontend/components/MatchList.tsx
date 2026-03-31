'use client'

import Link from 'next/link'
import { formatDateTime, getPlayerResult, resultColor } from '@/lib/format'
import type { Match, PredictionRecord } from '@/types/rps'
import MoveIcon from '@/components/MoveIcon'

const getMatchWinner = (match: Match): string => {
  const { playerA, playerB } = match
  const aWins =
    (playerA.played === 'ROCK' && playerB.played === 'SCISSORS') ||
    (playerA.played === 'SCISSORS' && playerB.played === 'PAPER') ||
    (playerA.played === 'PAPER' && playerB.played === 'ROCK')
  return aWins ? playerA.name : playerB.name
}

interface MatchRowProps {
  match: Match
  highlightPlayer?: string
  prediction?: PredictionRecord
  alwaysLeft?: boolean
}

const MatchRow = ({
  match,
  highlightPlayer,
  prediction,
  alwaysLeft
}: MatchRowProps) => {
  const isFlipped =
    alwaysLeft && highlightPlayer && match.playerB.name === highlightPlayer
  const left = isFlipped ? match.playerB : match.playerA
  const right = isFlipped ? match.playerA : match.playerB
  const winner = getMatchWinner(match)

  return (
    <li className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      {/* Top row: date and winner badge swap sides based on who won */}
      <div className="flex justify-between items-center mb-2 gap-2">
        {winner === left.name ? (
          <>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-500 text-white shrink-0">
              {winner.split(' ')[0]} wins
            </span>
            <span className="text-xs text-gray-400 shrink-0">
              {formatDateTime(match.time)}
            </span>
          </>
        ) : (
          <>
            <span className="text-xs text-gray-400 shrink-0">
              {formatDateTime(match.time)}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-500 text-white shrink-0">
              {winner.split(' ')[0]} wins
            </span>
          </>
        )}
      </div>

      {/* Players + moves */}
      <div className="flex items-center justify-between gap-2">
        {/* Left player */}
        <div className="flex flex-col items-start flex-1">
          <Link
            href={`/player/${encodeURIComponent(left.name)}`}
            onClick={(e) => e.stopPropagation()}
            className={`font-medium text-sm underline decoration-gray-300 hover:decoration-indigo-600 hover:text-indigo-600 transition ${
              winner === left.name
                ? 'text-green-600 font-bold'
                : 'text-gray-800'
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
              className={`text-xs font-bold mt-1 px-2 py-0.5 rounded text-white ${
                prediction.result === 'WIN' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {prediction.result === 'WIN' ? 'You won!' : 'You lost'}
            </span>
          )}
        </div>

        {/* Move icons */}
        <div className="flex items-center gap-2 shrink-0">
          <MoveIcon move={left.played} />
          <span className="text-gray-300 text-sm font-bold">vs</span>
          <MoveIcon move={right.played} />
        </div>

        {/* Right player */}
        <div className="flex flex-col items-end flex-1">
          <Link
            href={`/player/${encodeURIComponent(right.name)}`}
            onClick={(e) => e.stopPropagation()}
            className={`font-medium text-sm text-right underline decoration-gray-300 hover:decoration-indigo-600 hover:text-indigo-600 transition ${
              winner === right.name
                ? 'text-green-600 font-bold'
                : 'text-gray-800'
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
              className={`text-xs font-bold mt-1 px-2 py-0.5 rounded text-white ${
                prediction.result === 'WIN' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {prediction.result === 'WIN' ? 'You won!' : 'You lost'}
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
}

const MatchList = ({
  matches,
  highlightPlayer,
  isLoadingMore,
  hasMore,
  predictions,
  alwaysLeft
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