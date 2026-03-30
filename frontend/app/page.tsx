'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchLatestMatches } from '@/lib/api'
import MatchList from '@/components/MatchList'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { Match } from '@/types/rps'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
let _backendReady = false

export default function HomePage() {
  const [backendReady, setBackendReady] = useState(_backendReady)

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
    loadMatches(1)
  }, [loadMatches])

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/live`)

    es.onmessage = (event) => {
      try {
        const match: Match = JSON.parse(event.data)
        setMatches((prev) => {
          if (prev.some((m) => m.gameId === match.gameId)) return prev
          return [match, ...prev]
        })
        markReady()
      } catch (err) {
        console.error('Failed to parse SSE event:', err)
      }
    }

    es.onerror = () => {
      console.error('SSE connection lost')
    }

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
      ) : matches.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No matches found</p>
      ) : (
        <MatchList
          matches={matches}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
        />
      )}
    </div>
  )
}
