'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  fetchLatestMatches,
  fetchPendingMatches,
  fetchUserPoints,
  postPrediction,
  fetchUnifiedLeaderboard
} from '@/lib/api'
import MatchList from '@/components/MatchList'
import PendingMatchCard from '@/components/PendingMatchCard'
import GemIcon from '@/components/icons/GemIcon'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { getOrCreateUser, isUserValid } from '@/lib/user'
import type { BonusTier, Match, PendingMatch, PredictionRecord } from '@/types/rps'
import {
  formatPoints,
  getAmountColor,
  getBonusStyles,
  getFullNumberName,
  parseShorthand
} from '@/lib/format'
import { useSound } from '@/hooks/useSound'
import SoundIcon from '@/components/icons/SoundIcon'
import LiveStatsTicker from '@/components/LiveStatTicker'
import { useAnimatedBigInt } from '@/hooks/useAnimatedBigInt'
import { BONUS_TIER_STYLES } from '@/lib/constants'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

let _backendReady = false

interface BonusData {
  amount: bigint
  tier: string
}

export default function HomePage() {
  const [backendReady, setBackendReady] = useState(_backendReady)
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([])
  const [predictions, setPredictions] = useState<Map<string, PredictionRecord>>(
    new Map()
  )
  const [points, setPoints] = useState<bigint>(200000n)
  const [pointsLoaded, setPointsLoaded] = useState(false)
  const [betAmount, setBetAmount] = useState<bigint>(100000n)
  const [serverOffset, setServerOffset] = useState<number>(0)
  const [resultAnim, setResultAnim] = useState<{
    win: boolean
    amount: bigint
    bonus?: BonusData | null
    confetti?: { vx: number; vy: number; leftOffset: number; delay: number }[]
  } | null>(null)
  const [peakPoints, setPeakPoints] = useState<bigint>(200000n)
  const [autoAllIn, setAutoAllIn] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const { playWin, playLoss, soundOn, toggleSound } = useSound()
  const [showJumpButton, setShowJumpButton] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [inputString, setInputString] = useState('100000')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPointsInfo, setShowPointsInfo] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showPointsExplainer, setShowPointsExplainer] = useState(false)
  const [showBonusExplainer, setShowBonusExplainer] = useState(false)
  const [notification, setNotification] = useState<
    'new_visitor' | 'no_bigint' | null
  >(null)
  const [dailyRank, setDailyRank] = useState<number | null>(null)
  const [displayNickname, setDisplayNickname] = useState<string>('')

  const triggerErrorRef = useRef((msg: string) => {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(null), 1200)
  })
  const lastPacketRef = useRef(Date.now())
  const isOffline = typeof window !== 'undefined' && !navigator.onLine
  const isStreamStale = now - lastPacketRef.current > 10000
  const showConnectionWarning = backendReady && (isOffline || isStreamStale)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(timer)
  }, [])

  const pointsRef = useRef(points)
  const betAmountRef = useRef(betAmount)
  const peakPointsRef = useRef(peakPoints)
  const autoAllInRef = useRef(autoAllIn)
  const predictionsRef = useRef(predictions)
  const serverOffsetRef = useRef(serverOffset)

  useEffect(() => {
    serverOffsetRef.current = serverOffset
  }, [serverOffset])
  useEffect(() => {
    pointsRef.current = points
  }, [points])
  useEffect(() => {
    betAmountRef.current = betAmount
  }, [betAmount])
  useEffect(() => {
    peakPointsRef.current = peakPoints
  }, [peakPoints])
  useEffect(() => {
    autoAllInRef.current = autoAllIn
  }, [autoAllIn])
  useEffect(() => {
    predictionsRef.current = predictions
  }, [predictions])

  useEffect(() => {
    const saved = localStorage.getItem('autoAllIn')
    if (saved === 'false') setAutoAllIn(false)
    setIsHydrated(true)

    if (typeof BigInt === 'undefined') {
      setNotification('no_bigint')
      return
    }

    if (!localStorage.getItem('rps_welcomed')) {
      setNotification('new_visitor')
    }
  }, [])

  useEffect(() => {
    if (isHydrated) localStorage.setItem('autoAllIn', autoAllIn.toString())
  }, [autoAllIn, isHydrated])

  useEffect(() => {
    if (isHydrated && autoAllIn) {
      setBetAmount(points)
      if (!isFocused) setInputString(points.toString())
    }
  }, [autoAllIn, points, isHydrated, isFocused])

  useEffect(() => {
    if (isHydrated && !autoAllIn) {
      const floor = 100000n
      const resetTo = points < floor ? points : floor
      setBetAmount(resetTo)
      if (!isFocused) setInputString(resetTo.toString())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAllIn, isHydrated])

  useEffect(() => {
    const handleScroll = () => setShowJumpButton(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const markReady = () => {
    _backendReady = true
    setBackendReady(true)
  }

  const fetchFn = useCallback((page: number) => fetchLatestMatches(page), [])
  const { matches, setMatches, hasMore, isLoadingMore, loadMatches } =
    useInfiniteScroll({ fetchFn })

  const animatedPoints = useAnimatedBigInt(points, 1000)
  const animatedResult = useAnimatedBigInt(resultAnim?.amount ?? 0n, 600, true)


  useEffect(() => {
    const user = getOrCreateUser()
    if (!isUserValid(user)) return

    setDisplayNickname(user.nickname)

    fetchUserPoints(user.userId, user.shortId)
      .then((data) => {
        if (!data) return
        console.log(data)
        if (data.nickname) {
          setDisplayNickname(data.nickname)
        }

        const p = BigInt(data.points)
        setPoints(p)
        setPeakPoints(BigInt(data.peakPoints))
        const initialBet = autoAllInRef.current ? p : p < 100000n ? p : 100000n
        setBetAmount(initialBet)
        if (!isFocused) setInputString(initialBet.toString())
        setPointsLoaded(true)
      })
      .catch((err) => {
        console.error('Failed to fetch points:', err)
        setPointsLoaded(true)
      })

    fetchLatestMatches(1).then((data) => {
      if (data && data.matches.length > 0) markReady()
      loadMatches(1)
    })

    fetchPendingMatches()
      .then((data) => {
        if (!data) return
        setPendingMatches((prev) => {
          const existingIds = new Set(prev.map((p) => p.gameId))
          const freshMatches = data.filter((m) => !existingIds.has(m.gameId))
          if (freshMatches.length > 0) {
            markReady()
            return [...freshMatches, ...prev]
          }
          return prev
        })
      })
      .catch((err) => {
        console.error('Failed to fetch pending matches:', err)
        triggerErrorRef.current('LIVE FEED ERROR')
      })

    fetchUnifiedLeaderboard('daily')
      .then((data) => {
        const idx = data.findIndex((e) => e.shortId === user.shortId)
        setDailyRank(idx !== -1 ? idx + 1 : null)
      })
      .catch(() => {})

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMatches])

  const handlePick = async (gameId: string, playerName: string) => {
    const user = getOrCreateUser()
    if (!isUserValid(user) || !user.nickname || betAmount <= 0n) return

    if (notification === 'new_visitor') {
      localStorage.setItem('rps_welcomed', '1')
      setNotification(null)
    }

    setPredictions((prev) =>
      new Map(prev).set(gameId, { gameId, pick: playerName, confirmed: false })
    )

    let succeeded = false
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const { ok, data } = await postPrediction(
        {
          userId: user.userId,
          gameId,
          pick: playerName,
          betAmount: betAmountRef.current.toString(),
          nickname: user.nickname,
          shortId: user.shortId
        },
        controller.signal
      )

      clearTimeout(timeout)

      if (ok && data?.success === true) {
        succeeded = true
        setPredictions((prev) => {
          const next = new Map(prev)
          const current = next.get(gameId)
          if (current) next.set(gameId, { ...current, confirmed: true })
          return next
        })
      } else {
        triggerErrorRef.current(data?.error || 'MATCH ALREADY ENDED')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        triggerErrorRef.current('CONNECTION TOO SLOW')
      } else {
        triggerErrorRef.current('CONNECTION FAILED')
      }
    } finally {
      if (!succeeded) {
        setPredictions((prev) => {
          const next = new Map(prev)
          next.delete(gameId)
          return next
        })
      }
    }
  }

  const fetchUpdatedPoints = useCallback(async (): Promise<{
    newPoints: bigint
    isNewPeak: boolean
  }> => {
    const user = getOrCreateUser()
    if (!isUserValid(user))
      return { newPoints: pointsRef.current, isNewPeak: false }

    const data = await fetchUserPoints(user.userId, user.shortId)
    if (!data) return { newPoints: pointsRef.current, isNewPeak: false }

    const newPoints = BigInt(data.points)
    const newPeak = BigInt(data.peakPoints)
    const isNewPeak = newPeak > peakPointsRef.current

    setPointsLoaded(true)
    setPeakPoints(newPeak)
    setPoints(newPoints)

    if (autoAllInRef.current) {
      setBetAmount(newPoints)
      setInputString(newPoints.toString())
    } else if (betAmountRef.current > newPoints) {
      setBetAmount(newPoints)
      setInputString(newPoints.toString())
    }

    return { newPoints, isNewPeak }
  }, [])

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/live`)

    es.addEventListener('sync', (event) => {
      const { serverTime } = JSON.parse(event.data)
      const newOffset = serverTime - Date.now()
      setServerOffset(newOffset)
      serverOffsetRef.current = newOffset
    })

    es.addEventListener('pending', (event) => {
      const pending: PendingMatch = JSON.parse(event.data)
      lastPacketRef.current = Date.now()
      setPendingMatches((prev) => {
        if (prev.find((p) => p.gameId === pending.gameId)) return prev
        return [pending, ...prev]
      })
      const timeoutMs =
        pending.expiresAt - (Date.now() + serverOffsetRef.current) + 5000
      setTimeout(
        () => {
          setPendingMatches((prev) =>
            prev.filter((p) => p.gameId !== pending.gameId)
          )
        },
        Math.max(5000, timeoutMs)
      )
      markReady()
    })

    es.addEventListener('prediction_result', (event) => {
      const data = JSON.parse(event.data)
      const { userId } = getOrCreateUser()
      if (data.userId !== userId) return

      const isWin = data.result === 'WIN'

      if (isWin) {
        playWin()
        const bonus = data.bonus
          ? { ...data.bonus, amount: BigInt(data.bonus.amount) }
          : null
        const amount = BigInt(data.amount)
        fetchUpdatedPoints()
        setResultAnim({
          win: true,
          amount,
          bonus,
          confetti: Array.from({ length: 100 }).map(() => ({
            leftOffset: Math.random() * 100 - 50,
            vx: (Math.random() - 0.5) * 300,
            vy: -(Math.random() * 200 + 100),
            delay: Math.random() * 0.2
          }))
        })
      } else {
        playLoss()
        const bonus = data.bonus
          ? { ...data.bonus, amount: BigInt(data.bonus.amount) }
          : null
        const pointsBefore = pointsRef.current
        new Promise<{ newPoints: bigint; isNewPeak: boolean }>((resolve) => {
          setTimeout(() => resolve(fetchUpdatedPoints()), 100)
        }).then(({ newPoints }) => {
          const actualLoss =
            pointsBefore > newPoints ? pointsBefore - newPoints : 0n
          setResultAnim({ win: false, amount: actualLoss, bonus, confetti: [] })
        })
      }

      const displayTime = data.bonus?.tier === 'LEGENDARY' ? 3000 : 2000
      setTimeout(() => setResultAnim(null), displayTime)

      setPredictions((prev) => {
        const newMap = new Map(prev)
        const existing = prev.get(data.gameId)
        if (existing)
          newMap.set(data.gameId, {
            ...existing,
            result: isWin ? 'WIN' : 'LOSE'
          })
        return newMap
      })
    })

    es.addEventListener('result', (event) => {
      const match: Match = JSON.parse(event.data)
      lastPacketRef.current = Date.now()
      setPendingMatches((prev) => prev.filter((p) => p.gameId !== match.gameId))
      setMatches((prev) => {
        if (prev.some((m) => m.gameId === match.gameId)) return prev
        return [match, ...prev].slice(0, 20)
      })
    })

    return () => es.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getConfettiColors = (tier?: string) => {
    switch (tier) {
      case 'LEGENDARY':
        return ['#FFD700', '#FCD34D', '#F59E0B', '#FBBF24']
      case 'EPIC':
        return [
          '#A855F7',
          '#C084FC',
          '#7C3AED',
          '#F0ABFC',
          '#9333EA',
          '#E9D5FF'
        ]
      case 'RARE':
        return ['#60A5FA', '#3B82F6', '#93C5FD', '#2563EB']
      default:
        return ['#22C55E', '#4ADE80', '#86EFAC', '#16A34A']
    }
  }

  const numberName = pointsLoaded ? getFullNumberName(points) : ''
  const shouldShowTooltip =
    showPointsExplainer && numberName && numberName !== 'Points'

  const bonusTierKey = (resultAnim?.bonus?.tier ?? 'COMMON') as BonusTier
  const bonusTierStyle =
    BONUS_TIER_STYLES[bonusTierKey] ?? BONUS_TIER_STYLES.COMMON

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      {/* Result Animation Overlay */}
      {resultAnim && (
        <div className="fixed top-45 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center w-full max-w-sm px-4">
          {resultAnim.bonus &&
            (() => {
              const visualTierKey = bonusTierKey
              const visual = getBonusStyles(visualTierKey)
              const coreStyle = bonusTierStyle

              const adjustedScale =
                visualTierKey === 'LEGENDARY'
                  ? 'scale-[1.1]'
                  : visualTierKey === 'EPIC'
                    ? 'scale-[1.05]'
                    : 'scale-100'

              return (
                <div
                  className={`relative overflow-hidden w-fit mx-auto p-4 rounded-3xl border-2 mb-3 
              animate-in zoom-in slide-in-from-bottom-4 duration-300
              ${coreStyle.cardClass} ${adjustedScale} ${visual.glow}`}
                >
                  <div className="flex flex-col items-center px-4 text-center">
                    <div
                      className={`badge-aura-wrapper ${coreStyle.auraClass} inline-flex items-center mb-1`}
                    >
                      <span
                        className={`text-[10px] px-2.5 py-0.5 font-black uppercase tracking-widest rounded-full border relative z-10
                    ${
                      visualTierKey === 'LEGENDARY'
                        ? 'text-yellow-700 border-yellow-500 bg-yellow-50'
                        : `${coreStyle.color} ${coreStyle.bg} border-black/5`
                    }`}
                      >
                        {visual.label}
                      </span>
                    </div>

                    {!resultAnim.win && (
                      <div
                        className={`text-[14px] font-black uppercase italic tracking-tighter mb-1 leading-none ${coreStyle.color}`}
                      >
                        Lucky Save
                      </div>
                    )}

                    <div
                      className={`flex items-center gap-2 mt-1 transition-all ${visual.glow}`}
                    >
                      <span
                        className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tighter ${coreStyle.amountColor}`}
                      >
                        {resultAnim.win ? '+' : ''}
                        <span
                          className={getAmountColor(resultAnim.bonus.amount)}
                        >
                          {formatPoints(resultAnim.bonus.amount)}
                        </span>
                      </span>
                      <GemIcon size={20} />
                    </div>
                  </div>
                </div>
              )
            })()}

          <span
            className={`text-5xl sm:text-6xl font-black animate-bounce leading-tight drop-shadow-lg
      ${resultAnim.win ? 'text-green-500' : 'text-red-500'}`}
          >
            <span
              className={`text-5xl sm:text-6xl font-black animate-bounce leading-tight drop-shadow-lg flex items-center gap-1
              ${getAmountColor(animatedResult)}`}
            >
              {resultAnim.win ? (
                <>
                  <span className="text-green-500">+</span>
                  <span>{formatPoints(animatedResult)}</span>
                </>
              ) : (
                <>
                  <span className="text-red-500">-</span>
                  <span>{formatPoints(animatedResult)}</span>
                </>
              )}
            </span>
          </span>

          {resultAnim.win && (
            <div className="relative w-0 h-0">
              {resultAnim.confetti?.map((c, i) => {
                const colors = getConfettiColors(resultAnim.bonus?.tier)
                return (
                  <div
                    key={i}
                    className="absolute rounded-sm pointer-events-none"
                    style={
                      {
                        width: `${i % 3 === 0 ? 8 : 6}px`,
                        height: `${i % 3 === 0 ? 10 : 8}px`,
                        left: `${c.leftOffset}px`,
                        top: 0,
                        backgroundColor: colors[i % colors.length],
                        animation: `confetti-burst 1.2s ease-out ${c.delay}s forwards`,
                        '--vx': `${c.vx}px`,
                        '--vy': `${c.vy}px`
                      } as React.CSSProperties
                    }
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Controls */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 overflow-hidden">
        <div className="flex items-center gap-3 mb-1">
          <div>
            <div className="flex items-center gap-2 shrink-0 min-w-31.25 sm:min-w-36.25">
              <div className="relative group flex items-center">
                <div
                  className="flex items-center gap-2 cursor-pointer select-none"
                  onMouseEnter={() => setShowPointsExplainer(true)}
                  onMouseLeave={() => setShowPointsExplainer(false)}
                  onClick={() => setShowPointsExplainer(!showPointsExplainer)}
                >
                  <GemIcon size={24} className="shrink-0" />
                  <span
                    className={`text-xl font-bold tabular-nums ${getAmountColor(points)}`}
                  >
                    {pointsLoaded ? formatPoints(animatedPoints) : '...'}
                  </span>
                </div>

                {shouldShowTooltip && (
                  <div className="absolute top-full mt-2 left-0 z-50 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-black uppercase tracking-[0.2em] ${getAmountColor(points)}`}
                    >
                      {numberName}
                    </span>
                    <div className="absolute -top-1 left-10 w-2 h-2 bg-white border-t border-l border-gray-100 rotate-45" />
                  </div>
                )}
              </div>

              <div className="relative group flex items-center ml-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPointsInfo(!showPointsInfo)
                  }}
                  onBlur={() => setShowPointsInfo(false)}
                  className="text-gray-300 hover:text-purple-500 transition-colors p-1 outline-none sm:pointer-events-none"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
                <div
                  className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-70 sm:w-56 p-3 bg-gray-900 text-white text-[10px] sm:text-xs font-medium rounded-lg shadow-xl transition-opacity duration-200 z-50 text-center tracking-wide leading-relaxed ${showPointsInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'} sm:group-hover:opacity-100`}
                >
                  Virtual simulation points. No real-world currency or value.
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-gray-900" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              {displayNickname && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="text-[10px] font-black text-gray-500 uppercase tracking-wider overflow-hidden whitespace-nowrap block min-w-0"
                    title={displayNickname}
                  >
                    {displayNickname}
                  </span>

                  {dailyRank && (
                    <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full uppercase tracking-wide whitespace-nowrap">
                      #{dailyRank} today
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={toggleSound}
                className="shrink-0 p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition shadow-sm"
              >
                <SoundIcon muted={!soundOn} />
              </button>
            </div>
          </div>
        </div>

        {/* Bet input row */}
        <div className="flex flex-col sm:flex-row gap-1">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-bold text-gray-400 uppercase shrink-0">
              Bet
            </label>
            <div className="relative flex-1">
              <input
                type="text"
                value={isFocused ? inputString : formatPoints(betAmount)}
                onFocus={() => {
                  setIsFocused(true)
                  setInputString('')
                }}
                placeholder={!autoAllIn ? '100k → 100.000' : ''}
                onChange={(e) => {
                  const val = e.target.value
                  setInputString(val)
                  const parsed = parseShorthand(val)
                  if (parsed > 0n) {
                    const validBet = parsed > points ? points : parsed
                    setBetAmount(validBet)
                  }
                }}
                onBlur={() => {
                  setIsFocused(false)
                  let final = parseShorthand(inputString)
                  if (final > points) final = points
                  const floor = 100000n
                  if (final < floor) final = points < floor ? points : floor
                  setBetAmount(final)
                  setInputString(final.toString())
                }}
                className={`relative overflow-hidden w-fit mx-auto p-4 border border-gray-200 rounded-lg pl-3 pr-16 py-2.5 font-bold text-gray-800 focus:ring-2 focus:ring-purple-300 transition-all ${isFocused && inputString.length > 20 ? 'text-[10px] font-mono' : 'text-sm'}`}
              />
              {isFocused && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400 pointer-events-none">
                  ({formatPoints(betAmount)})
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setBetAmount(points)
                setInputString(points.toString())
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 active:scale-95 transition-all shadow-sm"
            >
              ALL IN
            </button>
            <button
              onClick={() => setAutoAllIn((prev) => !prev)}
              className={`flex-1 sm:flex-none px-3 py-2 text-[10px] font-bold rounded-lg border transition-all ${autoAllIn ? 'bg-green-600 text-white border-green-700' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
            >
              AUTO {autoAllIn ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && isHydrated && (
          <div
            className={`mt-3 flex items-start justify-between gap-3 rounded-xl px-4 py-3 border animate-in fade-in slide-in-from-top-2 duration-400
            ${notification === 'no_bigint' ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-200'}`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <span className="text-xl flex-none mt-0.5">
                {notification === 'no_bigint' ? '⚠️' : '🎉'}
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span
                  className={`text-[11px] font-black uppercase tracking-widest leading-tight
                  ${notification === 'no_bigint' ? 'text-red-700' : 'text-indigo-700'}`}
                >
                  {notification === 'no_bigint'
                    ? 'Browser Not Supported'
                    : "You've been granted 200,000 points!"}
                </span>
                <p
                  className={`text-[10px] font-medium leading-snug
                  ${notification === 'no_bigint' ? 'text-red-600' : 'text-indigo-500'}`}
                >
                  {notification === 'no_bigint'
                    ? 'RPS League requires a modern browser for Vigintillion-scale math. Please update your browser or OS.'
                    : 'Start betting to rank up the leaderboard. No login needed — your progress is saved automatically.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (notification === 'new_visitor')
                  localStorage.setItem('rps_welcomed', '1')
                setNotification(null)
              }}
              className={`flex-none p-1.5 rounded-lg transition-colors shrink-0
                ${
                  notification === 'no_bigint'
                    ? 'text-red-400 hover:text-red-700 hover:bg-red-100'
                    : 'text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100'
                }`}
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      <LiveStatsTicker />

      {errorMessage && (
        <div className="my-4 transition-all duration-300">
          <div className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg font-bold border-2 border-red-400 flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-200">
            <span className="animate-pulse">🚨</span> {errorMessage}
          </div>
        </div>
      )}

      <div className="flex flex-row items-center justify-between mb-1 gap-1 px-1">
        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-cyan-600 font-bold uppercase tracking-tight whitespace-nowrap">
          <p>PTS FLOOR: 100K</p>
          <p className="text-indigo-400/90">No Ties</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-bold whitespace-nowrap">
          <span className="text-green-600">WIN: +100%</span>

          <div className="relative flex items-center">
            <div
              className="cursor-pointer select-none flex items-center gap-1.5"
              onMouseEnter={() => setShowBonusExplainer(true)}
              onMouseLeave={() => setShowBonusExplainer(false)}
              onClick={() => setShowBonusExplainer(!showBonusExplainer)}
            >
              <span className="text-red-500">LOSE: -50%</span>
              <span className="bg-gray-100 hover:bg-gray-200 text-purple-600  text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md transition-colors tracking-tighter">
                BONUS INFO
              </span>
            </div>

            {showBonusExplainer && (
              <div className="absolute bottom-full -right-1 mb-3 z-50 p-3 bg-white border border-gray-100 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 w-48 sm:w-56">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">
                    Bonus System Active
                  </span>
                  <p className="text-[10px] leading-relaxed text-gray-500 font-medium whitespace-normal">
                    40% chance per match to trigger a{' '}
                    <span className="text-gray-800 font-bold">
                      Tiered Bonus
                    </span>
                    :
                  </p>
                  <ul className="text-[9px] text-gray-600 space-y-1 list-disc pl-3">
                    <li>
                      <span className="text-green-600 font-bold">
                        +100% to +1000%
                      </span>{' '}
                      gain on Win
                    </li>
                    <li>
                      <span className="text-blue-600 font-bold">
                        20% to 100% fewer
                      </span>{' '}
                      points lost on Loss
                    </li>
                    <li>Bad luck protection: 4th bet</li>
                  </ul>
                  <div className="mt-1 pt-1 border-t border-gray-50 flex gap-1 items-center justify-around text-[8px] font-black uppercase text-gray-400">
                    <span>Common</span>
                    <span className="text-blue-500">Rare</span>
                    <span className="text-purple-400">Epic</span>
                    <span className="text-yellow-500">Legendary</span>
                  </div>
                </div>
                <div className="absolute -bottom-1 right-6 w-2 h-2 bg-white border-b border-r border-gray-100 rotate-45" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-[60vh]">
        {!backendReady ? (
          <div className="text-center py-20 animate-pulse text-gray-400 text-sm">
            Connecting to live stream…
          </div>
        ) : (
          <>
            {showConnectionWarning && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <p className="text-xs font-bold text-red-900 uppercase">
                  {isOffline
                    ? 'No Internet Connection.'
                    : 'Server having issues.'}
                </p>
              </div>
            )}
            {pendingMatches
              .filter((pm) => pm.expiresAt - (now + serverOffset) > -5000)
              .map((pending) => (
                <PendingMatchCard
                  key={pending.gameId}
                  pending={pending}
                  prediction={predictions.get(pending.gameId) ?? null}
                  onPick={handlePick}
                  serverOffset={serverOffset}
                />
              ))}
            <MatchList
              matches={matches}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              predictions={predictions}
            />
          </>
        )}
      </div>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-25 right-4 z-40 bg-indigo-600 text-white p-3 rounded-full shadow-2xl transition-all duration-300 ${showJumpButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 10l7-7m0 0l7 7"
          />
        </svg>
      </button>
    </div>
  )
}
