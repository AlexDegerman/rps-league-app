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
import { getOrCreateUser, getUserId, getNickname } from '@/lib/user'
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
  const [serverOffset, setServerOffset] = useState<number>(0)
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

  const pushTickerEvent = useCallback(
    (message: string, isReal: boolean, amount?: number) => {
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
    },
    []
  )

  useEffect(() => {
    const saved = localStorage.getItem('autoAllIn')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved !== null) setAutoAllIn(saved === 'true')
  }, [])

  useEffect(() => {
    localStorage.setItem('autoAllIn', autoAllIn.toString())
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoAllIn) setBetAmount(points)
  }, [autoAllIn, points])

  const fetchFn = useCallback((page: number) => fetchLatestMatches(page), [])
  const {
    matches,
    setMatches,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMatches
  } = useInfiniteScroll({ fetchFn })

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

  const fetchUpdatedPoints = useCallback(async () => {
    const userId = getUserId()
    if (!userId) return
    const res = await fetch(`${API_BASE}/api/predictions/${userId}/points`)
    const data = await res.json()

    if (data.points > peakPoints) {
      setPeakPoints(data.peak_points)
      pushTickerEvent(
        `You reached a new peak of ${formatPoints(data.points)} points!`,
        true,
        data.points
      )
    }
    setPoints(data.points)
  }, [peakPoints, pushTickerEvent])

  useEffect(() => {
    getOrCreateUser()
    const userId = getUserId()

    if (userId) {
      fetch(`${API_BASE}/api/predictions/${userId}/points`)
        .then((res) => res.json())
        .then((data) => {
          setPoints(data.points)
          setPeakPoints(data.peak_points)
          setBetAmount(autoAllIn ? data.points : Math.min(1000, data.points))
        })
    }

    fetch(`${API_BASE}/api/matches/pending`)
      .then((res) => res.json())
      .then((data: PendingMatch[]) => {
        if (data.length > 0) {
          setPendingMatches(data)
          markReady()
        }
      })

    fetchLatestMatches(1).then(() => {
      markReady()
      loadMatches(1)
    })
  }, [markReady, loadMatches, autoAllIn])

  const handlePick = async (gameId: string, playerName: string) => {
    const userId = getUserId()
    const nickname = getNickname()
    if (!userId || !nickname || betAmount <= 0) return

    setPredictions((prev) =>
      new Map(prev).set(gameId, { gameId, pick: playerName })
    )

    await fetch(`${API_BASE}/api/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        gameId,
        pick: playerName,
        betAmount,
        nickname
      })
    })
  }

  // SSE Listener
  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/live`)

    es.addEventListener('sync', (event) => {
      const { serverTime } = JSON.parse(event.data)
      setServerOffset(serverTime - Date.now())
    })

    es.addEventListener('pending', (event) => {
      const pending: PendingMatch = JSON.parse(event.data)
      setPendingMatches((prev) =>
        prev.some((m) => m.gameId === pending.gameId)
          ? prev
          : [pending, ...prev]
      )
      markReady()
    })

    es.addEventListener('prediction_result', (event) => {
      const data = JSON.parse(event.data)
      if (data.userId === getUserId()) return
      const name = data.nickname ?? 'Someone'
      const msg =
        data.result === 'WIN'
          ? data.wasAllIn
            ? `${name} went all-in and won ${formatPoints(data.amount)}!`
            : `${name} won ${formatPoints(data.amount)}!`
          : `${name} lost ${formatPoints(data.amount)}.`
      pushTickerEvent(msg, true, data.amount)
    })

    es.addEventListener('result', (event) => {
      const match: Match = JSON.parse(event.data)

      setPredictions((prev) => {
        const p = prev.get(match.gameId)
        if (!p) return prev

        const aWins =
          (match.playerA.played === 'ROCK' &&
            match.playerB.played === 'SCISSORS') ||
          (match.playerA.played === 'SCISSORS' &&
            match.playerB.played === 'PAPER') ||
          (match.playerA.played === 'PAPER' && match.playerB.played === 'ROCK')
        const winnerName = aWins ? match.playerA.name : match.playerB.name
        const isWin = p.pick === winnerName

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
        return new Map(prev).set(match.gameId, {
          ...p,
          result: isWin ? 'WIN' : 'LOSE'
        })
      })

      setPendingMatches((prev) => prev.filter((p) => p.gameId !== match.gameId))
      setMatches((prev) =>
        prev.some((m) => m.gameId === match.gameId) ? prev : [match, ...prev]
      )
      fetchUpdatedPoints()
    })

    return () => es.close()
  }, [
    betAmount,
    points,
    fetchUpdatedPoints,
    playWin,
    playLoss,
    markReady,
    setMatches,
    pushTickerEvent
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
          <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <span
              className={`text-3xl sm:text-4xl font-black animate-bounce ${resultAnim.win ? 'text-green-500' : 'text-red-500'}`}
            >
              {resultAnim.win
                ? `+${formatPoints(animatedAmount)}`
                : `-${formatPoints(animatedAmount)}`}
            </span>
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
                className="w-full border border-gray-200 rounded-lg pl-3 pr-16 py-2.5 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-purple-300 transition-all"
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
          {pendingMatches.map((pending) => (
            <PendingMatchCard
              key={pending.gameId}
              pending={pending}
              prediction={predictions.get(pending.gameId) ?? null}
              onPick={handlePick}
              serverOffset={serverOffset}
            />
          ))}
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
        <p className="text-[10px] text-gray-300 uppercase tracking-[0.2em]">
          &copy; 2026 RPS LEAGUE AI · v2.4.0
        </p>
      </footer>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-20 right-4 z-40 flex items-center gap-2 bg-indigo-600 text-white p-3 rounded-full shadow-2xl transition-all duration-300 ${showJumpButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
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
