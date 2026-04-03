'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PendingMatch, PredictionRecord } from '@/types/rps'
import { formatDateTime } from '@/lib/format'

interface PendingMatchCardProps {
  pending: PendingMatch
  prediction: PredictionRecord | null
  onPick: (gameId: string, playerName: string) => void
  serverOffset: number
}

export default function PendingMatchCard({
  pending,
  prediction,
  onPick,
  serverOffset
}: PendingMatchCardProps) {
  const calculateTimeLeft = useCallback(() => {
    if (!pending.expiresAt) return 0
    const correctedNow = Date.now() + serverOffset
    const diff = Math.max(
      0,
      Math.ceil((pending.expiresAt - correctedNow) / 1000)
    )
    return diff
  }, [pending.expiresAt, serverOffset])

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      if (remaining <= 0) clearInterval(id)
    }, 200)
    return () => clearInterval(id)
  }, [calculateTimeLeft])

  const canPick = timeLeft > 0 && !prediction

  return (
    <div className="bg-white rounded-lg shadow-sm border border-indigo-200 p-4 mb-3 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-4 gap-2">
        <span className="text-xs text-gray-400 shrink-0">
          {formatDateTime(pending.time)}
        </span>

        <span
          className={`text-[13px] font-black px-3 py-1.5 rounded-md shrink-0 transition-colors min-w-18.75 text-center shadow-sm ${
            timeLeft > 0
              ? timeLeft <= 2
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {timeLeft > 0 ? `${timeLeft}s left` : 'Revealing...'}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3">
        {/* Left Side Column */}
        <div className="flex flex-col items-center flex-1 gap-2">
          <span className="font-bold text-sm text-gray-800 text-center leading-tight min-h-10 flex items-center">
            {pending.playerA}
          </span>

          {canPick ? (
            <button
              onClick={() => onPick(pending.gameId, pending.playerA)}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 active:scale-95 shadow-sm lg:max-w-40"
            >
              BET
            </button>
          ) : (
            prediction?.pick === pending.playerA && (
              <span className="...">
                {prediction.confirmed ? 'BET PLACED' : 'CONFIRMING...'}
              </span>
            )
          )}
        </div>

        {/* Static VS Divider */}
        <div className="flex flex-col items-center pt-2 shrink-0">
          <span className="text-gray-300 text-[10px] font-black uppercase">
            vs
          </span>
        </div>

        {/* Right Side Column */}
        <div className="flex flex-col items-center flex-1 gap-2">
          <span className="font-bold text-sm text-gray-800 text-center leading-tight min-h-10 flex items-center">
            {pending.playerB}
          </span>

          {canPick ? (
            <button
              onClick={() => onPick(pending.gameId, pending.playerB)}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 active:scale-95 shadow-sm lg:max-w-40"
            >
              BET
            </button>
          ) : (
            prediction?.pick === pending.playerB && (
              <span className="...">
                {prediction.confirmed ? 'BET PLACED' : 'CONFIRMING...'}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  )
}
