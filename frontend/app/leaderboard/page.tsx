'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchHistoricalLeaderboard,
  fetchTodayLeaderboard,
  fetchPredictorLeaderboard,
  fetchWeeklyPredictorLeaderboard
} from '@/lib/api'
import LeaderboardTable from '@/components/LeaderboardTable'
import GemIcon from '@/components/GemIcon'
import { getNickname, getUserId } from '@/lib/user'
import type { PlayerStats } from '@/types/rps'

const TODAY = new Date().toISOString().split('T')[0]
const FIRST_MATCH_DATE = '2026-02-16'

type MainTab = 'predictors' | 'players'
type PredictorSubTab = 'weekly' | 'alltime'
type PlayerSubTab = 'alltime' | 'today'

interface PredictorEntry {
  user_id: string
  points: number
  peak_points?: number
  weekly_gained?: number
  wins: number
  losses: number
}

export default function LeaderboardPage() {
  const [mainTab, setMainTab] = useState<MainTab>('predictors')
  const [predictorSubTab, setPredictorSubTab] =
    useState<PredictorSubTab>('weekly')
  const [playerSubTab, setPlayerSubTab] = useState<PlayerSubTab>('alltime')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stats, setStats] = useState<PlayerStats[]>([])
  const [predictors, setPredictors] = useState<PredictorEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [myNickname, setMyNickname] = useState<string | null>(null)

  useEffect(() => {
    setMyUserId(getUserId())
    setMyNickname(getNickname())
  }, [])

  const loadPredictorsWeekly = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchWeeklyPredictorLeaderboard()
      setPredictors(data)
    } catch (err) {
      console.error('Failed to fetch weekly predictors:', err)
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
      console.error('Failed to fetch all time predictors:', err)
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
      console.error('Failed to fetch leaderboard:', err)
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

  useEffect(() => {
    if (mainTab === 'predictors') {
      if (predictorSubTab === 'weekly') loadPredictorsWeekly()
      else loadPredictorsAllTime()
    } else {
      if (playerSubTab === 'alltime') loadAllTime()
      else loadToday()
    }
  }, [
    mainTab,
    predictorSubTab,
    playerSubTab,
    loadPredictorsWeekly,
    loadPredictorsAllTime,
    loadAllTime,
    loadToday
  ])

  const handleFilter = () =>
    loadAllTime(startDate || undefined, endDate || undefined)

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    setFilterOpen(false)
    loadAllTime()
  }

  const renderPredictorTable = (
    pointsLabel: string,
    pointsKey: keyof PredictorEntry
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
                {pointsLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {predictors.map((entry, index) => {
              const isMe = entry.user_id === myUserId
              return (
                <tr
                  key={entry.user_id}
                  className={`border-b border-gray-50 ${index === 0 ? 'bg-yellow-50' : ''} ${isMe ? 'bg-purple-50' : ''}`}
                >
                  <td className="px-4 py-3 text-gray-400 font-medium">
                    {index === 0 ? '🏆' : index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {isMe ? (
                      <span className="text-purple-600 font-bold">
                        {myNickname ?? entry.user_id.slice(0, 8)}
                      </span>
                    ) : (
                      entry.user_id.slice(0, 8)
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-green-600 font-bold">
                    {Number(entry.wins)}
                  </td>
                  <td className="px-4 py-3 text-center text-red-500">
                    {Number(entry.losses)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <GemIcon size={16} />
                      <span className="font-bold text-purple-600">
                        {Number(entry[pointsKey] ?? 0)}
                      </span>
                    </div>
                  </td>
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
            ? predictorSubTab === 'alltime'
              ? 'Users ranked by peak points ever held'
              : 'Users ranked by total points gained this week'
            : 'Player standings based on number of wins'}
        </p>
      </div>

      <div className="sticky top-18.75 z-40 bg-gray-100 pb-4">
        {/* Main tabs */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setMainTab('predictors')}
            className={`px-4 py-2 rounded font-medium text-sm transition cursor-pointer ${
              mainTab === 'predictors'
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-indigo-600 text-white hover:bg-yellow-400 hover:text-gray-900'
            }`}
          >
            Predictors
          </button>
          <button
            onClick={() => setMainTab('players')}
            className={`px-4 py-2 rounded font-medium text-sm transition cursor-pointer ${
              mainTab === 'players'
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-indigo-600 text-white hover:bg-yellow-400 hover:text-gray-900'
            }`}
          >
            Players
          </button>
        </div>

        {/* Predictor sub-tabs */}
        {mainTab === 'predictors' && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setPredictorSubTab('weekly')}
              className={`px-3 py-1.5 rounded font-medium text-xs transition cursor-pointer ${
                predictorSubTab === 'weekly'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-purple-50'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPredictorSubTab('alltime')}
              className={`px-3 py-1.5 rounded font-medium text-xs transition cursor-pointer ${
                predictorSubTab === 'alltime'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-purple-50'
              }`}
            >
              All Time
            </button>
          </div>
        )}

        {/* Player sub-tabs */}
        {mainTab === 'players' && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setPlayerSubTab('alltime')}
              className={`px-3 py-1.5 rounded font-medium text-xs transition cursor-pointer ${
                playerSubTab === 'alltime'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setPlayerSubTab('today')}
              className={`px-3 py-1.5 rounded font-medium text-xs transition cursor-pointer ${
                playerSubTab === 'today'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50'
              }`}
            >
              Today
            </button>
          </div>
        )}

        {/* Player all time date filter */}
        {mainTab === 'players' && playerSubTab === 'alltime' && (
          <div>
            <button
              onClick={() => setFilterOpen((f) => !f)}
              className="sm:hidden mb-2 text-sm text-indigo-600 cursor-pointer"
            >
              {filterOpen ? 'Hide filter' : 'Filter by date'}
            </button>
            <div
              className={`${filterOpen ? 'block' : 'hidden'} sm:block bg-white rounded-lg shadow-sm border border-gray-100 p-4`}
            >
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs text-gray-500 mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={FIRST_MATCH_DATE}
                    max={TODAY}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto sm:shrink-0">
                  <button
                    onClick={handleFilter}
                    disabled={isLoading}
                    className="flex-1 sm:flex-none px-5 py-2 bg-indigo-600 text-white rounded font-medium text-sm hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? 'Loading...' : 'Filter'}
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={isLoading}
                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Leave blank for all-time standings
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2">
        {isLoading ? (
          <p className="text-center text-gray-400 py-12">
            {mainTab === 'predictors'
              ? 'Loading predictors...'
              : 'Building leaderboard...'}
          </p>
        ) : mainTab === 'predictors' ? (
          predictorSubTab === 'weekly' ? (
            renderPredictorTable('Gained', 'weekly_gained')
          ) : (
            renderPredictorTable('Peak', 'peak_points')
          )
        ) : (
          <LeaderboardTable stats={stats} />
        )}
      </div>
    </div>
  )
}
