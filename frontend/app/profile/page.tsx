'use client'

import { useEffect, useState } from 'react'
import { getOrCreateUser, regenerateNickname, getUserId } from '@/lib/user'

interface UserStats {
  total: number
  wins: number
  losses: number
  ties: number
  winRate: number
}

export default function ProfilePage() {
  const [nickname, setNickname] = useState('')
  const [stats, setStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const { nickname } = getOrCreateUser()
    setNickname(nickname)

    const userId = getUserId()
    if (!userId) return

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/predictions/${userId}/stats`)
      .then((res) => res.json())
      .then(setStats)
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setStatsLoading(false))
  }, [])

  const handleRegenerate = () => {
    const newNickname = regenerateNickname()
    setNickname(newNickname)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Profile</h1>
      <p className="text-gray-500 mb-6">Your prediction stats</p>

      {/* Nickname */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 mb-6">
        <p className="text-xs text-gray-500 mb-1">Your nickname</p>
        <div className="flex items-center gap-3">
          <p className="text-2xl font-bold text-gray-900">{nickname}</p>
          <button
            onClick={handleRegenerate}
            className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition cursor-pointer"
          >
            Randomize
          </button>
        </div>
      </div>

      {/* Prediction stats */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Prediction Stats
      </h2>
      {statsLoading ? (
        <p className="text-gray-400 py-2">Loading stats...</p>
      ) : !stats || stats.total === 0 ? (
        <p className="text-gray-400 py-2">
          No predictions yet, start predicting on the home page!
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Predictions</p>
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
      )}
    </div>
  )
}
