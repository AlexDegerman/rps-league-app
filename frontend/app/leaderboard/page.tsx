'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  fetchHistoricalLeaderboard,
  fetchTodayLeaderboard,
  fetchPredictorLeaderboard,
  fetchWeeklyPredictorLeaderboard,
  fetchCurrentPredictorLeaderboard
} from '@/lib/api'
import LeaderboardTable from '@/components/LeaderboardTable'
import GemIcon from '@/components/icons/GemIcon'
import { getUserId } from '@/lib/user'
import type { PlayerStats } from '@/types/rps'
import { formatPoints } from '@/lib/format'

const TODAY = new Date().toISOString().split('T')[0]
const FIRST_MATCH_DATE = '2026-02-16'

type MainTab = 'predictors' | 'players'
type PredictorSubTab = 'current' | 'weekly' | 'alltime'
type PlayerSubTab = 'alltime' | 'today'

interface PredictorEntry {
  user_id: string
  points: number
  peak_points?: number
  weekly_gained?: number
  wins: number
  losses: number
  nickname: string
}

export default function LeaderboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // 1. Initialize state from URL
  const [mainTab, setMainTab] = useState<MainTab>(
    (searchParams.get('m') as MainTab) || 'predictors'
  )
  const [predictorSubTab, setPredictorSubTab] = useState<PredictorSubTab>(
    (searchParams.get('ps') as PredictorSubTab) || 'current'
  )
  const [playerSubTab, setPlayerSubTab] = useState<PlayerSubTab>(
    (searchParams.get('pls') as PlayerSubTab) || 'alltime'
  )

  // 2. Date States for the Inputs
  const [startDate, setStartDate] = useState(searchParams.get('start') || '')
  const [endDate, setEndDate] = useState(searchParams.get('end') || '')

  // 3. Active Filters Ref (Fixes the Linter warning without disabling it)
  const activeFilters = useRef({
    start: searchParams.get('start') || '',
    end: searchParams.get('end') || ''
  })

  const [stats, setStats] = useState<PlayerStats[]>([])
  const [predictors, setPredictors] = useState<PredictorEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [myUserId, setMyUserId] = useState<string | null>(null)

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
    setMyUserId(getUserId())
  }, [])

  const loadPredictorsCurrent = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchCurrentPredictorLeaderboard()
      setPredictors(data)
    } catch (err) {
      console.error('Failed to fetch current:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadPredictorsWeekly = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchWeeklyPredictorLeaderboard()
      setPredictors(data)
    } catch (err) {
      console.error('Failed to fetch weekly:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadPredictorsAllTime = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchPredictorLeaderboard()
      setPredictors(data)
    } catch (err) {
      console.error('Failed to fetch predictor all-time:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadAllTime = useCallback(async (start?: string, end?: string) => {
    setIsLoading(true)
    try {
      const data = await fetchHistoricalLeaderboard(start, end)
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch player leaderboard:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadToday = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchTodayLeaderboard()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch today leaderboard:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // MASTER EFFECT: Re-runs only on Tab changes
  useEffect(() => {
    if (mainTab === 'predictors') {
      if (predictorSubTab === 'current') loadPredictorsCurrent()
      else if (predictorSubTab === 'weekly') loadPredictorsWeekly()
      else loadPredictorsAllTime()
    } else {
      if (playerSubTab === 'alltime') {
        // Use the Ref values here
        loadAllTime(
          activeFilters.current.start || undefined,
          activeFilters.current.end || undefined
        )
      } else {
        loadToday()
      }
    }
  }, [
    mainTab,
    predictorSubTab,
    playerSubTab,
    loadPredictorsCurrent,
    loadPredictorsWeekly,
    loadPredictorsAllTime,
    loadAllTime,
    loadToday
  ])

  const handleMainTabChange = (tab: MainTab) => {
    setMainTab(tab)
    updateUrl({ m: tab })
  }

  const handlePredictorSubChange = (tab: PredictorSubTab) => {
    setPredictorSubTab(tab)
    updateUrl({ ps: tab })
  }

  const handlePlayerSubChange = (tab: PlayerSubTab) => {
    setPlayerSubTab(tab)
    updateUrl({ pls: tab })
  }

  const handleFilter = () => {
    // Sync UI state to the Ref before triggering load
    activeFilters.current = { start: startDate, end: endDate }
    updateUrl({ start: startDate || null, end: endDate || null })
    loadAllTime(startDate || undefined, endDate || undefined)
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    activeFilters.current = { start: '', end: '' }
    updateUrl({ start: null, end: null })
    loadAllTime()
  }

  const renderPredictorTable = (
    pointsLabel?: string,
    pointsKey?: keyof PredictorEntry
  ) =>
    predictors.length === 0 ? (
      <p className="text-center text-gray-400 py-12">No predictors yet</p>
    ) : (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium w-10">
                #
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">
                Nickname
              </th>
              <th className="text-center px-4 py-3 text-green-600 font-medium">
                W
              </th>
              <th className="text-center px-4 py-3 text-red-500 font-medium">
                L
              </th>
              <th className="text-right px-4 py-3 text-purple-500 font-medium">
                Current
              </th>
              {pointsLabel && (
                <th className="text-right px-4 py-3 text-purple-500 font-medium">
                  {pointsLabel}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {predictors.map((entry, index) => {
              const isMe = entry.user_id === myUserId

              return (
                <tr
                  key={entry.user_id}
                  className={`border-b border-gray-50 ${isMe ? 'bg-purple-50' : ''}`}
                >
                  {/* 1. Rank Column */}
                  <td className="px-4 py-3 font-bold text-gray-400">
                    {index + 1}
                  </td>

                  {/* 2. Nickname Column */}
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      {isMe ? (
                        <>
                          <span className="text-purple-600 font-bold">
                            {entry.nickname ?? entry.user_id.slice(0, 8)}
                          </span>
                          <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter border border-purple-200">
                            YOU
                          </span>
                        </>
                      ) : (
                        <span>
                          {entry.nickname ?? entry.user_id.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 3. Wins Column */}
                  <td className="px-4 py-3 text-center text-green-600 font-bold">
                    {Number(entry.wins)}
                  </td>

                  {/* 4. Losses Column */}
                  <td className="px-4 py-3 text-center text-red-500">
                    {Number(entry.losses)}
                  </td>

                  {/* 5. Current Points Column */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <GemIcon size={16} />
                      <span className="font-bold text-purple-600">
                        {formatPoints(entry.points)}
                      </span>
                    </div>
                  </td>

                  {/* 6. Optional (Gained/Peak) Column */}
                  {pointsKey && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <GemIcon size={16} />
                        <span className="font-bold text-purple-600">
                          {formatPoints(Number(entry[pointsKey] ?? 0))}
                        </span>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="py-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Leaderboard</h1>
        <p className="text-gray-500">
          {mainTab === 'predictors'
            ? predictorSubTab === 'current'
              ? 'Users ranked by current points'
              : predictorSubTab === 'alltime'
                ? 'Users ranked by peak points'
                : 'Weekly gains'
            : 'Player standings'}
        </p>
      </div>

      <div className="sticky top-18.75 z-40 bg-gray-100 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => handleMainTabChange('predictors')}
            className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-tight transition cursor-pointer ${mainTab === 'predictors' ? 'bg-yellow-400 text-gray-900 shadow-sm' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            Predictors
          </button>
          <button
            onClick={() => handleMainTabChange('players')}
            className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-tight transition cursor-pointer ${mainTab === 'players' ? 'bg-yellow-400 text-gray-900 shadow-sm' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            Players
          </button>
        </div>

        {mainTab === 'predictors' && (
          <div className="flex gap-2 mb-3">
            {(['current', 'weekly', 'alltime'] as PredictorSubTab[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => handlePredictorSubChange(t)}
                  className={`px-3 py-1.5 rounded font-bold text-[10px] uppercase transition cursor-pointer ${predictorSubTab === t ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-purple-50'}`}
                >
                  {t === 'alltime' ? 'All Time' : t}
                </button>
              )
            )}
          </div>
        )}

        {mainTab === 'players' && (
          <div className="flex gap-2 mb-3">
            {(['alltime', 'today'] as PlayerSubTab[]).map((t) => (
              <button
                key={t}
                onClick={() => handlePlayerSubChange(t)}
                className={`px-3 py-1.5 rounded font-bold text-[10px] uppercase transition cursor-pointer ${playerSubTab === t ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50'}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {mainTab === 'players' && playerSubTab === 'alltime' && (
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
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
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
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
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

      <div className="pt-2">
        {isLoading ? (
          <p className="text-center text-gray-400 py-12">
            Loading Leaderboard...
          </p>
        ) : mainTab === 'predictors' ? (
          renderPredictorTable(
            predictorSubTab === 'weekly'
              ? 'Gained'
              : predictorSubTab === 'alltime'
                ? 'Peak'
                : undefined,
            predictorSubTab === 'weekly'
              ? 'weekly_gained'
              : predictorSubTab === 'alltime'
                ? 'peak_points'
                : undefined
          )
        ) : (
          <LeaderboardTable stats={stats} />
        )}
      </div>
    </div>
  )
}
