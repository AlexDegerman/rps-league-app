'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { fetchPlayerStats, fetchMatchesByPlayer } from '@/lib/api'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import MatchList from '@/components/MatchList'
import type { SinglePlayerStats } from '@/types/rps'

export default function PlayerPage() {
  const params = useParams()
  const name = decodeURIComponent(params.name as string)
  const [stats, setStats] = useState<SinglePlayerStats | null>(null)
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
    useInfiniteScroll({ fetchFn, enabled: true })

  useEffect(() => {
    loadMatches(1)
  }, [loadMatches])

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{name}</h1>
      <p className="text-gray-500 mb-6">Player profile</p>

      {statsLoading ? (
        <p className="text-gray-400 py-2">Loading stats...</p>
      ) : (
        stats && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <StatCard label="Matches" value={stats.total} />
            <StatCard label="Wins" value={stats.wins} color="text-green-600" />
            <StatCard
              label="Losses"
              value={stats.losses}
              color="text-red-500"
            />
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 text-center col-span-3">
              <p className="text-2xl font-bold text-indigo-600">
                {stats.winRate}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Win Rate</p>
            </div>
          </div>
        )
      )}

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
          alwaysLeft
        />
      )}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  color?: string
}

function StatCard({ label, value, color = 'text-gray-900' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
