'use client'

import { useEffect, useState } from 'react'
import { getOrCreateUser, regenerateNickname } from '@/lib/user'
import GemIcon from '@/components/icons/GemIcon'
import type { UserStats } from '@/types/rps'
import { formatPoints, getAmountColor, getFullNumberName } from '@/lib/format'

const API = process.env.NEXT_PUBLIC_API_URL

interface Ranks {
  daily: number | null
  weekly: number | null
  allTime: number | null
}

export default function ProfilePage() {
  const [nickname, setNickname] = useState<string>('')
  const [points, setPoints] = useState<string | null>(null)
  const [showPointsExplainer, setShowPointsExplainer] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [ranks, setRanks] = useState<Ranks>({
    daily: null,
    weekly: null,
    allTime: null
  })
  const [mounted, setMounted] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null)
  const [codeRevealed, setCodeRevealed] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [recoverInput, setRecoverInput] = useState('')
  const [recoverError, setRecoverError] = useState('')
  const [recoverLoading, setRecoverLoading] = useState(false)
  const [recoverConfirm, setRecoverConfirm] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)

  useEffect(() => {
    const user = getOrCreateUser()
    setNickname(user.nickname)
    // Gate rendering on mount to avoid SSR/localStorage mismatch
    setMounted(true)
    const userId = user.userId
    if (!userId) return

    fetch(`${API}/api/predictions/recovery/${userId}`)
      .then((res) => res.json())
      .then((data) => setRecoveryCode(data.recoveryCode))
      .catch((err) => console.error('Failed to load recovery code:', err))

    fetch(`${API}/api/predictions/${userId}/points`)
      .then((res) => res.json())
      .then((data) => setPoints(data.points.toString()))
      .catch((err) => console.error('Failed to load points:', err))

    fetch(`${API}/api/predictions/${userId}/stats`)
      .then((res) => res.json())
      .then(setStats)
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setStatsLoading(false))

    // Rank is derived client-side from the leaderboard array position
    const fetchRank = async (tab: string) => {
      try {
        const res = await fetch(
          `${API}/api/predictions/leaderboard/unified?tab=${tab}`
        )
        const data = await res.json()
        const index = data.findIndex(
          (e: { user_id: string }) => e.user_id === userId
        )
        return index !== -1 ? index + 1 : null
      } catch (err) {
        console.error(`Failed to load ${tab} rank:`, err)
        return null
      }
    }

    Promise.all([
      fetchRank('daily'),
      fetchRank('weekly'),
      fetchRank('alltime')
    ]).then(([d, w, a]) => {
      setRanks({ daily: d, weekly: w, allTime: a })
    })
  }, [])

  const handleRegenerate = async () => {
    let isAvailable = false
    let newNickname = ''
    let attempts = 0
    const maxAttempts = 10

    while (!isAvailable && attempts < maxAttempts) {
      newNickname = regenerateNickname()
      attempts++
      try {
        const res = await fetch(
          `${API}/api/predictions/check-name/${newNickname}`
        )
        const data = await res.json()
        if (data.available) isAvailable = true
      } catch (err) {
        console.error('Name check failed:', err)
        break
      }
    }
    setNickname(newNickname)
    localStorage.setItem('rps_nickname', newNickname)
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
      // Swap localStorage identity then hard-reload so all state reinitializes cleanly
      localStorage.setItem('rps_user_id', data.userId)
      if (data.nickname) localStorage.setItem('rps_nickname', data.nickname)
      window.location.reload()
    } catch {
      setRecoverError('Failed to recover profile')
    } finally {
      setRecoverLoading(false)
    }
  }

  const handleResetProfile = () => {
    localStorage.removeItem('rps_user_id')
    localStorage.removeItem('rps_nickname')
    localStorage.removeItem('autoAllIn')
    window.location.reload()
  }

  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse">
        <p className="text-gray-400">Loading your profile...</p>
      </div>
    )
  }

  const numberName = points ? getFullNumberName(points) : ''
  const shouldShowTooltip =
    showPointsExplainer && numberName && numberName !== 'Points'

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-20">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Profile</h1>
      <p className="text-gray-500 mb-6">Your identity</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex flex-col mb-8">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-[10px] text-black uppercase font-black tracking-widest">
              Current Identity
            </p>
            <button
              onClick={handleRegenerate}
              className="text-[8px] px-2 py-1 bg-gray-900 text-white rounded-md hover:bg-black active:scale-95 transition cursor-pointer font-black uppercase tracking-wider shadow-sm"
            >
              Randomize
            </button>
          </div>
          <p className="text-[clamp(1.25rem,5vw,1.75rem)] font-black text-gray-900 leading-tight">
            {nickname}
          </p>
        </div>

        <div className="relative flex flex-col gap-4 mb-10 w-full">
          <div
            className="flex items-center gap-4 cursor-pointer select-none group"
            onMouseEnter={() => setShowPointsExplainer(true)}
            onMouseLeave={() => setShowPointsExplainer(false)}
            onClick={() => setShowPointsExplainer(!showPointsExplainer)}
          >
            <div className="shrink-0">
              <GemIcon size={32} />
            </div>
            <span
              className={`text-3xl font-black leading-none ${points !== null ? getAmountColor(points) : 'text-purple-600'}`}
            >
              {points !== null ? formatPoints(points) : '...'}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase text-black/30 tracking-widest">
              Ranks
            </p>
            <div className="flex items-center gap-4 text-[11px] font-black uppercase text-black">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-black/40">Daily</span>
                <span className="text-black">
                  {ranks.daily ? `#${ranks.daily}` : '-'}
                </span>
              </div>
              <div className="w-px h-2 bg-black/10" />
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-black/40">Weekly</span>
                <span className="text-black">
                  {ranks.weekly ? `#${ranks.weekly}` : '-'}
                </span>
              </div>
              <div className="w-px h-2 bg-black/10" />
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-black/40">All-Time</span>
                <span className="text-black">
                  {ranks.allTime ? `#${ranks.allTime}` : '-'}
                </span>
              </div>
            </div>
          </div>

          {shouldShowTooltip && (
            <div className="absolute -top-12 left-12 z-50 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <span
                className={`text-[10px] font-black uppercase tracking-[0.2em] ${getAmountColor(points ?? '0')}`}
              >
                {numberName}
              </span>
              <div className="absolute -bottom-1 left-6 w-2 h-2 bg-white border-b border-r border-gray-100 rotate-45" />
            </div>
          )}
        </div>

        <div className="border-t border-gray-50 pt-6">
          <p className="text-[10px] uppercase font-black tracking-widest text-black mb-1">
            Recovery code
          </p>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Essential for switching devices. This code is your permanent key.
          </p>
          <div className="flex items-center gap-3">
            <div
              className={`bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 font-mono text-sm font-bold text-gray-800 tracking-wider flex-1 md:flex-none ${!codeRevealed ? 'blur-md select-none' : ''}`}
            >
              {recoveryCode ?? 'generating-code-0000'}
            </div>
            {!codeRevealed ? (
              <button
                onClick={() => setCodeRevealed(true)}
                disabled={!recoveryCode}
                className="text-xs px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
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
                className="text-xs px-4 py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-100 transition cursor-pointer min-w-20"
              >
                {codeCopied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <p className="text-[10px] uppercase font-black tracking-widest text-black mb-1">
          Switch Profile
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Load an existing profile from another device.
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
            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm text-gray-800 font-mono focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button
            onClick={() => recoverInput.trim() && setRecoverConfirm(true)}
            disabled={!recoverInput.trim() || recoverLoading}
            className="px-6 py-3.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-100"
          >
            {recoverLoading ? 'Loading...' : 'Recover'}
          </button>
        </div>

        {recoverConfirm && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl animate-in fade-in slide-in-from-top-2">
            <p className="text-xs font-black text-yellow-800 mb-1 uppercase tracking-wider">
              🚨 Warning
            </p>
            <p className="text-xs text-yellow-700 mb-4 leading-relaxed">
              This will end your current session. You can return using your own
              recovery code.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRecoverConfirm}
                className="text-xs px-4 py-2.5 bg-yellow-500 text-white rounded-lg font-black uppercase hover:bg-yellow-600 transition"
              >
                Yes, Switch
              </button>
              <button
                onClick={() => setRecoverConfirm(false)}
                className="text-xs px-4 py-2.5 bg-white border border-yellow-200 text-yellow-700 rounded-lg font-black uppercase hover:bg-yellow-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {recoverError && (
          <p className="text-xs font-bold text-red-500 mt-3 ml-1">
            ✕ {recoverError}
          </p>
        )}
      </div>

      <h2 className="text-[10px] font-black text-black uppercase tracking-[0.3em] mb-4 px-1">
        Personal Records
      </h2>
      {statsLoading ? (
        <div className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
      ) : !stats || stats.total === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">
            No betting history found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          <StatBox label="Predictions" value={stats.total} />
          <StatBox label="Wins" value={stats.wins} color="text-green-600" />
          <StatBox label="Losses" value={stats.losses} color="text-red-500" />
          <StatBox
            label="Win Rate"
            value={`${stats.winRate}%`}
            color="text-indigo-600"
          />
        </div>
      )}

      <div className="pt-8 border-t border-red-50">
        <h2 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-4 px-1">
          Danger Zone
        </h2>
        {!resetConfirm ? (
          <button
            onClick={() => setResetConfirm(true)}
            className="w-full sm:w-auto px-6 py-3 border-2 border-red-50 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:border-red-100 transition active:scale-95"
          >
            Start Fresh (New Identity)
          </button>
        ) : (
          <div className="p-5 bg-red-50 border border-red-100 rounded-2xl">
            <p className="text-xs font-black text-red-800 mb-2 uppercase">
              Confirm Identity Reset
            </p>
            <p className="text-xs text-red-700 mb-5 leading-relaxed">
              This generates a brand-new profile with 100,000 points. Your
              current progress will be unreachable without your code:{' '}
              <span className="font-mono font-black">{recoveryCode}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleResetProfile}
                className="px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase hover:bg-red-700 transition shadow-lg shadow-red-200"
              >
                Yes, Create New Identity
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-6 py-3 bg-white text-red-400 rounded-xl text-xs font-black uppercase hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  color = 'text-gray-900'
}: {
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
      <p className={`text-2xl font-black ${color} leading-none`}>{value}</p>
      <p className="text-[10px] text-black mt-2 uppercase font-black tracking-tighter">
        {label}
      </p>
    </div>
  )
}
