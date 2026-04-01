'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchLatestMatches } from '@/lib/api'
import MatchList from '@/components/MatchList'
import PendingMatchCard from '@/components/PendingMatchCard'
import GemIcon from '@/components/icons/GemIcon'
import PredictionTicker, {
  type TickerEvent
} from '@/components/PredictionTicker'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { getOrCreateUser, getUserId } from '@/lib/user'
import type { Match, PendingMatch, PredictionRecord } from '@/types/rps'
import { formatPoints } from '@/lib/format'
import { useSound } from '@/hooks/useSound'
import SoundIcon from '@/components/icons/SoundIcon'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

let _backendReady = false

export default function HomePage() {
  const [backendReady, setBackendReady] = useState(_backendReady)
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([])
  const [predictions, setPredictions] = useState<Map<string, PredictionRecord>>(
    new Map()
  )
  const [points, setPoints] = useState<number>(1000)
  const [betAmount, setBetAmount] = useState<number>(1000)
  const [tickerEvents, setTickerEvents] = useState<TickerEvent[]>([])
  const [resultAnim, setResultAnim] = useState<{
    win: boolean
    amount: number
    confetti?: { vx: number; vy: number; leftOffset: number; delay: number }[]
  } | null>(null)
  const [animatedAmount, setAnimatedAmount] = useState(0)
  const [peakPoints, setPeakPoints] = useState(1000)
  const [autoAllIn, setAutoAllIn] = useState(false)
  const { playWin, playLoss, soundOn, toggleSound } = useSound()
  const [showJumpButton, setShowJumpButton] = useState(false)

  const handleScroll = useCallback(() => {
    setShowJumpButton(window.scrollY > 400)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const markReady = useCallback(() => {
    _backendReady = true
    setBackendReady(true)
  }, [])

  // --- Auto All-in Logic (With Lint Suppression for Hydration Safety) ---
  useEffect(() => {
    const saved = localStorage.getItem('autoAllIn')
    if (saved !== null) {
      const isAuto = saved === 'true'
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoAllIn(isAuto)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('autoAllIn', autoAllIn.toString())
    if (autoAllIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBetAmount(points)
    }
  }, [autoAllIn, points])

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
  const {
    matches,
    setMatches,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMatches
  } = useInfiniteScroll({ fetchFn })

  // Animation logic
  useEffect(() => {
    if (!resultAnim) return
    const end = resultAnim.amount
    const duration = 600
    const startTime = performance.now()
    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(eased * end)
      setAnimatedAmount(current)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [resultAnim])

  // MASTER INITIALIZATION
  useEffect(() => {
    getOrCreateUser()
    const userId = getUserId()

    if (userId) {
      fetch(`${API_BASE}/api/predictions/${userId}/points`)
        .then((res) => res.json())
        .then((data) => {
          setPoints(data.points)
          // Initialize bet amount based on points, but respect autoAllIn if it's already true
          if (autoAllIn) {
            setBetAmount(data.points)
          } else {
            setBetAmount(Math.min(1000, data.points))
          }
        })
        .catch(console.error)
    }

    fetch(`${API_BASE}/api/matches/pending`)
      .then((res) => res.json())
      .then((data: PendingMatch[]) => {
        if (data.length > 0) {
          setPendingMatches(data)
          markReady()
        }
      })
      .catch(console.error)

    fetchLatestMatches(1)
      .then(() => {
        markReady()
        loadMatches(1)
      })
      .catch(() => markReady())
  }, [markReady, loadMatches, autoAllIn])

  const handlePick = async (gameId: string, playerName: string) => {
    const userId = getUserId()
    if (!userId || betAmount <= 0) return
    setPredictions((prev) => {
      const next = new Map(prev)
      next.set(gameId, { gameId, pick: playerName })
      return next
    })
    await fetch(`${API_BASE}/api/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, gameId, pick: playerName, betAmount })
    })
  }

  const fetchUpdatedPoints = useCallback(async () => {
    const userId = getUserId()
    if (!userId) return
    const res = await fetch(`${API_BASE}/api/predictions/${userId}/points`)
    const data = await res.json()
    setPeakPoints((prevPeak) => Math.max(prevPeak, data.peak_points))
    setPoints(() => {
      const newPoints = data.points
      if (newPoints > peakPoints) {
        pushTickerEvent(
          `You reached a new peak of ${formatPoints(newPoints)} points!`,
          true,
          newPoints
        )
      }
      return newPoints
    })
  }, [peakPoints])

  // SSE Listener
  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/live`)

    es.addEventListener('pending', (event) => {
      const pending: PendingMatch = JSON.parse(event.data)
      setPendingMatches((prev) => {
        if (prev.some((m) => m.gameId === pending.gameId)) return prev
        return [pending, ...prev]
      })
      markReady()
    })

    es.addEventListener('result', (event) => {
      const match: Match = JSON.parse(event.data)
      setPredictions((prev) => {
        const prediction = prev.get(match.gameId)
        if (!prediction) return prev
        const aWins =
          (match.playerA.played === 'ROCK' &&
            match.playerB.played === 'SCISSORS') ||
          (match.playerA.played === 'SCISSORS' &&
            match.playerB.played === 'PAPER') ||
          (match.playerA.played === 'PAPER' && match.playerB.played === 'ROCK')
        const winner = aWins ? match.playerA.name : match.playerB.name
        const result = winner === prediction.pick ? 'WIN' : 'LOSE'
        const isWin = result === 'WIN'
        const amount = isWin ? betAmount : Math.floor(betAmount * 0.5)

        if (isWin) {
          playWin()
          pushTickerEvent(
            betAmount === points
              ? `You went all-in and won ${formatPoints(amount)} points!`
              : `You won ${formatPoints(amount)} points!`,
            true,
            amount
          )
        } else {
          playLoss()
          pushTickerEvent(
            `You lost ${formatPoints(amount)} points.`,
            true,
            amount
          )
        }

        setResultAnim({
          win: isWin,
          amount,
          confetti: isWin
            ? Array.from({ length: 40 }).map((_, i) => ({
                vx:
                  i < 20 ? Math.random() * 60 + 20 : -(Math.random() * 60 + 20),
                vy: -(Math.random() * 100 + 60),
                leftOffset:
                  i < 20 ? -(Math.random() * 40 + 10) : Math.random() * 40 + 10,
                delay: Math.random() * 0.15
              }))
            : []
        })
        setTimeout(() => setResultAnim(null), 2000)

        const next = new Map(prev)
        next.set(match.gameId, { ...prediction, result })
        return next
      })

      setPendingMatches((prev) => prev.filter((p) => p.gameId !== match.gameId))
      setMatches((prev) => {
        if (prev.some((m) => m.gameId === match.gameId)) return prev
        return [match, ...prev]
      })
      fetchUpdatedPoints()
    })

    es.onerror = () => console.error('SSE connection lost')
    return () => es.close()
  }, [
    setMatches,
    betAmount,
    points,
    fetchUpdatedPoints,
    playWin,
    playLoss,
    markReady
  ])

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
        Latest Matches
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Live results from the RPS League
      </p>

      {/* Betting Card */}
      <div className="relative bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-2 overflow-hidden">
        {resultAnim && (
          <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] animate-in fade-in duration-300">
            <span
              className={`text-3xl sm:text-4xl font-black drop-shadow-md animate-bounce ${resultAnim.win ? 'text-green-500' : 'text-red-500'}`}
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
                    className="absolute w-2 h-2 rounded-full"
                    style={
                      {
                        left: `${c.leftOffset}px`,
                        top: 0,
                        backgroundColor: [
                          '#A855F7',
                          '#7C3AED',
                          '#22C55E',
                          '#EAB308'
                        ][i % 4],
                        animation: `confetti-burst 1s ease-out ${c.delay}s forwards`,
                        '--vx': `${c.vx * 0.7}px`,
                        '--vy': `${c.vy * 0.7}px`
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

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
                min={1}
                max={points}
                value={betAmount}
                onChange={(e) =>
                  setBetAmount(
                    Math.max(1, Math.min(Number(e.target.value), points))
                  )
                }
                className="w-full border border-gray-200 rounded-lg pl-3 pr-16 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400 pointer-events-none">
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
          Points floor: 1,000
        </p>
        <div className="flex gap-3 text-[10px] font-bold">
          <span className="text-green-600">WIN: +100%</span>
          <span className="text-red-500">LOSE: -50% OF BET</span>
        </div>
      </div>

      {!backendReady && matches.length === 0 ? (
        <div className="text-center py-20 animate-pulse">
          <p className="text-gray-400 text-sm">Connecting to arena stream...</p>
        </div>
      ) : (
        <div className="min-h-[60vh]">
          {pendingMatches.length > 0 && (
            <div className="space-y-3 mb-4">
              {pendingMatches.map((pending) => (
                <PendingMatchCard
                  key={pending.gameId}
                  pending={pending}
                  prediction={predictions.get(pending.gameId) ?? null}
                  onPick={handlePick}
                />
              ))}
            </div>
          )}
          {isLoading && matches.length === 0 ? (
            <p className="text-center text-gray-400 py-12">
              Loading arena history...
            </p>
          ) : (
            <MatchList
              matches={matches}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              predictions={predictions}
            />
          )}
        </div>
      )}

      <PredictionTicker events={tickerEvents} speed={8000} />

      <footer className="mt-12 py-8 border-t border-gray-100 text-center">
        <div className="flex items-center justify-center gap-6 mb-4">
          <a
            href="https://github.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-indigo-600 transition-colors text-sm font-medium"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-indigo-600 transition-colors text-sm font-medium"
          >
            LinkedIn
          </a>
        </div>
        <p className="text-[10px] text-gray-300 uppercase tracking-[0.2em]">
          &copy; 2026 RPS LEAGUE AI · v2.4.0
        </p>
      </footer>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-20 right-4 sm:bottom-24 sm:right-8 z-40 flex items-center gap-2 bg-indigo-600 text-white p-3 sm:px-5 sm:py-3 rounded-full shadow-2xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group border border-white/20 ${showJumpButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        {pendingMatches.length > 0 && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
          </span>
        )}
        <svg
          className="w-5 h-5 sm:w-4 sm:h-4 group-hover:-translate-y-0.5 transition-transform"
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
        <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">
          Back to Top
        </span>
      </button>
    </div>
  )
}
