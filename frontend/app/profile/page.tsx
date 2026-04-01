'use client'

import { useEffect, useState } from 'react'
import { getOrCreateUser, regenerateNickname } from '@/lib/user'
import GemIcon from '@/components/icons/GemIcon'
import type { UserStats } from '@/types/rps'
import { formatPoints } from '@/lib/format'

const API = process.env.NEXT_PUBLIC_API_URL

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
  const [recoverInput, setRecoverInput] = useState('')
  const [recoverError, setRecoverError] = useState('')
  const [recoverLoading, setRecoverLoading] = useState(false)
  const [recoverConfirm, setRecoverConfirm] = useState(false)

  useEffect(() => {
    const user = getOrCreateUser()
    setNickname(user.nickname)
    setMounted(true)
    const userId = user.userId
    if (!userId) return

    fetch(`${API}/api/predictions/recovery/${userId}`)
      .then((res) => res.json())
      .then((data) => setRecoveryCode(data.recoveryCode))
      .catch((err) => console.error('Failed to load recovery code:', err))

    fetch(`${API}/api/predictions/${userId}/points`)
      .then((res) => res.json())
      .then((data) => setPoints(data.points))
      .catch((err) => console.error('Failed to load points:', err))

    fetch(`${API}/api/predictions/${userId}/stats`)
      .then((res) => res.json())
      .then(setStats)
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setStatsLoading(false))

    fetch(`${API}/api/predictions/leaderboard`)
      .then((res) => res.json())
      .then((data: { user_id: string }[]) => {
        const index = data.findIndex((e) => e.user_id === userId)
        if (index !== -1) setRank({ rank: index + 1, total: data.length })
      })
      .catch((err) => console.error('Failed to load rank:', err))
  }, [])

  const handleRegenerate = () => {
    const newNickname = regenerateNickname()
    setNickname(newNickname)
  }

  const handleRecoverRequest = () => {
    if (!recoverInput.trim()) return
    setRecoverConfirm(true)
  }

  const handleRecoverConfirm = async () => {
    setRecoverLoading(true)
    setRecoverError('')
    setRecoverConfirm(false)
    try {
      const res = await fetch(`${API}/api/predictions/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryCode: recoverInput.trim() })
      })
      const data = await res.json()
      if (!res.ok) {
        setRecoverError(data.error ?? 'Invalid recovery code')
        return
      }
      localStorage.setItem('rps_user_id', data.userId)
      if (data.nickname) localStorage.setItem('rps_nickname', data.nickname)
      window.location.reload()
    } catch {
      setRecoverError('Failed to recover profile')
    } finally {
      setRecoverLoading(false)
    }
  }

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

      {/* Identity card */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">
              Nickname
            </p>
            <p className="text-2xl font-bold text-gray-900 wrap-break-word">
              {nickname}
            </p>
          </div>
          <button
            onClick={handleRegenerate}
            className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition cursor-pointer font-bold shrink-0 mt-5"
          >
            Randomize
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <GemIcon size={22} />
          <span className="text-lg font-bold text-purple-600">
            {points !== null ? formatPoints(points) : '...'}
          </span>
          <span className="text-sm text-gray-500">points</span>
          {rank && (
            <span className="text-sm text-gray-400">
              · Rank {rank.rank}/{rank.total}
            </span>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs uppercase font-bold tracking-wider text-gray-500 mb-1">
            Recovery code
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Save this code to restore your profile on another device.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`font-mono text-sm font-bold text-gray-800 tracking-wide ${!codeRevealed ? 'blur-sm select-none' : ''}`}
            >
              {recoveryCode ?? '...'}
            </span>
            {!codeRevealed ? (
              <button
                onClick={() => setCodeRevealed(true)}
                disabled={!recoveryCode}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition cursor-pointer disabled:opacity-50"
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
      </div>

      {/* Recovery login */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 mb-6">
        <p className="text-xs uppercase font-bold tracking-wider text-gray-500 mb-1">
          Switch profile
        </p>
        <p className="text-xs text-gray-400 mb-3">
          Enter a recovery code to load a different profile. Your current
          profile will remain in the database.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={recoverInput}
            onChange={(e) => {
              setRecoverInput(e.target.value)
              setRecoverConfirm(false)
              setRecoverError('')
            }}
            placeholder="word-word-1234"
            className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={handleRecoverRequest}
            disabled={!recoverInput.trim() || recoverLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {recoverLoading ? 'Loading...' : 'Recover'}
          </button>
        </div>

        {/* Confirmation warning */}
        {recoverConfirm && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-bold text-yellow-800 mb-1">
              ⚠️ Switch profile?
            </p>
            <p className="text-xs text-yellow-700 mb-3">
              This will replace your current session with the recovered profile.
              Your current profile stays in the database, you can switch back
              using its recovery code.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRecoverConfirm}
                className="text-xs px-3 py-1.5 bg-yellow-500 text-white rounded font-bold hover:bg-yellow-600 transition cursor-pointer"
              >
                Yes, switch
              </button>
              <button
                onClick={() => setRecoverConfirm(false)}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded font-bold hover:bg-gray-200 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {recoverError && (
          <p className="text-xs text-red-500 mt-2">{recoverError}</p>
        )}
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
