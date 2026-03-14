'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { fetchLatestMatches } from '@/lib/api'
import MatchList from '@/components/MatchList'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { Match } from '@/types/rps'

let _backendReady = false

export default function HomePage() {
  const initialLoadRef = useRef(false)
  const [backendReady, setBackendReady] = useState(_backendReady)
  const fetchFn = useCallback((page: number) => fetchLatestMatches(page), [])

  const {
    matches,
    setMatches,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMatches
  } = useInfiniteScroll({ fetchFn })

  const markReady = () => {
    _backendReady = true
    setBackendReady(true)
  }

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await fetchLatestMatches(1)
        setMatches((prev) => {
          const existingIds = new Set(prev.map((m) => m.gameId))
          const newOnes = data.matches.filter(
            (m: Match) => !existingIds.has(m.gameId)
          )
          if (newOnes.length === 0) return prev
          return [...newOnes, ...prev]
        })
        if (data.matches.length > 0) markReady()
      } catch {
        setBackendReady(false)
      }
    }
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [setMatches])

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true
      loadMatches(1)
    }
  }, [loadMatches])

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Latest Matches</h1>
      <p className="text-gray-500 mb-6">Live results from the RPS League</p>

      {!backendReady ? (
        <p className="text-center text-gray-400 py-12">
          Server is starting up, matches will appear shortly. Full match history
          may take a moment to load.
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
