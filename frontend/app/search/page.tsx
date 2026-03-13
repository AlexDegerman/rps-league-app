'use client'

import { useState, useCallback } from 'react'
import { fetchMatchesByDate } from '@/lib/api'
import MatchList from '@/components/MatchList'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

const TODAY = new Date().toISOString().split('T')[0]
const FIRST_MATCH_DATE = '2026-02-16'

export default function SearchPage() {
  const [date, setDate] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const fetchFn = useCallback((page: number) => fetchMatchesByDate(date, page), [date])
  const { matches, hasMore, isLoading, isLoadingMore, loadMatches, reset } = useInfiniteScroll({
    fetchFn,
    enabled: hasSearched
  })

  const handleSearch = () => {
    if (!date) return
    reset()
    setHasSearched(true)
    loadMatches(1)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Search</h1>
      <p className="text-gray-500 mb-6">Find matches by date</p>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              min={FIRST_MATCH_DATE}
              max={TODAY}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!date || isLoading}
            className="px-6 py-2 bg-indigo-600 text-white rounded font-medium text-sm hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </div>

      {!hasSearched ? (
        <p className="text-center text-gray-400 py-12">Select a date to view matches</p>
      ) : isLoading ? (
        <p className="text-center text-gray-400 py-12">Loading matches...</p>
      ) : matches.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No matches found for this date</p>
      ) : (
        <MatchList matches={matches} isLoadingMore={isLoadingMore} hasMore={hasMore} />
      )}
    </div>
  )
}