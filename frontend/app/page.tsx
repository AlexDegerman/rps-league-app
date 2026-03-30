'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { fetchLatestMatches } from '@/lib/api'
import MatchList from '@/components/MatchList'
import PendingMatchCard from '@/components/PendingMatchCard'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { Match, PendingMatch, PredictionRecord } from '@/types/rps'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

let _backendReady = false

export default function HomePage() {
  const [backendReady, setBackendReady] = useState(_backendReady)
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([])
  const [predictions, setPredictions] = useState<Map<string, PredictionRecord>>(
    new Map()
  )

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
  fetchLatestMatches(1)
    .then((data) => {
      if (data.matches.length > 0) markReady()
      loadMatches(1)
    })
    .catch(() => {})
}, [loadMatches])

  const handlePick = (gameId: string, playerName: string) => {
    setPredictions((prev) => {
      const next = new Map(prev)
      next.set(gameId, { gameId, pick: playerName })
      return next
    })
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

      // Resolve prediction if one was made
      setPredictions((prev) => {
        const prediction = prev.get(match.gameId)
        if (!prediction) return prev

        const winner =
          match.playerA.played === match.playerB.played
            ? 'TIE'
            : (match.playerA.played === 'ROCK' &&
                  match.playerB.played === 'SCISSORS') ||
                (match.playerA.played === 'SCISSORS' &&
                  match.playerB.played === 'PAPER') ||
                (match.playerA.played === 'PAPER' &&
                  match.playerB.played === 'ROCK')
              ? match.playerA.name
              : match.playerB.name

        const result =
          winner === 'TIE' ? 'TIE' : winner === prediction.pick ? 'WIN' : 'LOSE'

        const next = new Map(prev)
        next.set(match.gameId, { ...prediction, result })
        return next
      })

      // Move from pending to match list
      setPendingMatches((prev) => prev.filter((p) => p.gameId !== match.gameId))
      setMatches((prev) => {
        if (prev.some((m) => m.gameId === match.gameId)) return prev
        return [match, ...prev]
      })
    })

    es.onerror = () => console.error('SSE connection lost')
    return () => es.close()
  }, [setMatches])

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Latest Matches</h1>
      <p className="text-gray-500 mb-6">Live results from the RPS League</p>
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
