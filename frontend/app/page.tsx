'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchLatestMatches } from '@/lib/api'
import MatchList from '@/components/MatchList'
import PendingMatchCard from '@/components/PendingMatchCard'
import GemIcon from '@/components/GemIcon'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { getOrCreateUser, getUserId } from '@/lib/user'
import type { Match, PendingMatch, PredictionRecord } from '@/types/rps'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

let _backendReady = false

export default function HomePage() {
  const [backendReady, setBackendReady] = useState(_backendReady)
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([])
  const [predictions, setPredictions] = useState<Map<string, PredictionRecord>>(
    new Map()
  )
  const [points, setPoints] = useState<number>(500)
  const [betAmount, setBetAmount] = useState<number>(500)

  const markReady = () => {
    _backendReady = true
    setBackendReady(true)
  }

  const fetchFn = useCallback((page: number) => fetchLatestMatches(page), [])
  const {
    matches,
    setMatches,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMatches
  } = useInfiniteScroll({ fetchFn })

  useEffect(() => {
    getOrCreateUser()
    const userId = getUserId()
    if (!userId) return
    fetch(`${API_BASE}/api/predictions/${userId}/points`)
      .then((res) => res.json())
      .then((data) => {
        setPoints(data.points)
        setBetAmount(Math.min(500, data.points))
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchLatestMatches(1)
      .then((data) => {
        if (data.matches.length > 0) markReady()
        loadMatches(1)
      })
      .catch(() => {})
  }, [loadMatches])

  const handlePick = async (gameId: string, playerName: string) => {
    const userId = getUserId()
    if (!userId || betAmount <= 0) return

    setPredictions((prev) => {
      const next = new Map(prev)
      next.set(gameId, { gameId, pick: playerName })
      return next
    })

    await fetch(`${API_BASE}/api/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, gameId, pick: playerName, betAmount })
    })
  }

  const fetchUpdatedPoints = async () => {
    const userId = getUserId()
    if (!userId) return
    const res = await fetch(`${API_BASE}/api/predictions/${userId}/points`)
    const data = await res.json()
    setPoints(data.points)
    setBetAmount((prev) => Math.min(prev, data.points))
  }

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/live`)

    es.addEventListener('pending', (event) => {
      const pending: PendingMatch = JSON.parse(event.data)
      setPendingMatches((prev) => [pending, ...prev])
      markReady()
    })

    es.addEventListener('result', (event) => {
      const match: Match = JSON.parse(event.data)

      setPredictions((prev) => {
        const prediction = prev.get(match.gameId)
        if (!prediction) return prev
        const aWins =
          (match.playerA.played === 'ROCK' &&
            match.playerB.played === 'SCISSORS') ||
          (match.playerA.played === 'SCISSORS' &&
            match.playerB.played === 'PAPER') ||
          (match.playerA.played === 'PAPER' && match.playerB.played === 'ROCK')
        const winner = aWins ? match.playerA.name : match.playerB.name
        const result = winner === prediction.pick ? 'WIN' : 'LOSE'
        const next = new Map(prev)
        next.set(match.gameId, { ...prediction, result })
        return next
      })

      setPendingMatches((prev) => prev.filter((p) => p.gameId !== match.gameId))
      setMatches((prev) => {
        if (prev.some((m) => m.gameId === match.gameId)) return prev
        return [match, ...prev]
      })

      fetchUpdatedPoints()
    })

    es.onerror = () => console.error('SSE connection lost')
    return () => es.close()
  }, [setMatches])

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Latest Matches</h1>
      <p className="text-gray-500 mb-4">Live results from the RPS League</p>

      {/* Points display and bet input */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 mb-2 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <GemIcon size={24} />
          <span className="text-lg font-bold text-purple-600">{points}</span>
          <span className="text-sm text-gray-500">points</span>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <label className="text-sm text-gray-500 shrink-0">Bet amount</label>
          <input
            type="number"
            min={1}
            max={points}
            value={betAmount}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), points)
              setBetAmount(Math.max(1, val))
            }}
            className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <button
            onClick={() => setBetAmount(points)}
            className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition cursor-pointer"
          >
            All in
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">Points cannot drop below 500</p>

      {!backendReady ? (
        <p className="text-center text-gray-400 py-12">
          Connecting to live stream...
        </p>
      ) : isLoading ? (
        <p className="text-center text-gray-400 py-12">Loading matches...</p>
      ) : (
        <>
          {pendingMatches.length > 0 && (
            <ul className="space-y-3 mb-3">
              {pendingMatches.map((pending) => (
                <PendingMatchCard
                  key={pending.gameId}
                  pending={pending}
                  prediction={predictions.get(pending.gameId) ?? null}
                  onPick={handlePick}
                />
              ))}
            </ul>
          )}
          <MatchList
            matches={matches}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            predictions={predictions}
          />
        </>
      )}
    </div>
  )
}
