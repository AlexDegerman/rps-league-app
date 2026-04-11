'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getOrCreateUser, regenerateNickname } from '@/lib/user'
import GemIcon from '@/components/icons/GemIcon'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { UserStats } from '@/types/rps'
import { formatPoints, getAmountColor, getFullNumberName } from '@/lib/format'
import {
  fetchUserProfile,
  fetchUserStats,
  fetchRank,
  fetchRecoveryCode,
  updateNickname,
  handleRecoverProfile,
  fetchUserBetHistory,
  updateLinkedin
} from '@/lib/api'
import BetHistory from '@/components/BetHistory'
import { LinkedInBadge } from '@/components/LinkedInBadge'

interface Ranks {
  daily: number | null
  weekly: number | null
  allTime: number | null
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const targetShortId = params.shortId as string

  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [nickname, setNickname] = useState('')
  const [points, setPoints] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [useK, setUseK] = useState(false)

  const [stats, setStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [ranks, setRanks] = useState<Ranks>({
    daily: null,
    weekly: null,
    allTime: null
  })

  const [showPointsExplainer, setShowPointsExplainer] = useState(false)

  const [recoveryCode, setRecoveryCode] = useState<string | null>(null)
  const [codeRevealed, setCodeRevealed] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const [recoverInput, setRecoverInput] = useState('')
  const [recoverError, setRecoverError] = useState('')
  const [recoverLoading, setRecoverLoading] = useState(false)
  const [recoverConfirm, setRecoverConfirm] = useState(false)

  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetError, setResetError] = useState('')

  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null)
  const [showLinkedinBadge, setShowLinkedinBadge] = useState(true)
  const [linkedinInput, setLinkedinInput] = useState('')
  const [linkedinSaved, setLinkedinSaved] = useState(false)
  const [linkedinError, setLinkedinError] = useState('')

  useEffect(() => {
    if (!targetShortId) return

    const user = getOrCreateUser()
    const own = user.shortId === targetShortId
    setIsOwnProfile(own)
    setMounted(true)

    const checkWidth = () => setUseK(window.innerWidth <= 362)
    checkWidth()
    window.addEventListener('resize', checkWidth)

    const loadProfile = async () => {
      try {
        const profileData = await fetchUserProfile(targetShortId)

        if (profileData) {
          setNickname(profileData.nickname)
          setPoints(profileData.points)
          setProfileUserId(profileData.userId)
          const statsData = await fetchUserStats(
            profileData.userId,
            targetShortId
          )
          if (statsData) setStats(statsData)
            setLinkedinUrl(profileData.linkedinUrl)
            setShowLinkedinBadge(profileData.showLinkedinBadge ?? true)
            setLinkedinInput(profileData.linkedinUrl ?? '')
        }
      } catch (err) {
        console.error('Profile load error:', err)

        if (own) {
          setPoints('200000')
          const local = getOrCreateUser()
          setNickname(local.nickname || 'New Player')
          setProfileUserId(local.userId)
        }
      } finally {
        setStatsLoading(false)
      }
    }

    loadProfile()

    Promise.all([
      fetchRank('daily', targetShortId),
      fetchRank('weekly', targetShortId),
      fetchRank('alltime', targetShortId)
    ]).then(([d, w, a]) => setRanks({ daily: d, weekly: w, allTime: a }))

    let recoveryTimer: NodeJS.Timeout
    if (own) {
      const getRecovery = async () => {
        try {
          const res = await fetchRecoveryCode(user.userId)
          if (res.ok) {
            const data = await res.json()
            setRecoveryCode(data.recoveryCode)
          } else if (res.status === 404) {
            recoveryTimer = setTimeout(getRecovery, 1500)
          }
        } catch {
          recoveryTimer = setTimeout(getRecovery, 3000)
        }
      }
      recoveryTimer = setTimeout(getRecovery, 800)
    }

    return () => {
      if (recoveryTimer) clearTimeout(recoveryTimer)
      window.removeEventListener('resize', checkWidth)
    }
  }, [targetShortId])

  const fetchFn = useCallback(
    async (page: number) => {
      if (!profileUserId) return { matches: [], total: 0, hasMore: false }
      const data = await fetchUserBetHistory(profileUserId, page)

      return {
        matches: data.matches,
        total: data.total,
        hasMore: data.hasMore
      }
    },
    [profileUserId]
  )

  const {
    matches,
    isLoading: historyLoading,
    loadMatches
  } = useInfiniteScroll({ fetchFn, enabled: !!profileUserId })
  
  useEffect(() => {
    if (profileUserId) {
      loadMatches(1)
    }
  }, [profileUserId, loadMatches])

  const handleRegenerate = async () => {
    if (!isOwnProfile) return

    let newNickname = ''
    let attempts = 0
    while (attempts < 10) {
      newNickname = regenerateNickname()
      attempts++
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/check-name/${newNickname}`
        )
        const data = await res.json()
        if (data.available) break
      } catch {
        break
      }
    }

    setNickname(newNickname)
    localStorage.setItem('rps_nickname', newNickname)

    try {
      await updateNickname(targetShortId, newNickname)
    } catch (err) {
      console.error('Failed to sync nickname:', err)
    }
  }

  const onRecoverConfirm = async () => {
    setRecoverLoading(true)
    setRecoverError('')
    setRecoverConfirm(false)

    try {
      const data = await handleRecoverProfile(recoverInput.trim())
      if (!data) {
        setRecoverError('Invalid recovery code')
        return
      }
      localStorage.setItem('rps_user_id', data.userId)
      localStorage.setItem('rps_short_id', data.shortId)
      if (data.nickname) localStorage.setItem('rps_nickname', data.nickname)
      router.push(`/profile/${data.shortId}`)
    } catch {
      setRecoverError('Failed to recover profile')
    } finally {
      setRecoverLoading(false)
    }
  }

  const handleResetProfile = async () => {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    let timestamps: number[] = []
    try {
      const stored = localStorage.getItem('rps_restart_timestamps')
      if (stored) timestamps = JSON.parse(stored)
    } catch {
      timestamps = []
    }

    timestamps = timestamps.filter((t) => now - t < oneHour)
    if (timestamps.length >= 3) {
      const waitMin = Math.ceil((oneHour - (now - timestamps[0])) / 60000)
      setResetError(`Rate limit reached. Wait ${waitMin}m.`)
      return
    }

    timestamps.push(now)
    localStorage.setItem('rps_restart_timestamps', JSON.stringify(timestamps))

    localStorage.removeItem('rps_user_id')
    localStorage.removeItem('rps_short_id')
    localStorage.removeItem('rps_nickname')
    localStorage.removeItem('autoAllIn')

    const newUser = getOrCreateUser()

    try {
      await updateNickname(newUser.shortId, newUser.nickname)
    } catch {
      console.error('Silent sync failed, will retry on first bet')
    }

    setTimeout(() => {
      window.location.href = `/profile/${newUser.shortId}`
    }, 50)
  }

  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    )
  }

  const numberName = points ? getFullNumberName(points) : ''
  const shouldShowTooltip =
    showPointsExplainer && numberName && numberName !== 'Points'

  return (
    <div className="max-w-2xl mx-auto px-4 pt-0 pb-10">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-10 mb-4 mt-0 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-6 mb-4 sm:mb-10 relative">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1 sm:mb-2 relative w-full">
              <p className="text-[9px] sm:text-[10px] text-black/40 uppercase font-black tracking-[0.15em]">
                {isOwnProfile ? 'Current Identity' : 'Player Identity'}
              </p>

              {isOwnProfile && (
                <button
                  onClick={handleRegenerate}
                  className="text-[8px] sm:text-[9px] px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-black active:scale-95 transition-all cursor-pointer font-black uppercase tracking-wider shadow-sm"
                >
                  Randomize
                </button>
              )}

              {stats?.joinedDate && (
                <span className="absolute left-50 sm:right-auto sm:left-full top-0 sm:ml-4 text-[9px] sm:text-[11px] text-indigo-400/80 font-black uppercase tracking-widest flex flex-col items-end sm:items-start whitespace-nowrap">
                  <span>joined at:</span>
                  <span>
                    {new Date(Number(stats.joinedDate)).getDate()}.
                    {new Date(Number(stats.joinedDate)).getMonth() + 1}.
                    {new Date(Number(stats.joinedDate)).getFullYear()}
                  </span>
                </span>
              )}
            </div>
            <p className="text-[1.5rem] sm:text-[clamp(1.25rem,5vw,1.75rem)] font-black text-gray-900 leading-tight tracking-tight">
              {nickname}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 relative">
            {shouldShowTooltip && (
              <div className="absolute -top-12 sm:right-0 z-50 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 whitespace-nowrap">
                <span
                  className={`text-[10px] font-black uppercase tracking-[0.2em] ${getAmountColor(points ?? '0')}`}
                >
                  {numberName}
                </span>
                <div className="absolute -bottom-1 sm:right-6 left-6 sm:left-auto w-2 h-2 bg-white border-b border-r border-gray-100 rotate-45" />
              </div>
            )}

            <div
              className="flex items-center gap-3 cursor-pointer select-none group"
              onClick={() => setShowPointsExplainer(!showPointsExplainer)}
            >
              <div className="shrink-0 transition-transform">
                <GemIcon size={32} />
              </div>
              <span
                className={`text-3xl sm:text-4xl font-black leading-none tracking-tighter ${points !== null ? getAmountColor(points) : 'text-purple-600'}`}
              >
                {points !== null ? formatPoints(points) : '...'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-black uppercase text-black">
              {(['daily', 'weekly', 'allTime'] as const).map((key, i) => (
                <div key={key} className="flex items-center gap-1.5">
                  {i > 0 && <div className="w-px h-2.5 bg-black/10" />}
                  <span className="text-black/30">
                    {key === 'allTime'
                      ? 'All-Time'
                      : key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded-md">
                    {ranks[key] ? `#${ranks[key]}` : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {statsLoading ? (
          <div className="h-64 bg-gray-50 rounded-3xl animate-pulse" />
        ) : (
          <div className="flex flex-col gap-5 sm:gap-8">
            <StatSection label="Records">
              <StatBox
                label="Peak"
                value={stats ? formatPoints(stats.peakPoints, useK) : '0'}
                color="text-amber-500"
              />
              <StatBox
                label="Weekly"
                value={stats ? formatPoints(stats.weeklyPeak, useK) : '0'}
                color="text-indigo-600"
              />
              <StatBox
                label="Daily"
                value={stats ? formatPoints(stats.dailyPeak, useK) : '0'}
                color="text-indigo-400"
              />
            </StatSection>

            <StatSection label="Wealth">
              <StatBox
                label="Gained"
                value={stats ? formatPoints(stats.totalGain, useK) : '0'}
                color="text-emerald-600"
              />
              <StatBox
                label="Risked"
                value={stats ? formatPoints(stats.totalVolume, useK) : '0'}
                color="text-gray-600"
              />
              <StatBox
                label="Best Win"
                value={stats ? formatPoints(stats.biggestWin, useK) : '0'}
                color="text-emerald-500"
              />
            </StatSection>

            <StatSection label="Performance">
              <StatBox
                label="Max Streak"
                value={stats?.maxWinStreak || 0}
                color="text-orange-500"
              />
              <StatBox
                label="Win Rate"
                value={stats?.total ? `${stats.winRate}%` : '-'}
                color="text-indigo-600"
              />
              <StatBox
                label="Pities Hit"
                value={stats?.totalPitiesEarned || 0}
                color="text-red-400"
              />
              <StatBox label="Total Plays" value={stats?.total || 0} />
              <StatBox
                label="Wins"
                value={stats?.wins || 0}
                color="text-green-600"
              />
              <StatBox
                label="Losses"
                value={stats?.losses || 0}
                color="text-red-500"
              />
            </StatSection>
          </div>
        )}

        {/* LinkedIn section */}
        <div className="border-t border-gray-50 mt-8 pt-6">
          <div className="flex items-center gap-2 mb-3 ml-1">
            <p className="text-[10px] uppercase font-black tracking-widest text-black/40">
              LinkedIn
            </p>
            {!isOwnProfile && linkedinUrl && (
              <span className="text-[8px] text-amber-500 font-bold uppercase tracking-wide">
                ⚠ Unverified
              </span>
            )}
          </div>

          {isOwnProfile ? (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkedinInput}
                  onChange={(e) => {
                    setLinkedinInput(e.target.value)
                    setLinkedinSaved(false)
                    setLinkedinError('')
                  }}
                  placeholder="https://linkedin.com/in/yourname"
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 text-[11px] font-mono focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
                />
                <button
                  onClick={async () => {
                    let url = linkedinInput.trim()
                    if (
                      url &&
                      !url.startsWith('http://') &&
                      !url.startsWith('https://')
                    ) {
                      url = `https://${url}`
                      setLinkedinInput(url)
                    }
                    if (url && !url.includes('linkedin.com')) {
                      setLinkedinError('Must be a linkedin.com URL')
                      return
                    }
                    try {
                      await updateLinkedin(
                        targetShortId,
                        url || null,
                        showLinkedinBadge
                      )
                      setLinkedinUrl(url || null)
                      setLinkedinSaved(true)
                      setTimeout(() => setLinkedinSaved(false), 2000)
                    } catch {
                      setLinkedinError('Failed to save')
                    }
                  }}
                  className="text-[10px] px-4 py-2.5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm whitespace-nowrap"
                >
                  {linkedinSaved ? 'Saved!' : 'Save'}
                </button>
              </div>

              {linkedinError && (
                <p className="text-red-500 text-[10px] ml-1 uppercase font-black">
                  {linkedinError}
                </p>
              )}

              <label className="flex items-center gap-3 ml-1 cursor-pointer select-none">
                <div
                  onClick={() => {
                    const next = !showLinkedinBadge
                    setShowLinkedinBadge(next)
                    updateLinkedin(
                      targetShortId,
                      linkedinInput.trim() || null,
                      next
                    )
                  }}
                  className={`relative w-8 h-4 rounded-full transition-colors ${showLinkedinBadge ? 'bg-[#0A66C2]' : 'bg-gray-200'}`}
                >
                  <div
                    className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${showLinkedinBadge ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-black/40">
                  Show LinkedIn badge publicly
                </span>
              </label>

              {linkedinUrl && showLinkedinBadge && (
                <div className="ml-1">
                  <LinkedInBadge url={linkedinUrl} size="md" />
                </div>
              )}
            </div>
          ) : linkedinUrl ? (
            <div className="flex items-center gap-2 ml-1">
              <LinkedInBadge url={linkedinUrl} size="md" />
            </div>
          ) : (
            <p className="text-[10px] text-gray-300 ml-1 font-bold">
              No LinkedIn linked
            </p>
          )}
        </div>

        {isOwnProfile && (
          <div className="border-t border-gray-50 mt-8 pt-6">
            <p className="text-[10px] uppercase font-black tracking-widest text-black/40 mb-2 ml-1">
              Recovery Access
            </p>
            <div className="flex items-center gap-2">
              <div
                className={`bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 font-mono text-[11px] font-bold text-gray-800 tracking-wider flex-1 transition-all ${!codeRevealed ? 'blur-md select-none' : 'bg-white shadow-inner'}`}
              >
                {recoveryCode ?? 'generating-code-0000'}
              </div>
              {!codeRevealed ? (
                <button
                  onClick={() => setCodeRevealed(true)}
                  disabled={!recoveryCode}
                  className="text-[10px] px-5 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                >
                  Reveal
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!recoveryCode) return
                    navigator.clipboard.writeText(recoveryCode)
                    setCodeCopied(true)
                    setTimeout(() => setCodeCopied(false), 2000)
                  }}
                  className="text-[10px] px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md min-w-25"
                >
                  {codeCopied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isOwnProfile && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <p className="text-[10px] uppercase font-black tracking-widest text-black/40 mb-4 ml-1">
              Switch Profile
            </p>
            {recoverError && (
              <p className="text-red-500 text-[10px] mb-2 ml-1 uppercase font-black">
                {recoverError}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={recoverInput}
                onChange={(e) => {
                  setRecoverInput(e.target.value)
                  setRecoverConfirm(false)
                  setRecoverError('')
                }}
                placeholder="word-word-1234"
                className="w-full bg-gray-50 border-gray-100 rounded-2xl px-4 py-3.5 text-[12px] font-mono focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
              />
              <button
                onClick={() => {
                  if (recoverConfirm) onRecoverConfirm()
                  else if (recoverInput.trim()) setRecoverConfirm(true)
                }}
                disabled={!recoverInput.trim() || recoverLoading}
                className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${recoverConfirm ? 'bg-amber-500 text-white animate-pulse' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
              >
                {recoverLoading
                  ? '...'
                  : recoverConfirm
                    ? 'Click to Confirm Load'
                    : 'Load Identity'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-red-50 shadow-sm p-6">
            <h2 className="text-[10px] font-black text-red-400/60 uppercase tracking-widest mb-4 ml-1">
              Danger Zone
            </h2>
            {resetError && (
              <p className="text-red-500 text-[10px] mb-2 ml-1 uppercase font-black">
                {resetError}
              </p>
            )}
            <button
              onClick={() => {
                if (resetConfirm) handleResetProfile()
                else setResetConfirm(true)
              }}
              className={`w-full py-3.5 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${resetConfirm ? 'bg-red-600 text-white border-red-600 animate-pulse' : 'border-red-100 text-red-400 hover:bg-red-50'}`}
            >
              {resetConfirm ? 'Confirm Full Reset' : 'Reset All'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">
          Bet History
        </h2>
        {historyLoading && matches.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-xs uppercase font-black tracking-widest">
            Loading history...
          </p>
        ) : (
          <BetHistory userId={profileUserId} />
        )}
      </div>
    </div>
  )
}

function StatSection({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/30 mb-3 ml-1">
        {label}
      </h3>
      <div className="grid grid-cols-3 gap-2">{children}</div>
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
    <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-1 sm:p-2 py-2 sm:py-6 flex flex-col items-center justify-center text-center transition-all overflow-hidden">
      <p
        className={`${value.toString().length >= 8 ? 'text-[13px] tracking-tighter [@media(min-width:375px)]:text-lg [@media(min-width:375px)]:tracking-tight' : 'text-[15px] tracking-tight [@media(min-width:375px)]:text-lg'} font-black ${color} leading-tight whitespace-nowrap w-full px-0.5`}
      >
        {value}
      </p>
      <p className="text-[8px] sm:text-[10px] text-black/40 mt-0.5 sm:mt-2 uppercase font-black tracking-widest">
        {label}
      </p>
    </div>
  )
}
