'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { fetchLatestMatches } from '@/lib/api'
import MatchList from '@/components/MatchList'
import PendingMatchCard from '@/components/PendingMatchCard'
import GemIcon from '@/components/icons/GemIcon'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { getOrCreateUser, getUserId, getNickname } from '@/lib/user'
import type { Match, PendingMatch, PredictionRecord } from '@/types/rps'
import { formatPoints, parseShorthand } from '@/lib/format'
import { useSound } from '@/hooks/useSound'
import SoundIcon from '@/components/icons/SoundIcon'
import LiveStatsTicker from '@/components/LiveStatTicker'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

let _backendReady = false

export default function HomePage() {
  const [backendReady, setBackendReady] = useState(_backendReady)
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([])
  const [predictions, setPredictions] = useState<Map<string, PredictionRecord>>(
    new Map()
  )
  const [points, setPoints] = useState<number>(100000)
  const [pointsLoaded, setPointsLoaded] = useState(false)
  const [betAmount, setBetAmount] = useState<number>(100000)
  const [serverOffset, setServerOffset] = useState<number>(0)
  const [resultAnim, setResultAnim] = useState<{
    win: boolean
    amount: number
    confetti?: { vx: number; vy: number; leftOffset: number; delay: number }[]
  } | null>(null)
  const [animatedAmount, setAnimatedAmount] = useState(0)
  const [peakPoints, setPeakPoints] = useState(100000)
  const [autoAllIn, setAutoAllIn] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const { playWin, playLoss, soundOn, toggleSound } = useSound()
  const [showJumpButton, setShowJumpButton] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [inputString, setInputString] = useState(betAmount.toString())
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const triggerErrorRef = useRef((msg: string) => {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(null), 1200)
  })
  const lastPacketRef = useRef(Date.now())
  const isOffline = typeof window !== 'undefined' && !navigator.onLine
  const isStreamStale = now - lastPacketRef.current > 10000
  const showConnectionWarning = backendReady && (isOffline || isStreamStale)

  useEffect(() => {
    setInputString(betAmount.toString())
  }, [betAmount])

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
    if (isHydrated && autoAllIn) setBetAmount(points)
  }, [autoAllIn, points, isHydrated])

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
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedAmount(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [resultAnim])

  useEffect(() => {
    getOrCreateUser()
    const userId = getUserId()
    if (!userId) return

    fetch(`${API_BASE}/api/predictions/${userId}/points`)
      .then((res) => res.json())
      .then((data) => {
        const p = Number(data.points)
        setPoints(p)
        setPeakPoints(Number(data.peak_points))
        setBetAmount(autoAllInRef.current ? p : Math.min(100000, p))
        setPointsLoaded(true)
      })
      .catch((err) => {
        console.error("Failed to fetch points, falling back to 100k", err)
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
  }, [])

  useEffect(() => {
    fetchLatestMatches(1).then((data) => {
      if (data.matches.length > 0) markReady()
      loadMatches(1)
    })
  }, [loadMatches])

  const handlePick = async (gameId: string, playerName: string) => {
    const userId = getUserId()
    const nickname = getNickname()
    if (!userId || !nickname || betAmount <= 0) return

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
          betAmount: betAmountRef.current,
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
    newPoints: number
    isNewPeak: boolean
  }> => {
    const userId = getUserId()
    if (!userId) return { newPoints: pointsRef.current, isNewPeak: false }
    const res = await fetch(`${API_BASE}/api/predictions/${userId}/points`)
    const data = await res.json()
    const newPoints = Number(data.points)
    const newPeak = Number(data.peak_points)
    const isNewPeak = newPeak > peakPointsRef.current
    setPointsLoaded(true)

    setPeakPoints(newPeak)
    setPoints(newPoints)
    setBetAmount(
      autoAllInRef.current
        ? newPoints
        : Math.min(betAmountRef.current, newPoints)
    )
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

    es.addEventListener('result', (event) => {
      const match: Match = JSON.parse(event.data)
      lastPacketRef.current = Date.now()
      setPendingMatches((prev) => prev.filter((p) => p.gameId !== match.gameId))
      setMatches((prev) => {
        if (prev.some((m) => m.gameId === match.gameId)) return prev
        return [match, ...prev].slice(0, 20)
      })

      const prediction = predictionsRef.current.get(match.gameId)
      if (prediction && prediction.confirmed && !prediction.result) {
        const aWins =
          (match.playerA.played === 'ROCK' &&
            match.playerB.played === 'SCISSORS') ||
          (match.playerA.played === 'SCISSORS' &&
            match.playerB.played === 'PAPER') ||
          (match.playerA.played === 'PAPER' && match.playerB.played === 'ROCK')

        const winner = aWins ? match.playerA.name : match.playerB.name
        const isWin = winner === prediction.pick

        if (isWin) {
          playWin()
          const amount = betAmountRef.current
          fetchUpdatedPoints()
          setResultAnim({
            win: true,
            amount,
            confetti: Array.from({ length: 100 }).map(() => ({
              leftOffset: Math.random() * 100 - 50,
              vx: (Math.random() - 0.5) * 300,
              vy: -(Math.random() * 200 + 100),
              delay: Math.random() * 0.2
            }))
          })
        } else {
          playLoss()
          const pointsBefore = pointsRef.current
          new Promise<{ newPoints: number; isNewPeak: boolean }>((resolve) => {
            setTimeout(() => resolve(fetchUpdatedPoints()), 100)
          }).then(({ newPoints }) => {
            const actualLoss = pointsBefore - newPoints
            setResultAnim({
              win: false,
              amount: actualLoss,
              confetti: Array.from({ length: 100 }).map(() => ({
                leftOffset: Math.random() * 100 - 50,
                vx: (Math.random() - 0.5) * 300,
                vy: -(Math.random() * 200 + 100),
                delay: Math.random() * 0.2
              }))
            })
          })
        }

        setTimeout(() => setResultAnim(null), 2000)
        setPredictions((prev) => {
          const newMap = new Map(prev)
          newMap.set(match.gameId, {
            ...prediction,
            result: isWin ? 'WIN' : 'LOSE'
          })
          return newMap
        })
      }
    })

    return () => es.close()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
        Latest Matches
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Live results from the RPS League
      </p>

      {resultAnim && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center gap-2">
          <span
            className={`text-4xl sm:text-5xl font-black animate-bounce ${resultAnim.win ? 'text-green-500' : 'text-red-500'}`}
          >
            {resultAnim.win
              ? `+${formatPoints(animatedAmount)}`
              : `-${formatPoints(animatedAmount)}`}
          </span>
          {resultAnim.win && (
            <div className="relative w-0 h-0">
              {resultAnim.confetti?.map((c, i) => (
                <div
                  key={i}
                  className="absolute rounded-sm pointer-events-none"
                  style={
                    {
                      width: `${i % 3 === 0 ? 8 : 6}px`,
                      height: `${i % 3 === 0 ? 10 : 8}px`,
                      left: `${c.leftOffset}px`,
                      top: 0,
                      backgroundColor: [
                        '#A855F7',
                        '#C084FC',
                        '#7C3AED',
                        '#F0ABFC',
                        '#9333EA',
                        '#E9D5FF',
                        '#FFD700',
                        '#FCD34D'
                      ][i % 8],
                      animation: `confetti-burst 1.2s ease-out ${c.delay}s forwards`,
                      '--vx': `${c.vx}px`,
                      '--vy': `${c.vy}px`
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-t-xl border border-gray-100 shadow-sm p-4 ">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GemIcon size={24} />
            <span className="text-xl font-bold text-purple-600">
              {pointsLoaded ? formatPoints(points) : '...'}
            </span>

            <div className="relative group flex items-center ml-1">
              <div
                className="text-gray-300 hover:text-purple-500 transition-colors cursor-default p-1"
                aria-label="Points information"
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
              </div>

              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 sm:w-56 p-2.5 bg-gray-900 text-white text-[10px] sm:text-xs font-medium rounded-lg shadow-xl 
                opacity-0 pointer-events-none 
                group-hover:opacity-100 
                transition-opacity duration-200 z-50 text-center tracking-wide leading-relaxed"
              >
                Virtual simulation points. No real-world currency or value. Used
                for platform performance testing.
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
                value={inputString}
                onChange={(e) => {
                  const val = e.target.value
                  setInputString(val)
                  const parsed = parseShorthand(val)
                  if (parsed > 0) setBetAmount(Math.min(parsed, points))
                }}
                onBlur={() => {
                  const final = Math.max(
                    100000,
                    Math.min(parseShorthand(inputString), points)
                  )
                  setBetAmount(final)
                  setInputString(final.toString())
                }}
                className="w-full border border-gray-200 rounded-lg pl-3 pr-16 py-2.5 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-purple-300 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400">
                ({formatPoints(betAmount)})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setBetAmount(points)}
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

      {errorMessage && (
        <div className="my-4 transition-all duration-300">
          <div className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg font-bold border-2 border-red-400 flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-200">
            <span className="animate-pulse">⚠️</span>
            {errorMessage}
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

      <div className="min-h-[60vh]">
        {!backendReady ? (
          <div className="text-center py-20 animate-pulse text-gray-400 text-sm">
            Connecting to live stream… (server cold start, may take up to 60s)
          </div>
        ) : (
          <>
            {showConnectionWarning && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <p className="text-xs font-bold text-red-900 uppercase tracking-wide">
                  {isOffline
                    ? 'No Internet Connection. Check your WiFi...'
                    : 'Server having issues. Next match appearing soon...'}
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
