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
      <div className="flex justify-between items-center mb-2 gap-2">
        {/* 2. Use formatDateTime here to ensure consistency with the MatchList */}
        <span className="text-xs text-gray-400 shrink-0">
          {formatDateTime(pending.time)}
        </span>

        <span
          className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 transition-colors ${
            timeLeft > 0
              ? timeLeft <= 2
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'bg-indigo-100 text-indigo-600'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {timeLeft > 0 ? `${timeLeft}s left` : 'Revealing...'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-start gap-1">
          <span className="font-medium text-sm text-gray-800">
            {pending.playerA}
          </span>

          {canPick ? (
            <button
              onClick={() => onPick(pending.gameId, pending.playerA)}
              className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 active:scale-95"
            >
              Bet
            </button>
          ) : (
            prediction?.pick === pending.playerA && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white bg-indigo-400 uppercase whitespace-nowrap inline-flex w-fit self-start">
                Bet placed
              </span>
            )
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 flex items-center justify-center text-lg text-gray-200 font-bold border-2 border-dashed border-gray-100 rounded-full">
            ?
          </span>
          <span className="text-gray-300 text-[10px] font-black uppercase">
            vs
          </span>
          <span className="w-8 h-8 flex items-center justify-center text-lg text-gray-200 font-bold border-2 border-dashed border-gray-100 rounded-full">
            ?
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="font-medium text-sm text-gray-800 text-right">
            {pending.playerB}
          </span>

          {canPick ? (
            <button
              onClick={() => onPick(pending.gameId, pending.playerB)}
              className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 active:scale-95"
            >
              Bet
            </button>
          ) : (
            prediction?.pick === pending.playerB && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white bg-indigo-400 uppercase whitespace-nowrap inline-flex w-fit self-end">
                Bet placed
              </span>
            )
          )}
        </div>
      </div>
    </div>
  )
}
