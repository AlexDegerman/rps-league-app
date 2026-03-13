'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { fetchPlayerStats, fetchMatchesByPlayer } from '@/lib/api'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import MatchList from '@/components/MatchList'

interface PlayerStats {
  total: number
  wins: number
  losses: number
  ties: number
  winRate: number
}

export default function PlayerPage() {
  const params = useParams()
  const name = decodeURIComponent(params.name as string)

  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    fetchPlayerStats(name)
      .then(setStats)
      .catch((err) => console.error('Failed to load player stats:', err))
      .finally(() => setStatsLoading(false))
  }, [name])

  const fetchFn = useCallback(
    (page: number) => fetchMatchesByPlayer(name, page),
    [name]
  )
  const { matches, hasMore, isLoading, isLoadingMore, loadMatches } =
    useInfiniteScroll({
      fetchFn,
      enabled: true
    })

  useEffect(() => {
    loadMatches(1)
  }, [loadMatches])

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{name}</h1>
      <p className="text-gray-500 mb-6">Player profile</p>

      {/* Stats cards */}
      {statsLoading ? (
        <p className="text-gray-400 py-4">Loading stats...</p>
      ) : (
        stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">Matches</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
              <p className="text-xs text-gray-500 mt-1">Wins</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
              <p className="text-xs text-gray-500 mt-1">Losses</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {stats.winRate}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Win Rate</p>
            </div>
          </div>
        )
      )}

      {/* Match history */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Match History
      </h2>
      {isLoading ? (
        <p className="text-center text-gray-400 py-8">Loading matches...</p>
      ) : matches.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No matches found</p>
      ) : (
        <MatchList
          matches={matches}
          highlightPlayer={name}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
        />
      )}
    </div>
  )
}
