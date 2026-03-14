'use client'

import Link from 'next/link'
import { formatDateTime, getPlayerResult, resultColor } from '@/lib/format'
import type { Match } from '@/types/rps'
import MoveIcon from '@/components/MoveIcon'

const getMatchWinner = (match: Match): string | 'TIE' => {
  const { playerA, playerB } = match
  if (playerA.played === playerB.played) return 'TIE'
  const aWins =
    (playerA.played === 'ROCK' && playerB.played === 'SCISSORS') ||
    (playerA.played === 'SCISSORS' && playerB.played === 'PAPER') ||
    (playerA.played === 'PAPER' && playerB.played === 'ROCK')
  return aWins ? playerA.name : playerB.name
}

interface MatchRowProps {
  match: Match
  highlightPlayer?: string
}

const MatchRow = ({ match, highlightPlayer }: MatchRowProps) => {
  const { playerA, playerB } = match
  const winner = getMatchWinner(match)
  const isTie = winner === 'TIE'

  return (
    <li className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      {/* Top row, timestamp + result badge */}
      <div className="flex justify-between items-center mb-2 gap-2">
        <span className="text-xs text-gray-400 shrink-0">
          {formatDateTime(match.time)}
        </span>
        {isTie ? (
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-400 text-white shrink-0">
            TIE
          </span>
        ) : (
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-500 text-white max-w-25 truncate block">
            {winner.split(' ')[0]} wins
          </span>
        )}
      </div>

      {/* Players + moves */}
      <div className="flex items-center justify-between gap-2">
        {/* Player A */}
        <div className="flex flex-col items-start flex-1">
          <Link
            href={`/player/${encodeURIComponent(playerA.name)}`}
            onClick={(e) => e.stopPropagation()}
            className={`font-medium text-sm underline decoration-gray-300 hover:decoration-indigo-600 hover:text-indigo-600 transition ${
              !isTie && winner === playerA.name
                ? 'text-green-600 font-bold'
                : 'text-gray-800'
            }`}
          >
            {playerA.name}
          </Link>
          {highlightPlayer === playerA.name && (
            <span
              className={`text-xs font-bold mt-1 px-2 py-0.5 rounded text-white ${resultColor(getPlayerResult(match, playerA.name))}`}
            >
              {getPlayerResult(match, playerA.name)}
            </span>
          )}
        </div>

        {/* Move icons */}
        <div className="flex items-center gap-2 shrink-0">
          <MoveIcon move={playerA.played} />
          <span className="text-gray-300 text-sm font-bold">vs</span>
          <MoveIcon move={playerB.played} />
        </div>

        {/* Player B */}
        <div className="flex flex-col items-end flex-1">
          <Link
            href={`/player/${encodeURIComponent(playerB.name)}`}
            onClick={(e) => e.stopPropagation()}
            className={`font-medium text-sm text-right underline decoration-gray-300 hover:decoration-indigo-600 hover:text-indigo-600 transition ${
              !isTie && winner === playerB.name
                ? 'text-green-600 font-bold'
                : 'text-gray-800'
            }`}
          >
            {playerB.name}
          </Link>
          {highlightPlayer === playerB.name && (
            <span
              className={`text-xs font-bold mt-1 px-2 py-0.5 rounded text-white ${resultColor(getPlayerResult(match, playerB.name))}`}
            >
              {getPlayerResult(match, playerB.name)}
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
}

const MatchList = ({
  matches,
  highlightPlayer,
  isLoadingMore,
  hasMore
}: MatchListProps) => {
  return (
    <>
      <ul className="space-y-3">
        {matches.map((match) => (
          <MatchRow
            key={match.gameId}
            match={match}
            highlightPlayer={highlightPlayer}
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
