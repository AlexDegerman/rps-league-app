'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { fetchLatestMatches } from '@/lib/api'
import MatchList from '@/components/MatchList'
import PendingMatchCard from '@/components/PendingMatchCard'
import GemIcon from '@/components/icons/GemIcon'
import PredictionTicker, {
  type TickerEvent
} from '@/components/PredictionTicker'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { getOrCreateUser, getUserId, getNickname } from '@/lib/user'
import type { Match, PendingMatch, PredictionRecord } from '@/types/rps'
import { formatPoints } from '@/lib/format'
import { useSound } from '@/hooks/useSound'
import SoundIcon from '@/components/icons/SoundIcon'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Module-level flag persists across navigation, component state resets
// but this survives, so cold start message doesn't reappear
let _backendReady = false

export default function HomePage() {
  const [backendReady, setBackendReady] = useState(_backendReady)
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([])
  const [predictions, setPredictions] = useState<Map<string, PredictionRecord>>(
    new Map()
  )
  const [points, setPoints] = useState<number>(100000)
  const [betAmount, setBetAmount] = useState<number>(100000)
  const [tickerEvents, setTickerEvents] = useState<TickerEvent[]>([])
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

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [])

  // Refs mirror state values so SSE handlers always read current values
  // without requiring the effect to re-run (which would reconnect SSE)
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
    if (saved !== null) {
      setAutoAllIn(saved === 'true')
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('autoAllIn', autoAllIn.toString())
    }
  }, [autoAllIn, isHydrated])

  useEffect(() => {
    if (isHydrated && autoAllIn) {
      setBetAmount(points)
    }
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

  const pushTickerEvent = (
    message: string,
    isReal: boolean,
    amount?: number
  ) => {
    setTickerEvents((prev) => [
      ...prev.slice(-14),
      {
        id: crypto.randomUUID(),
        message,
        isReal,
        timestamp: Date.now(),
        amount
      }
    ])
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

        if (autoAllInRef.current) {
          setBetAmount(p)
        } else {
          setBetAmount(Math.min(100000, p))
        }
      })
      .catch((err) => console.error('Error fetching points:', err))

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
      .catch((err) => console.error('Error fetching pending matches:', err))
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
      new Map(prev).set(gameId, { gameId, pick: playerName })
    )

    try {
      const res = await fetch(`${API_BASE}/api/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          gameId,
          pick: playerName,
          betAmount: betAmountRef.current,
          nickname
        })
      })

      if (!res.ok) {
        setPredictions((prev) => {
          const next = new Map(prev)
          next.delete(gameId)
          return next
        })
      }
    } catch {
      setPredictions((prev) => {
        const next = new Map(prev)
        next.delete(gameId)
        return next
      })
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
      const data = JSON.parse(event.data) as {
        userId: string
        nickname: string
        result: 'WIN' | 'LOSE'
        amount: number
        wasAllIn: boolean
      }

      if (data.userId === getUserId()) return

      const name = data.nickname ?? 'Someone'
      if (data.result === 'WIN') {
        if (data.wasAllIn) {
          pushTickerEvent(
            `${name} went all-in and won ${formatPoints(data.amount)} points!`,
            true,
            data.amount
          )
        } else {
          pushTickerEvent(
            `${name} won ${formatPoints(data.amount)} points!`,
            true,
            data.amount
          )
        }
      } else {
        pushTickerEvent(
          `${name} lost ${formatPoints(data.amount)} points.`,
          true,
          data.amount
        )
      }
    })

    es.addEventListener('result', (event) => {
      const match: Match = JSON.parse(event.data)

      setPendingMatches((prev) => prev.filter((p) => p.gameId !== match.gameId))

      setMatches((prev) => {
        if (prev.some((m) => m.gameId === match.gameId)) return prev
        const updated = [match, ...prev]
        return updated.slice(0, 20)
      })

      const prediction = predictionsRef.current.get(match.gameId)

      if (prediction && !prediction.result) {
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

          fetchUpdatedPoints().then(({ isNewPeak, newPoints }) => {
            if (isNewPeak) {
              pushTickerEvent(
                `You reached a new peak of ${formatPoints(newPoints)} points!`,
                true,
                newPoints
              )
            } else {
              pushTickerEvent(
                `You won ${formatPoints(amount)} points!`,
                true,
                amount
              )
            }
          })

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
            pushTickerEvent(
              `You lost ${formatPoints(actualLoss)} points.`,
              true,
              actualLoss
            )

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

  const isAnimatingResult = !!resultAnim

  const isBettingClosing = pendingMatches.some((pm) => {
    const timeLeft = pm.expiresAt - (now + serverOffset)
    return timeLeft > 0 && timeLeft < 3000
  })

  const shouldPauseDemos = isAnimatingResult || isBettingClosing

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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GemIcon size={24} />
            <span className="text-xl font-bold text-purple-600">
              {formatPoints(points)}
            </span>
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
                type="number"
                min={100000}
                max={points}
                value={betAmount}
                onChange={(e) =>
                  setBetAmount(
                    Math.max(100000, Math.min(Number(e.target.value), points))
                  )
                }
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-1 px-1">
        <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
          Points floor: 100,000
        </p>
        <div className="flex gap-3 text-[10px] font-bold">
          <span className="text-green-600">WIN: +100%</span>
          <span className="text-red-500">LOSE: -50% OF BET</span>
        </div>
      </div>

      <div className="min-h-[60vh]">
        {!backendReady ? (
          <div className="text-center py-20 animate-pulse text-gray-400 text-sm">
            Connecting to stream...
          </div>
        ) : (
          <>
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

      <PredictionTicker events={tickerEvents} pauseDemos={shouldPauseDemos} />

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
