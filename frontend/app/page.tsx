'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { fetchLatestMatches } from '@/lib/api'
import MatchList from '@/components/MatchList'
import PendingMatchCard from '@/components/PendingMatchCard'
import GemIcon from '@/components/icons/GemIcon'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { getOrCreateUser, getUserId, getNickname } from '@/lib/user'
import type { Match, PendingMatch, PredictionRecord } from '@/types/rps'
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
  const [points, setPoints] = useState<bigint>(100000n)
  const [pointsLoaded, setPointsLoaded] = useState(false)
  const [betAmount, setBetAmount] = useState<bigint>(100000n)
  const [serverOffset, setServerOffset] = useState<number>(0)
  const [resultAnim, setResultAnim] = useState<{
    win: boolean
    amount: bigint
    bonus?: BonusData | null
    confetti?: { vx: number; vy: number; leftOffset: number; delay: number }[]
  } | null>(null)
  const [animatedAmount, setAnimatedAmount] = useState<bigint>(0n)
  const [peakPoints, setPeakPoints] = useState<bigint>(100000n)
  const [autoAllIn, setAutoAllIn] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const { playWin, playLoss, soundOn, toggleSound } = useSound()
  const [showJumpButton, setShowJumpButton] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [inputString, setInputString] = useState('100000')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPointsInfo, setShowPointsInfo] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showPointsExplainer, setShowPointsExplainer] = useState(false)

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
    if (saved !== null) setAutoAllIn(saved === 'true')
    setIsHydrated(true)
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

  useEffect(() => {
    if (!resultAnim) return
    const end = resultAnim.amount
    const duration = 600
    const startTime = performance.now()

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1)
      const easedFactor = 1 - Math.pow(1 - progress, 3)

      if (progress < 1) {
        const scaledFactor = BigInt(Math.floor(easedFactor * 1000))
        setAnimatedAmount((end * scaledFactor) / 1000n)
        requestAnimationFrame(animate)
      } else {
        setAnimatedAmount(end)
      }
    }
    const rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [resultAnim])

  useEffect(() => {
    getOrCreateUser()
    const userId = getUserId()
    if (!userId) return

    fetch(`${API_BASE}/api/predictions/${userId}/points`)
      .then((res) => res.json())
      .then((data) => {
        const p = BigInt(data.points)
        setPoints(p)
        setPeakPoints(BigInt(data.peak_points))
        const initialBet = autoAllInRef.current ? p : p < 100000n ? p : 100000n
        setBetAmount(initialBet)
        setInputString(initialBet.toString())
        setPointsLoaded(true)
      })
      .catch((err) => {
        console.error('Failed to fetch points, falling back to 100k', err)
        setPointsLoaded(true)
      })

    fetch(`${API_BASE}/api/matches/pending`)
      .then((res) => res.json())
      .then((data: PendingMatch[]) => {
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

    fetchLatestMatches(1).then((data) => {
      if (data.matches.length > 0) markReady()
      loadMatches(1)
    })
  }, [loadMatches])

  const handlePick = async (gameId: string, playerName: string) => {
    const userId = getUserId()
    const nickname = getNickname()
    if (!userId || !nickname || betAmount <= 0n) return

    setPredictions((prev) =>
      new Map(prev).set(gameId, { gameId, pick: playerName, confirmed: false })
    )

    let succeeded = false
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)

      const res = await fetch(`${API_BASE}/api/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          gameId,
          pick: playerName,
          betAmount: betAmountRef.current.toString(),
          nickname
        }),
        signal: controller.signal
      })

      clearTimeout(timeout)
      const data = await res.json()

      if (res.ok && data.success === true) {
        succeeded = true
        setPredictions((prev) => {
          const next = new Map(prev)
          const current = next.get(gameId)
          if (current) next.set(gameId, { ...current, confirmed: true })
          return next
        })
      } else {
        triggerErrorRef.current(data.error || 'MATCH ALREADY ENDED')
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
    const userId = getUserId()
    if (!userId) return { newPoints: pointsRef.current, isNewPeak: false }
    const res = await fetch(`${API_BASE}/api/predictions/${userId}/points`)
    const data = await res.json()
    const newPoints = BigInt(data.points)
    const newPeak = BigInt(data.peak_points)
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
      const userId = getUserId()
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
          setResultAnim({
            win: false,
            amount: actualLoss,
            bonus,
            confetti: []
          })
        })
      }

      setTimeout(() => setResultAnim(null), 2000)

      setPredictions((prev) => {
        const newMap = new Map(prev)
        const existing = prev.get(data.gameId)
        if (existing) {
          newMap.set(data.gameId, {
            ...existing,
            result: isWin ? 'WIN' : 'LOSE'
          })
        }
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
        Latest Matches
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Live results from the RPS League
      </p>

      {/* Result Animation Overlay */}
      {resultAnim && (
        <div className="fixed top-[58%] sm:top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center justify-center w-full max-w-md">
          {resultAnim.bonus && (
            <div
              className={`flex flex-col items-center mb-1 sm:mb-2 transition-all duration-300 animate-in zoom-in 
                ${getBonusStyles(resultAnim.bonus.tier).glow}
                ${resultAnim.bonus.tier === 'LEGENDARY' ? 'animate-pulsate' : ''}`}
            >
              <span
                className={`text-[10px] sm:text-sm font-black uppercase tracking-[0.25em] mb-1 ${getBonusStyles(resultAnim.bonus.tier).text}`}
              >
                {getBonusStyles(resultAnim.bonus.tier).label}
              </span>
              <span
                className={`text-lg sm:text-2xl font-black ${resultAnim.win ? 'text-green-300' : 'text-blue-300'} drop-shadow-md`}
              >
                {resultAnim.win ? '+' : 'SAVED '}
                {formatPoints(resultAnim.bonus.amount)}
              </span>
            </div>
          )}

          <span
            className={`text-5xl sm:text-7xl font-black drop-shadow-2xl animate-bounce leading-tight ${resultAnim.win ? 'text-green-500' : 'text-red-500'}`}
          >
            {resultAnim.win
              ? `+${formatPoints(animatedAmount)}`
              : `-${formatPoints(animatedAmount)}`}
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

      {/* Main Controls Container */}
      <div className="bg-white rounded-t-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Points Scale Name Explainer */}
            <div className="relative group flex items-center">
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onMouseEnter={() => setShowPointsExplainer(true)}
                onMouseLeave={() => setShowPointsExplainer(false)}
                onClick={() => setShowPointsExplainer(!showPointsExplainer)}
              >
                <GemIcon size={24} />
                <span className={`text-xl font-bold ${getAmountColor(points)}`}>
                  {pointsLoaded ? formatPoints(points) : '...'}
                </span>
              </div>

              {/* Tooltip */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 min-w-35 max-w-55 p-2.5 bg-gray-900 text-white rounded-lg shadow-xl transition-all duration-200 z-50 text-center pointer-events-none
                  ${showPointsExplainer ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                `}
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[11px] text-purple-400 font-black uppercase tracking-[0.15em] leading-tight py-0.5 whitespace-normal">
                    {getFullNumberName(points)}
                  </span>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
              </div>
            </div>

            {/* General Info Icon Zone */}
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
                className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-70 sm:w-56 p-3 bg-gray-900 text-white text-[10px] sm:text-xs font-medium rounded-lg shadow-xl transition-opacity duration-200 z-50 text-center tracking-wide leading-relaxed ${showPointsInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'} sm:group-hover:opacity-100`}
              >
                Virtual simulation points. No real-world currency or value.
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
              </div>
            </div>
          </div>

          <button
            onClick={toggleSound}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition shadow-sm"
          >
            <SoundIcon muted={!soundOn} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-bold text-gray-400 uppercase shrink-0">
              Bet
            </label>
            <div className="relative flex-1">
              <input
                type="text"
                value={isFocused ? inputString : formatPoints(betAmount)}
                onFocus={() => setIsFocused(true)}
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
                className={`w-full border border-gray-200 rounded-lg pl-3 pr-16 py-2.5 font-bold text-gray-800 focus:ring-2 focus:ring-purple-300 transition-all ${isFocused && inputString.length > 20 ? 'text-[10px] font-mono' : 'text-sm'}`}
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
              className="flex-1 sm:flex-none px-4 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 active:scale-95 transition-all shadow-sm"
            >
              ALL IN
            </button>
            <button
              onClick={() => setAutoAllIn((prev) => !prev)}
              className={`flex-1 sm:flex-none px-3 py-2.5 text-[10px] font-bold rounded-lg border transition-all ${autoAllIn ? 'bg-green-600 text-white border-green-700' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
            >
              AUTO {autoAllIn ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      <LiveStatsTicker />

      {/* Error Message */}
      {errorMessage && (
        <div className="my-4 transition-all duration-300">
          <div className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg font-bold border-2 border-red-400 flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-200">
            <span className="animate-pulse">⚠️</span> {errorMessage}
          </div>
        </div>
      )}

      <div className="flex flex-row items-center justify-between mb-6 gap-2 px-1">
        <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium tracking-wide uppercase whitespace-nowrap">
          Points floor: 100,000
        </p>
        <div className="flex gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-bold whitespace-nowrap">
          <span className="text-green-600">WIN: +100%</span>
          <span className="text-red-500">LOSE: -50%</span>
        </div>
      </div>

      {/* Matches Area */}
      <div className="min-h-[60vh]">
        {!backendReady ? (
          <div className="text-center py-20 animate-pulse text-gray-400 text-sm">
            Connecting to live stream…
          </div>
        ) : (
          <>
            {showConnectionWarning && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-pulse">
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

      {/* Scroll to Top */}
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
