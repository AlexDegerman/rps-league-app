'use client'

import { useEffect, useState } from 'react'
import type { PendingMatch, PredictionRecord } from '@/types/rps'

interface PendingMatchCardProps {
  pending: PendingMatch
  prediction: PredictionRecord | null
  onPick: (gameId: string, playerName: string) => void
}

export default function PendingMatchCard({
  pending,
  prediction,
  onPick
}: PendingMatchCardProps) {
  const [timeLeft, setTimeLeft] = useState(5)

  useEffect(() => {
    if (timeLeft <= 0) return
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [timeLeft])

  const canPick = timeLeft > 0 && !prediction

  return (
    <li className="bg-white rounded-lg shadow-sm border border-indigo-200 p-4">
      <div className="flex justify-between items-center mb-2 gap-2">
        <span className="text-xs text-gray-400 shrink-0">
          {new Date(pending.time).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
          })}
        </span>
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-600 shrink-0">
          {timeLeft > 0 ? `${timeLeft}s` : 'Revealing...'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* Player A */}
        <div className="flex flex-col items-start flex-1 gap-1">
          <span className="font-medium text-sm text-gray-800">
            {pending.playerA}
          </span>
          {canPick && (
            <button
              onClick={() => onPick(pending.gameId, pending.playerA)}
              className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition cursor-pointer"
            >
              Bet
            </button>
          )}
          {prediction?.pick === pending.playerA && !canPick && (
            <span className="text-xs font-bold px-2 py-0.5 rounded text-white bg-indigo-400">
              Bet placed
            </span>
          )}
        </div>

        {/* Move icons placeholder */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-10 h-10 flex items-center justify-center text-xl text-gray-300 font-bold">
            ?
          </span>
          <span className="text-gray-300 text-sm font-bold">vs</span>
          <span className="w-10 h-10 flex items-center justify-center text-xl text-gray-300 font-bold">
            ?
          </span>
        </div>

        {/* Player B */}
        <div className="flex flex-col items-end flex-1 gap-1">
          <span className="font-medium text-sm text-gray-800">
            {pending.playerB}
          </span>
          {canPick && (
            <button
              onClick={() => onPick(pending.gameId, pending.playerB)}
              className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition cursor-pointer"
            >
              Bet
            </button>
          )}
          {prediction?.pick === pending.playerB && !canPick && (
            <span className="text-xs font-bold px-2 py-0.5 rounded text-white bg-indigo-400">
              Bet placed
            </span>
          )}
        </div>
      </div>
    </li>
  )
}
