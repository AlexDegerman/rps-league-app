'use client'

export const dynamic = 'force-dynamic'

import { useState, useCallback, useRef, Suspense, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { fetchHistoricalLeaderboard, fetchTodayLeaderboard } from '@/lib/api'
import type { PlayerStats } from '@/types/rps'
import Link from 'next/link'
import LeaderboardTable from '@/components/LeaderboardTable'

const TODAY = new Date().toISOString().split('T')[0]
const FIRST_MATCH_DATE = '2026-02-16'

type PlayerSubTab = 'today' | 'alltime'

function PlayerLeaderboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [playerSubTab, setPlayerSubTab] = useState<PlayerSubTab>(
    (searchParams.get('tab') as PlayerSubTab) || 'today'
  )
  const [startDate, setStartDate] = useState(searchParams.get('start') || '')
  const [endDate, setEndDate] = useState(searchParams.get('end') || '')
  const [stats, setStats] = useState<PlayerStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const activeFilters = useRef({
    start: searchParams.get('start') || '',
    end: searchParams.get('end') || ''
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data =
        playerSubTab === 'today'
          ? await fetchTodayLeaderboard()
          : await fetchHistoricalLeaderboard(
              activeFilters.current.start || undefined,
              activeFilters.current.end || undefined
            )
      setStats(data.slice(0, 200))
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
      setStats([])
    } finally {
      setIsLoading(false)
    }
  }, [playerSubTab])

  const updateUrl = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString())
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) newParams.delete(key)
        else newParams.set(key, value)
      })
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleTabChange = (tab: PlayerSubTab) => {
    setPlayerSubTab(tab)
    updateUrl({ tab })
  }

  const handleFilter = () => {
    activeFilters.current = { start: startDate, end: endDate }
    updateUrl({ start: startDate || null, end: endDate || null })
    loadData()
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    activeFilters.current = { start: '', end: '' }
    updateUrl({ start: null, end: null })
    loadData()
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex gap-2 mb-4">
        <Link
          href="/leaderboard"
          className="px-6 py-2 rounded font-bold text-xs uppercase bg-indigo-600 text-white hover:bg-indigo-700 transition"
        >
          Predictors
        </Link>
        <button className="px-6 py-2 rounded font-bold text-xs uppercase bg-yellow-400 text-gray-900 shadow-sm">
          Players
        </button>
      </div>

      <div className="sticky top-16 z-40 bg-gray-100 pb-4">
        <div className="flex gap-2 mb-3">
          {(['today', 'alltime'] as PlayerSubTab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`px-3 py-1.5 rounded font-bold text-[10px] uppercase transition cursor-pointer ${
                playerSubTab === t
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50'
              }`}
            >
              {t === 'today' ? 'Today' : 'All Time'}
            </button>
          ))}
        </div>

        {playerSubTab === 'alltime' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={startDate}
                  min={FIRST_MATCH_DATE}
                  max={TODAY}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={endDate}
                  min={FIRST_MATCH_DATE}
                  max={TODAY}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleFilter}
                  disabled={isLoading}
                  className="flex-1 px-5 py-2 bg-indigo-600 text-white rounded font-bold text-xs uppercase disabled:opacity-50"
                >
                  Filter
                </button>
                <button
                  onClick={handleClear}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded font-bold text-xs uppercase text-gray-600"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 pb-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
            <p className="text-gray-400 text-sm">Fetching standings...</p>
          </div>
        ) : (
          <>
            <LeaderboardTable stats={stats} />
            {stats.length > 0 && (
              <p className="text-center text-gray-400 text-xs py-8 uppercase font-bold tracking-widest">
                Top 200 Rankings
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function PlayerLeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
          Loading...
        </div>
      }
    >
      <PlayerLeaderboardContent />
    </Suspense>
  )
}
