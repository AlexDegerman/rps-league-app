'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchHistoricalLeaderboard,
  fetchTodayLeaderboard,
  fetchPredictorLeaderboard
} from '@/lib/api'
import LeaderboardTable from '@/components/LeaderboardTable'
import GemIcon from '@/components/GemIcon'
import { getNickname, getUserId } from '@/lib/user'
import type { PlayerStats } from '@/types/rps'

const TODAY = new Date().toISOString().split('T')[0]
const FIRST_MATCH_DATE = '2026-02-16'

type Tab = 'alltime' | 'today' | 'predictors'

interface PredictorEntry {
  user_id: string
  points: number
  wins: number
  losses: number
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('alltime')
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

  const loadPredictors = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchPredictorLeaderboard()
      setPredictors(data)
    } catch (err) {
      console.error('Failed to fetch predictor leaderboard:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'alltime') loadAllTime()
    else if (tab === 'today') loadToday()
    else loadPredictors()
  }, [tab, loadAllTime, loadToday, loadPredictors])

  const handleFilter = () =>
    loadAllTime(startDate || undefined, endDate || undefined)

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    setFilterOpen(false)
    loadAllTime()
  }

return (
  <div className="max-w-2xl mx-auto px-4">
    <div className="py-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Leaderboard</h1>
      <p className="text-gray-500">
        {tab === 'predictors'
          ? 'Users ranked by prediction points'
          : 'Player standings based on number of wins'}
      </p>
    </div>

    <div className="sticky top-18.75 z-40 bg-gray-100 pb-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab('alltime')}
          className={`px-4 py-2 rounded font-medium text-sm transition cursor-pointer ${
            tab === 'alltime'
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-indigo-600 text-white hover:bg-yellow-400 hover:text-gray-900'
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => setTab('today')}
          className={`px-4 py-2 rounded font-medium text-sm transition cursor-pointer ${
            tab === 'today'
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-indigo-600 text-white hover:bg-yellow-400 hover:text-gray-900'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setTab('predictors')}
          className={`px-4 py-2 rounded font-medium text-sm transition cursor-pointer ${
            tab === 'predictors'
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-indigo-600 text-white hover:bg-yellow-400 hover:text-gray-900'
          }`}
        >
          Predictors
        </button>
        {tab === 'alltime' && (
          <button
            onClick={() => setFilterOpen((f) => !f)}
            className="sm:hidden ml-auto text-sm text-indigo-600 cursor-pointer"
          >
            {filterOpen ? 'Hide filter' : 'Filter by date'}
          </button>
        )}
      </div>

      {tab === 'alltime' && (
        <div
          className={`${filterOpen ? 'block' : 'hidden'} sm:block bg-white rounded-lg shadow-sm border border-gray-100 p-4`}
        >
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs text-gray-500 mb-1">From</label>
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
      )}
    </div>

    <div className="pt-2">
      {isLoading ? (
        <p className="text-center text-gray-400 py-12">
          {tab === 'predictors'
            ? 'Loading predictors...'
            : 'Building leaderboard...'}
        </p>
      ) : tab === 'predictors' ? (
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
                    Points
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
                            {entry.points}
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
      ) : (
        <LeaderboardTable stats={stats} />
      )}
    </div>
  </div>
)
}
