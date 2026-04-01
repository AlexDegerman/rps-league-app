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

  useEffect(() => {
    const saved = localStorage.getItem('autoAllIn')
    if (saved !== null) {
      const isAuto = saved === 'true'
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoAllIn(isAuto)

      if (isAuto) {
        setBetAmount(points)
      }
    }
  }, [points])

  useEffect(() => {
    localStorage.setItem('autoAllIn', autoAllIn.toString())

    if (autoAllIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBetAmount(points)
    }
  }, [autoAllIn, points])

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

      const current = Math.floor(eased * end)
      setAnimatedAmount(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
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
        setPoints(data.points)
        setBetAmount(Math.min(1000, data.points))
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchLatestMatches(1)
      .then((data) => {
        if (data.matches.length > 0) markReady()
        loadMatches(1)
      })
      .catch(() => {})
  }, [loadMatches])

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

    if (autoAllIn) {
      setBetAmount(data.points)
    } else {
      setBetAmount((prev) => Math.min(prev, data.points))
    }
  }, [autoAllIn, peakPoints])

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/live`)

    es.addEventListener('pending', (event) => {
      const pending: PendingMatch = JSON.parse(event.data)
      setPendingMatches((prev) => [pending, ...prev])
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

        // Ticker event
        if (isWin) {
          playWin()
          if (betAmount === points) {
            pushTickerEvent(
              `You went all-in and won ${formatPoints(amount)} points!`,
              true,
              amount
            )
          } else {
            pushTickerEvent(
              `You won ${formatPoints(amount)} points!`,
              true,
              amount
            )
          }
        } else {
          playLoss()
          pushTickerEvent(
            `You lost ${formatPoints(amount)} points.`,
            true,
            amount
          )
        }

        // Animation
        setResultAnim({
          win: isWin,
          amount,
          confetti: isWin
            ? Array.from({ length: 40 }).map((_, i) => {
                const leftOffset =
                  i < 20 ? -(Math.random() * 40 + 10) : Math.random() * 40 + 10
                const vx =
                  i < 20 ? Math.random() * 60 + 20 : -(Math.random() * 60 + 20)
                const vy = -(Math.random() * 100 + 60)
                const delay = Math.random() * 0.15
                return { vx, vy, leftOffset, delay }
              })
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
  }, [setMatches, betAmount, points, fetchUpdatedPoints, playWin, playLoss])

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Latest Matches</h1>
      <p className="text-gray-500 mb-4">Live results from the RPS League</p>

      {/* Result animation overlay */}
      {resultAnim && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center gap-2">
          <span
            className={`text-4xl font-bold animate-bounce ${
              resultAnim.win ? 'text-green-500' : 'text-red-500'
            }`}
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
                  className="absolute w-2.5 h-2.5 rounded-sm"
                  style={
                    {
                      left: `${c.leftOffset}px`,
                      top: 0,
                      backgroundColor: [
                        '#A855F7',
                        '#C084FC',
                        '#7C3AED',
                        '#F0ABFC',
                        '#9333EA',
                        '#E9D5FF',
                        '#6D28D9'
                      ][i % 7],
                      animation: `confetti-burst 1s ease-out ${c.delay}s forwards`,
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

      {/* Points display and bet input */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 mb-2 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <GemIcon size={24} />
          <span className="text-lg font-bold text-purple-600">
            {formatPoints(points)}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <label className="text-sm text-gray-500 shrink-0">Bet amount</label>
          <input
            type="number"
            min={1}
            max={points}
            value={betAmount}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), points)
              setBetAmount(Math.max(1, val))
            }}
            className="w-28 border border-gray-200 rounded px-2 py-1 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <span className="text-xs text-gray-400">
            ({formatPoints(betAmount)})
          </span>

          {/* Container for All in + Auto all-in */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBetAmount(points)}
              className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition cursor-pointer"
            >
              All in
            </button>

            <button
              onClick={() => setAutoAllIn((prev) => !prev)}
              className={`text-xs px-2 py-1 rounded ${
                autoAllIn
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              } cursor-pointer`}
            >
              Auto All-in {autoAllIn ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={toggleSound}
              className="ml-2 p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition"
              title={soundOn ? 'Mute sounds' : 'Unmute sounds'}
            >
              <SoundIcon muted={!soundOn} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">Points cannot drop below 1000</p>
        <p className="text-xs text-gray-400">
          Win: <span className="text-green-600 font-medium">+100%</span> · Lose:{' '}
          <span className="text-red-500 font-medium">-50%</span> of bet
        </p>
      </div>

      {!backendReady ? (
        <p className="text-center text-gray-400 py-12">
          Connecting to live stream...
        </p>
      ) : isLoading ? (
        <p className="text-center text-gray-400 py-12">Loading matches...</p>
      ) : (
        <>
          {pendingMatches.length > 0 && (
            <ul className="space-y-3 mb-3">
              {pendingMatches.map((pending) => (
                <PendingMatchCard
                  key={pending.gameId}
                  pending={pending}
                  prediction={predictions.get(pending.gameId) ?? null}
                  onPick={handlePick}
                />
              ))}
            </ul>
          )}
          <MatchList
            matches={matches}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            predictions={predictions}
          />
        </>
      )}

      <PredictionTicker events={tickerEvents} />
    </div>
  )
}
