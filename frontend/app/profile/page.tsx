'use client'

import { useEffect, useState } from 'react'
import { getOrCreateUser, regenerateNickname } from '@/lib/user'
import GemIcon from '@/components/icons/GemIcon'
import type { UserStats } from '@/types/rps'
import { formatPoints } from '@/lib/format'

export default function ProfilePage() {
  const [nickname, setNickname] = useState<string>('')
  const [points, setPoints] = useState<number | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [rank, setRank] = useState<{ rank: number; total: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null)
  const [codeRevealed, setCodeRevealed] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  useEffect(() => {
    const user = getOrCreateUser()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNickname(user.nickname)
    setMounted(true)
    
    const userId = user.userId
    if (!userId) return

    // 2. Fetch Stats & Points
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/predictions/recovery/${userId}`
    )
      .then((res) => res.json())
      .then((data) => setRecoveryCode(data.recoveryCode))
      .catch((err) => console.error('Failed to load recovery code:', err))

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/predictions/${userId}/points`)
      .then((res) => res.json())
      .then((data) => setPoints(data.points))
      .catch((err) => console.error('Failed to load points:', err))

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/predictions/${userId}/stats`)
      .then((res) => res.json())
      .then(setStats)
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setStatsLoading(false))

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/predictions/leaderboard`)
      .then((res) => res.json())
      .then((data: { user_id: string; points: number }[]) => {
        const index = data.findIndex((e) => e.user_id === userId)
        if (index !== -1) setRank({ rank: index + 1, total: data.length })
      })
      .catch((err) => console.error('Failed to load rank:', err))
  }, [])

  const handleRegenerate = () => {
    const newNickname = regenerateNickname()
    setNickname(newNickname)
  }

  // Prevent "Hydration Mismatch" by showing a simple loader until mounted
  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse">
        <p className="text-gray-400">Loading your profile...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Profile</h1>
      <p className="text-gray-500 mb-6">Your prediction stats</p>

      {/* Nickname + points */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 mb-6">
        <p className="text-xs text-gray-500 mb-1">Your nickname</p>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-2xl font-bold text-gray-900">{nickname}</p>
          {/* Recovery code */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 mb-6">
            <p className="text-xs text-gray-500 mb-1">Recovery code</p>
            <p className="text-xs text-gray-400 mb-3">
              Use this code to access your profile on another device.
            </p>
            <div className="flex items-center gap-3">
              <span
                className={`font-mono text-sm font-bold text-gray-800 tracking-wide ${!codeRevealed ? 'blur-sm select-none' : ''}`}
              >
                {recoveryCode ?? '...'}
              </span>
              {!codeRevealed ? (
                <button
                  onClick={() => setCodeRevealed(true)}
                  className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition cursor-pointer"
                >
                  Reveal
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (recoveryCode) {
                      navigator.clipboard.writeText(recoveryCode)
                      setCodeCopied(true)
                      setTimeout(() => setCodeCopied(false), 2000)
                    }
                  }}
                  className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition cursor-pointer"
                >
                  {codeCopied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
          </div>
          <button
            onClick={handleRegenerate}
            className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer font-bold"
          >
            Randomize
          </button>
        </div>
        <div className="flex items-center gap-2">
          <GemIcon size={24} />
          <span className="text-lg font-bold text-purple-600">
            {points !== null ? formatPoints(points) : '...'}
          </span>
          <span className="text-sm text-gray-500">points</span>
          {rank && (
            <span className="text-sm text-gray-400 ml-1">
              · Rank {rank.rank}/{rank.total}
            </span>
          )}
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
            <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">
              Predictions
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">
              Wins
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">
              Losses
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">
              {stats.winRate}%
            </p>
            <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">
              Win Rate
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
