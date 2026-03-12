'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchHistoricalLeaderboard } from '@/lib/api'
import LeaderboardTable from '@/components/LeaderboardTable'
import type { PlayerStats } from '@/types/rps'

const TODAY = new Date().toISOString().split('T')[0]
const FIRST_MATCH_DATE = '2026-02-16'

export default function LeaderboardPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stats, setStats] = useState<PlayerStats[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = useCallback(async (start?: string, end?: string) => {
    setIsLoading(true)
    try {
      const data = await fetchHistoricalLeaderboard(start, end)
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load all-time leaderboard on mount
  useEffect(() => {
    handleSearch()
  }, [handleSearch])

  const handleFilter = () => handleSearch(startDate || undefined, endDate || undefined)

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    handleSearch()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
      <p className="text-gray-500 mb-6">All-time standings, filter by date range to narrow results</p>

      {/* Date range filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              min={FIRST_MATCH_DATE}
              max={TODAY}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              min={FIRST_MATCH_DATE}
              max={TODAY}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleFilter}
              disabled={isLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded font-medium text-sm hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Filter'}
            </button>
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400 py-12">Building leaderboard...</p>
      ) : (
        <LeaderboardTable stats={stats} />
      )}
    </div>
  )
}