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
import type {
  BonusTier,
  Match,
  PendingMatch,
  PredictionRecord
} from '@/types/rps'
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
import { useEventTheme } from '@/lib/EventThemeContext'
import { EventTheme } from '@/lib/eventTheme'

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
    streakAfter?: number
    confettiType?:
      | 'normal'
      | 'hellfire'
      | 'lunar'
      | 'electric'
      | 'cards'
      | 'fever'
      | 'inferno'
  } | null>(null)
  const [peakPoints, setPeakPoints] = useState<bigint>(200000n)
  const [autoAllIn, setAutoAllIn] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const {
    playWin,
    playLoss,
    playCards,
    playElectric,
    playFire,
    playMoon,
    soundOn,
    toggleSound
  } = useSound()
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
  const [winStreak, setWinStreak] = useState(0)
  const [streakMult, setStreakMult] = useState(1)
  const [activeFlashEvent, setActiveFlashEvent] = useState<string | null>(null)
  const [flashBuffRemaining, setFlashBuffRemaining] = useState(0)
  const { setLiveTheme, setVisualMode } = useEventTheme()
  const getVisualMode = (flash: string | null, streak: number) => {
    if (flash === 'LUNAR') return 'flash_lunar' as const
    if (flash === 'ELECTRIC') return 'flash_electric' as const
    if (flash === 'CARDS') return 'flash_cards' as const
    if (flash === 'HELLFIRE') return 'flash_hellfire' as const
    if (streak >= 5) return 'inferno' as const
    if (streak >= 3) return 'fever' as const
    return null
  }
  const visualMode = getVisualMode(activeFlashEvent, winStreak)

  useEffect(() => {
    setVisualMode(visualMode)
    const flashMap: Record<string, EventTheme> = {
      flash_lunar: 'LUNAR',
      flash_electric: 'ELECTRIC',
      flash_cards: 'CARDS',
      flash_hellfire: 'HELLFIRE'
    }
    setLiveTheme(
      visualMode && flashMap[visualMode] ? flashMap[visualMode]! : null
    )
  }, [visualMode, setVisualMode, setLiveTheme])

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
  const flashBuffRemainingRef = useRef(flashBuffRemaining)
  const activeFlashEventRef = useRef(activeFlashEvent)
  useEffect(() => {
    activeFlashEventRef.current = activeFlashEvent
  }, [activeFlashEvent])

  useEffect(() => {
    flashBuffRemainingRef.current = flashBuffRemaining
  }, [flashBuffRemaining])
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
  const { full, capped } = formatPoints(points)

  const { display: animatedDisplay } = formatPoints(animatedPoints)
  const animatedResult = useAnimatedBigInt(resultAnim?.amount ?? 0n, 600, true)

  useEffect(() => {
    const user = getOrCreateUser()
    if (!isUserValid(user)) return

    fetch(`${API_BASE}/api/live/flash-state?userId=${user.userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.type) {
          setActiveFlashEvent(data.type)
          activeFlashEventRef.current = data.type
          setFlashBuffRemaining(data.betsRemaining)
          setLiveTheme(data.type as EventTheme)
        }
      })
      .catch(() => {})

    setDisplayNickname(user.nickname)

    fetchUserPoints(user.userId, user.shortId).then((data) => {
      if (!data) return
      if (data.nickname) setDisplayNickname(data.nickname)

      const p = BigInt(data.points)
      setPoints(p)
      setPeakPoints(BigInt(data.peakPoints))

      const savedStreak = data.currentWinStreak ?? 0
      if (savedStreak > 0) {
        setWinStreak(savedStreak)
        setStreakMult(
          savedStreak >= 5
            ? 15
            : savedStreak >= 4
              ? 10
              : savedStreak >= 3
                ? 5
                : 1
        )
      }

      const initialBet = autoAllInRef.current ? p : p < 100000n ? p : 100000n
      setBetAmount(initialBet)
      if (!isFocused) setInputString(initialBet.toString())
      setPointsLoaded(true)
    })

    fetch(`${API_BASE}/api/live/flash-state`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.type) {
          setActiveFlashEvent(data.type)
          setFlashBuffRemaining(data.betsRemaining)
        }
      })
      .catch(() => {})

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
        const currentFlash = activeFlashEventRef.current
        console.log('flash at sound time:', currentFlash)
        if (currentFlash === 'LUNAR') playMoon()
        else if (currentFlash === 'CARDS') playCards()
        else if (currentFlash === 'ELECTRIC') playElectric()
        else if (currentFlash === 'HELLFIRE') playFire()
        else playWin()
        const currentStreak = data.streakAfter ?? 0
        const capturedConfettiType =
          currentFlash === 'HELLFIRE'
            ? 'hellfire'
            : currentFlash === 'LUNAR'
              ? 'lunar'
              : currentFlash === 'ELECTRIC'
                ? 'electric'
                : currentFlash === 'CARDS'
                  ? 'cards'
                  : currentStreak >= 5
                    ? 'inferno'
                    : currentStreak >= 3
                      ? 'fever'
                      : 'normal'
        const bonus = data.bonus
          ? { ...data.bonus, amount: BigInt(data.bonus.amount) }
          : null
        const amount = BigInt(data.amount)
        fetchUpdatedPoints()
        setResultAnim({
          win: true,
          amount,
          bonus,
          streakAfter: currentStreak,
          confettiType: capturedConfettiType,
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
      const newStreak = data.streakAfter ?? 0
      setWinStreak(newStreak)
      setStreakMult(data.streakMult ?? 1)

      if (activeFlashEventRef.current) {
        const next = flashBuffRemainingRef.current - 1
        setFlashBuffRemaining(next)
        if (next <= 0) {
          setActiveFlashEvent(null)
          setLiveTheme(null)
        }
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

    es.addEventListener('flash_event', (event) => {
      const data = JSON.parse(event.data)
      const { userId } = getOrCreateUser()
      if (data.userId !== userId) return
      setActiveFlashEvent(data.type)
      activeFlashEventRef.current = data.type
      setFlashBuffRemaining(data.betsRemaining)
      setLiveTheme(data.type as EventTheme)
    })

    return () => es.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getConfettiColors = (tier?: string, streak?: number) => {
    if (streak && streak >= 5)
      return ['#f97316', '#ef4444', '#fbbf24', '#fb923c']
    if (streak && streak >= 3)
      return ['#22c55e', '#4ade80', '#86efac', '#16a34a']

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

  const isInferno = winStreak >= 5

  const isFlash = visualMode?.startsWith('flash_') ?? false

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      {/* Screen edge glow — flash takes priority */}
      {visualMode &&
        (() => {
          const edgeConfig = {
            flash_lunar: {
              radial: 'rgba(144,205,244,0.2)',
              shadow: 'rgba(144,205,244,0.35)'
            },
            flash_electric: {
              radial: 'rgba(159,122,234,0.25)',
              shadow: 'rgba(159,122,234,0.4)'
            },
            flash_cards: {
              radial: 'rgba(236,201,75,0.18)',
              shadow: 'rgba(236,201,75,0.3)'
            },
            flash_hellfire: {
              radial: 'rgba(197,48,48,0.3)',
              shadow: 'rgba(197,48,48,0.4)'
            },
            inferno: {
              radial: 'rgba(249,115,22,0.25)',
              shadow: 'rgba(239,68,68,0.35)'
            },
            fever: {
              radial: 'rgba(34,197,94,0.15)',
              shadow: 'rgba(34,197,94,0.2)'
            }
          }
          const e = edgeConfig[visualMode as keyof typeof edgeConfig]
          if (!e) return null
          return (
            <div
              className="fixed inset-0 pointer-events-none z-30"
              style={{
                background: `radial-gradient(ellipse at center, transparent 55%, ${e.radial} 100%)`,
                boxShadow: `inset 0 0 90px ${e.shadow}`
              }}
            />
          )
        })()}

      <div className="relative">
        {/* Flash event confetti — sibling of result div, no transform parent */}
        {resultAnim?.win &&
          (() => {
            const type = resultAnim.confettiType ?? 'normal'

            if (type === 'hellfire')
              return (
                <div
                  className="absolute inset-x-0 top-0 pointer-events-none z-50 overflow-hidden rounded-xl"
                  style={{ height: '420px' }}
                >
                  {/* screen flash on ignition */}
                  <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background:
                        'radial-gradient(ellipse at 50% 100%, #ef444466, transparent 70%)',
                      animation: 'hellfire-screen-flash 1.2s ease-out forwards'
                    }}
                  />

                  {/* ground glow bar */}
                  <div
                    className="absolute inset-x-0 bottom-0"
                    style={{
                      height: '28px',
                      background:
                        'linear-gradient(to top, #dc2626cc, #ef444433, transparent)',
                      animation:
                        'hellfire-glow-pulse 0.9s ease-in-out infinite',
                      borderRadius: '0 0 12px 12px'
                    }}
                  />

                  {/* main flame columns — 100 particles in 3 size tiers */}
                  {Array.from({ length: 100 }).map((_, i) => {
                    const tier = i % 3 
                    const size = [6, 11, 18][tier]
                    const colors = [
                      ['#ef4444', '#f97316'],
                      ['#dc2626', '#fbbf24'],
                      ['#b91c1c', '#fb923c'],
                      ['#7f1d1d', '#ef4444'],
                      ['#991b1b', '#f97316'],
                      ['#fbbf24', '#ef4444']
                    ]
                    const [c1, c2] = colors[i % 6]
                    const col = (i % 18) * 5.7
                    const vyBase = -(90 + (i % 5) * 30)
                    const vyFull = -(150 + (i % 7) * 40)
                    const sx = 0.7 + (i % 4) * 0.2
                    const delay = (i % 12) * 0.04
                    const dur = 0.7 + (i % 5) * 0.12
                    return (
                      <div
                        key={i}
                        className="absolute pointer-events-none"
                        style={
                          {
                            width: `${size}px`,
                            height: `${size * 1.8}px`,
                            left: `${col + (i % 3) * 1.2}%`,
                            bottom: `${2 + (i % 4) * 3}%`,
                            background: `radial-gradient(ellipse at 50% 85%, ${c1}, ${c2}99, transparent)`,
                            borderRadius: '50% 50% 25% 25%',
                            filter: `blur(${[0.5, 1, 1.8][tier]}px)`,
                            animation: `hellfire-rise ${dur}s ease-out ${delay}s infinite`,
                            '--vy': `${vyBase}px`,
                            '--vy-full': `${vyFull}px`,
                            '--sx': sx
                          } as React.CSSProperties
                        }
                      />
                    )
                  })}

                  {/* flying embers — 60 sparks */}
                  {Array.from({ length: 60 }).map((_, i) => {
                    const size = 2 + (i % 4)
                    return (
                      <div
                        key={`e${i}`}
                        className="absolute rounded-full pointer-events-none"
                        style={
                          {
                            width: `${size}px`,
                            height: `${size}px`,
                            left: `${5 + (i % 14) * 7}%`,
                            bottom: `${5 + (i % 5) * 6}%`,
                            background:
                              i % 3 === 0
                                ? '#fbbf24'
                                : i % 3 === 1
                                  ? '#fb923c'
                                  : '#ef4444',
                            boxShadow: `0 0 ${size * 2}px ${i % 2 === 0 ? '#fbbf24' : '#ef4444'}`,
                            animation: `hellfire-ember ${0.6 + (i % 6) * 0.15}s ease-out ${(i % 10) * 0.06}s infinite`,
                            '--vx': `${((i * 37 + 11) % 120) - 60}px`,
                            '--vy': `${-(60 + ((i * 23 + 7) % 100))}px`
                          } as React.CSSProperties
                        }
                      />
                    )
                  })}

                  {/* heat shimmer columns — 14 vertical wisps */}
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div
                      key={`s${i}`}
                      className="absolute pointer-events-none"
                      style={
                        {
                          width: '3px',
                          height: `${40 + (i % 4) * 20}px`,
                          left: `${4 + i * 7}%`,
                          bottom: '6%',
                          background:
                            'linear-gradient(to top, rgba(251,146,60,0.35), transparent)',
                          borderRadius: '2px',
                          filter: 'blur(2px)',
                          animation: `hellfire-shimmer ${0.8 + (i % 3) * 0.2}s ease-out ${i * 0.07}s infinite`
                        } as React.CSSProperties
                      }
                    />
                  ))}

                  {/* ash floaters — 20 tiny grey flecks drifting up */}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={`a${i}`}
                      className="absolute pointer-events-none rounded-full"
                      style={
                        {
                          width: `${1 + (i % 2)}px`,
                          height: `${1 + (i % 2)}px`,
                          left: `${(i * 47 + 3) % 95}%`,
                          bottom: `${10 + (i % 6) * 7}%`,
                          background: '#9ca3af',
                          opacity: 0.6,
                          animation: `hellfire-ember ${1.4 + (i % 4) * 0.3}s ease-out ${i * 0.09}s infinite`,
                          '--vx': `${((i * 19 + 5) % 60) - 30}px`,
                          '--vy': `${-(80 + ((i * 11 + 3) % 80))}px`
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              )

            if (type === 'lunar')
              return (
                <div
                  className="absolute inset-x-0 top-0 pointer-events-none z-50 overflow-hidden rounded-xl"
                  style={{ height: '420px' }}
                >
                  {/* Moon source bloom */}
                  <div
                    className="absolute"
                    style={
                      {
                        width: '280px',
                        height: '160px',
                        top: '-50px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background:
                          'radial-gradient(ellipse, rgba(220,240,255,0.9) 0%, rgba(180,220,255,0.6) 35%, rgba(144,205,244,0.2) 65%, transparent 80%)',
                        animation: 'lunar-bloom 3s ease-out 0.05s forwards'
                      } as React.CSSProperties
                    }
                  />
                  <div
                    className="absolute"
                    style={
                      {
                        width: '120px',
                        height: '80px',
                        top: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background:
                          'radial-gradient(ellipse, rgba(255,255,255,1) 0%, rgba(220,240,255,0.8) 50%, transparent 75%)',
                        animation: 'lunar-bloom 3s ease-out 0.1s forwards'
                      } as React.CSSProperties
                    }
                  />

                  {/* Shafts */}
                  {(
                    [
                      {
                        left: '10%',
                        w: 18,
                        blur: 5,
                        aC: 0.55,
                        aG: 0.25,
                        delay: 0.15,
                        dur: 3.0
                      },
                      {
                        left: '18%',
                        w: 40,
                        blur: 12,
                        aC: 0.6,
                        aG: 0.3,
                        delay: 0.08,
                        dur: 3.1
                      },
                      {
                        left: '23%',
                        w: 20,
                        blur: 7,
                        aC: 0.45,
                        aG: 0.2,
                        delay: 0.12,
                        dur: 2.9
                      },
                      {
                        left: '27%',
                        w: 28,
                        blur: 8,
                        aC: 0.65,
                        aG: 0.32,
                        delay: 0.05,
                        dur: 3.0
                      },
                      {
                        left: '35%',
                        w: 70,
                        blur: 16,
                        aC: 0.7,
                        aG: 0.38,
                        delay: 0.03,
                        dur: 3.2
                      },
                      {
                        left: '42%',
                        w: 45,
                        blur: 12,
                        aC: 0.75,
                        aG: 0.4,
                        delay: 0.02,
                        dur: 3.0
                      },
                      {
                        left: '46%',
                        w: 25,
                        blur: 9,
                        aC: 0.55,
                        aG: 0.28,
                        delay: 0.06,
                        dur: 3.0
                      },
                      {
                        left: '50%',
                        w: 110,
                        blur: 22,
                        aC: 0.85,
                        aG: 0.5,
                        delay: 0.0,
                        dur: 3.3
                      },
                      {
                        left: '54%',
                        w: 25,
                        blur: 9,
                        aC: 0.55,
                        aG: 0.28,
                        delay: 0.06,
                        dur: 3.0
                      },
                      {
                        left: '58%',
                        w: 45,
                        blur: 12,
                        aC: 0.75,
                        aG: 0.4,
                        delay: 0.02,
                        dur: 3.0
                      },
                      {
                        left: '65%',
                        w: 70,
                        blur: 16,
                        aC: 0.7,
                        aG: 0.38,
                        delay: 0.03,
                        dur: 3.2
                      },
                      {
                        left: '73%',
                        w: 28,
                        blur: 8,
                        aC: 0.65,
                        aG: 0.32,
                        delay: 0.05,
                        dur: 3.0
                      },
                      {
                        left: '77%',
                        w: 20,
                        blur: 7,
                        aC: 0.45,
                        aG: 0.2,
                        delay: 0.12,
                        dur: 2.9
                      },
                      {
                        left: '82%',
                        w: 40,
                        blur: 12,
                        aC: 0.6,
                        aG: 0.3,
                        delay: 0.08,
                        dur: 3.1
                      },
                      {
                        left: '90%',
                        w: 18,
                        blur: 5,
                        aC: 0.55,
                        aG: 0.25,
                        delay: 0.15,
                        dur: 3.0
                      }
                    ] as Array<{
                      left: string
                      w: number
                      blur: number
                      aC: number
                      aG: number
                      delay: number
                      dur: number
                    }>
                  ).flatMap((d, i) => [
                    // Halo
                    <div
                      key={`h${i}`}
                      className="absolute"
                      style={
                        {
                          top: '-5%',
                          left: d.left,
                          width: `${d.w * 2.5}px`,
                          height: '0px',
                          transform: 'translateX(-50%)',
                          background: `linear-gradient(to bottom, rgba(180,220,255,${d.aG * 0.5}), rgba(144,205,244,${d.aG}), rgba(144,205,244,${d.aG * 0.5}), transparent)`,
                          filter: `blur(${d.blur * 1.8}px)`,
                          animation: `lunar-shaft-fall ${d.dur}s ease-out ${d.delay}s forwards`
                        } as React.CSSProperties
                      }
                    />,
                    // Core
                    <div
                      key={`c${i}`}
                      className="absolute"
                      style={
                        {
                          top: '-5%',
                          left: d.left,
                          width: `${d.w}px`,
                          height: '0px',
                          transform: 'translateX(-50%)',
                          background: `linear-gradient(to bottom, rgba(255,255,255,${d.aC}), rgba(210,235,255,${d.aC * 0.9}), rgba(180,220,255,${d.aC * 0.7}), rgba(144,205,244,${d.aC * 0.4}), transparent)`,
                          filter: `blur(${d.blur}px)`,
                          animation: `lunar-shaft-fall ${d.dur}s ease-out ${d.delay}s forwards`
                        } as React.CSSProperties
                      }
                    />,
                    // Spine
                    ...(d.w >= 40
                      ? [
                          <div
                            key={`s${i}`}
                            className="absolute"
                            style={
                              {
                                top: '-5%',
                                left: d.left,
                                width: `${Math.max(2, Math.round(d.w * 0.08))}px`,
                                height: '0px',
                                transform: 'translateX(-50%)',
                                background:
                                  'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0.7), rgba(220,240,255,0.3), transparent)',
                                filter: 'blur(1px)',
                                animation: `lunar-shaft-fall ${d.dur}s ease-out ${d.delay}s forwards`
                              } as React.CSSProperties
                            }
                          />
                        ]
                      : [])
                  ])}

                  {/* Drifting motes */}
                  {Array.from({ length: 120 }).map((_, i) => (
                    <div
                      key={`m${i}`}
                      className="absolute rounded-full"
                      style={
                        {
                          width: `${2 + (i % 3)}px`,
                          height: `${2 + (i % 3)}px`,
                          left: `${((i * 97 + 13) % 96) + 2}%`,
                          top: `${(i * 61 + 7) % 85}%`,
                          background: [
                            'rgba(255,255,255,1)',
                            'rgba(220,240,255,1)',
                            'rgba(180,220,255,0.95)',
                            'rgba(144,205,244,0.9)'
                          ][i % 4],
                          boxShadow: `0 0 ${5 + (i % 3) * 3}px rgba(180,220,255,1), 0 0 ${10 + (i % 3) * 4}px rgba(144,205,244,0.8)`,
                          animation: `lunar-mote-drift ${2.8 + (i % 5) * 0.25}s ease-in-out ${(i % 9) * 0.1}s forwards`,
                          '--dx': `${((i * 41 + 13) % 70) - 35}px`,
                          opacity: 0
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              )

            if (type === 'electric')
              return (
                <div
                  className="absolute inset-x-0 top-0 pointer-events-none z-50 overflow-hidden rounded-xl"
                  style={{ height: '420px' }}
                >
                  {Array.from({ length: 22 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={
                        {
                          left: `${(i / 21) * 98 + 1}%`,
                          top: '-5%',
                          width: `${2 + (i % 4)}px`,
                          height: '0',
                          background: `linear-gradient(to bottom, rgba(255,255,255,1), #e9d5ff, #b794f4, #9f7aea, rgba(127,156,245,0.5), transparent)`,
                          boxShadow: `0 0 14px #b794f4, 0 0 28px rgba(159,122,234,0.8), 0 0 50px rgba(127,156,245,0.5)`,
                          animation: `electric-bolt-fall 0.75s ease-in 0s forwards`
                        } as React.CSSProperties
                      }
                    />
                  ))}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={`h${i}`}
                      className="absolute"
                      style={
                        {
                          left: `${(i / 7) * 90 + 5}%`,
                          top: '-5%',
                          width: `${20 + (i % 3) * 10}px`,
                          height: '0',
                          background: `linear-gradient(to bottom, rgba(183,148,244,0.2), rgba(159,122,234,0.3), transparent)`,
                          filter: 'blur(6px)',
                          animation: `electric-bolt-fall 0.75s ease-in 0s forwards`
                        } as React.CSSProperties
                      }
                    />
                  ))}
                  {Array.from({ length: 80 }).map((_, i) => (
                    <div
                      key={`s${i}`}
                      className="absolute rounded-full"
                      style={
                        {
                          width: `${2 + (i % 4)}px`,
                          height: `${2 + (i % 4)}px`,
                          left: `${(i * 13 + 5) % 100}%`,
                          top: `${(i * 7 + 11) % 70}%`,
                          background: [
                            '#e9d5ff',
                            '#b794f4',
                            '#9f7aea',
                            '#ffffff',
                            '#7f9cf5'
                          ][i % 5],
                          boxShadow: `0 0 8px #b794f4, 0 0 16px rgba(159,122,234,0.6)`,
                          animation: `confetti-burst 0.8s ease-out ${(i % 6) * 0.04}s forwards`,
                          '--vx': `${((i * 37 + 15) % 300) - 150}px`,
                          '--vy': `${((i * 23 + 9) % 300) - 150}px`
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              )

            if (type === 'cards')
              return (
                <div
                  className="absolute inset-x-0 top-0 pointer-events-none z-50 overflow-hidden rounded-xl"
                  style={{ height: '420px' }}
                >
                  {/* gold/silver particle burst from center-top */}
                  {Array.from({ length: 40 }).map((_, i) => {
                    const isGold = i % 2 === 0
                    const size = 3 + (i % 4)
                    return (
                      <div
                        key={`p${i}`}
                        className="absolute rounded-full pointer-events-none"
                        style={
                          {
                            width: `${size}px`,
                            height: `${size}px`,
                            left: `${40 + ((i * 31 + 7) % 20)}%`,
                            top: '0%',
                            background: isGold ? '#ecc94b' : '#e8e8e8',
                            boxShadow: `0 0 ${size * 2}px ${isGold ? '#ecc94b' : '#c0c0c0'}`,
                            animation: `card-particle-burst ${0.8 + (i % 5) * 0.1}s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 0.025}s forwards`,
                            '--vx': `${((i * 41 + 13) % 300) - 150}px`,
                            '--vy': `${120 + ((i * 23 + 7) % 200)}px`
                          } as React.CSSProperties
                        }
                      />
                    )
                  })}

                  {/* large suit symbols */}
                  {Array.from({ length: 40 }).map((_, i) => {
                    const suits = ['♠', '♥', '♣', '♦']
                    const colors = ['#1a202c', '#c53030', '#1a202c', '#c53030']
                    const size = 12 + (i % 5) * 9
                    return (
                      <div
                        key={i}
                        className="absolute pointer-events-none font-black select-none"
                        style={
                          {
                            left: `${1 + (i % 14) * 7.2}%`,
                            top: `${-8 - (i % 5) * 4}%`,
                            fontSize: `${size}px`,
                            color: colors[i % 4],
                            textShadow: `0 0 16px ${i % 2 === 0 ? 'rgba(236,201,75,0.95)' : 'rgba(192,192,192,0.85)'}, 0 0 30px ${i % 2 === 0 ? 'rgba(236,201,75,0.4)' : 'rgba(192,192,192,0.3)'}`,
                            filter: `drop-shadow(0 0 6px ${i % 2 === 0 ? 'rgba(236,201,75,0.6)' : 'rgba(192,192,192,0.5)'})`,
                            animation: `card-cascade-fall ${1.4 + (i % 6) * 0.1}s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 0.04}s forwards`,
                            '--vx': `${((i * 31 + 9) % 100) - 50}px`,
                            '--vy': `${300 + ((i * 17 + 5) % 200)}px`
                          } as React.CSSProperties
                        }
                      >
                        {suits[i % 4]}
                      </div>
                    )
                  })}

                  {/* mini card rectangle */}
                  {Array.from({ length: 30 }).map((_, i) => {
                    const ranks = ['A', 'K', 'Q', 'J', '10']
                    const isGold = i % 3 === 0
                    const isSilv = i % 3 === 1
                    const bg = isGold
                      ? 'linear-gradient(135deg, #ecc94b, #f6e05e)'
                      : isSilv
                        ? 'linear-gradient(135deg, #c0c0c0, #e8e8e8)'
                        : 'white'
                    const rankColor = isGold
                      ? '#92400e'
                      : isSilv
                        ? '#374151'
                        : '#c53030'
                    return (
                      <div
                        key={`c${i}`}
                        className="absolute rounded-sm pointer-events-none flex items-center justify-center"
                        style={
                          {
                            width: '14px',
                            height: '20px',
                            left: `${3 + (i % 12) * 8.5}%`,
                            top: `${-10 - (i % 4) * 4}%`,
                            background: bg,
                            border: '1px solid rgba(0,0,0,0.12)',
                            boxShadow: `0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)`,
                            fontSize: '6px',
                            fontWeight: 800,
                            color: rankColor,
                            lineHeight: 1,
                            animation: `card-cascade-fall ${1.2 + (i % 6) * 0.1}s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 0.055}s forwards`,
                            '--vx': `${((i * 23 + 7) % 80) - 40}px`,
                            '--vy': `${280 + ((i * 13 + 11) % 180)}px`
                          } as React.CSSProperties
                        }
                      >
                        {ranks[i % 5]}
                      </div>
                    )
                  })}

                  {/* shimmer trails  */}
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={`t${i}`}
                      className="absolute pointer-events-none"
                      style={
                        {
                          width: '1px',
                          height: `${20 + (i % 4) * 12}px`,
                          left: `${6 + i * 6.2}%`,
                          top: `${-5 - (i % 3) * 3}%`,
                          background: `linear-gradient(to bottom, ${i % 2 === 0 ? 'rgba(236,201,75,0.7)' : 'rgba(192,192,192,0.6)'}, transparent)`,
                          animation: `card-shimmer-trail ${1.6 + (i % 4) * 0.1}s ease-out ${i * 0.05}s forwards`
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              )

            return null
          })()}

        {/* Result Animation Overlay */}
        {resultAnim && (
          <div className="absolute -bottom-35 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col-reverse items-center w-full max-w-sm px-4">
            <span className="flex items-center gap-1 text-5xl sm:text-6xl font-black animate-bounce leading-tight drop-shadow-lg">
              {resultAnim.win && (resultAnim.streakAfter ?? 0) >= 3 && (
                <div
                  className={`mb-2 px-3 py-1 rounded-lg border font-black text-xs uppercase tracking-widest text-center animate-in zoom-in duration-200 ${(resultAnim.streakAfter ?? 0) >= 5 ? 'bg-orange-950 border-orange-500 text-orange-400 streak-fire-text' : 'bg-green-950 border-green-500 text-green-400'}`}
                >
                  x{streakMult} STREAK BONUS
                </div>
              )}
              {resultAnim.win ? (
                <>
                  <span className="text-green-500">+</span>
                  <span className="text-5xl sm:text-6xl font-black">
                    <span className={getAmountColor(animatedResult)}>
                      {formatPoints(animatedResult).display}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <span className="text-red-500">-</span>
                  <span className="text-5xl sm:text-6xl font-black">
                    <span className={getAmountColor(animatedResult)}>
                      {formatPoints(animatedResult).display}
                    </span>
                  </span>
                </>
              )}
            </span>

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
                    className={`relative overflow-hidden w-fit mx-auto p-4 rounded-3xl border-2 mb-3 animate-in zoom-in slide-in-from-bottom-4 duration-300 ${coreStyle.cardClass} ${adjustedScale} ${visual.glow}`}
                  >
                    <div className="flex flex-col items-center px-4 text-center">
                      <div
                        className={`badge-aura-wrapper ${coreStyle.auraClass} inline-flex items-center mb-1`}
                      >
                        <span
                          className={`text-[10px] px-2.5 py-0.5 font-black uppercase tracking-widest rounded-full border relative z-10 ${visualTierKey === 'LEGENDARY' ? 'text-yellow-700 border-yellow-500 bg-yellow-50' : `${coreStyle.color} ${coreStyle.bg} border-black/5`}`}
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
                            {formatPoints(resultAnim.bonus.amount).display}
                          </span>
                        </span>
                        <GemIcon size={20} />
                      </div>
                    </div>
                  </div>
                )
              })()}

            {resultAnim.win &&
              (() => {
                const type = resultAnim.confettiType ?? 'normal'

                if (type === 'fever') {
                  const colors = [
                    '#22c55e',
                    '#4ade80',
                    '#86efac',
                    '#16a34a',
                    '#bbf7d0',
                    '#15803d'
                  ]
                  return (
                    <div className="relative w-0 h-0">
                      {resultAnim.confetti?.map((c, i) => (
                        <div
                          key={i}
                          className="absolute rounded-sm pointer-events-none"
                          style={
                            {
                              width: `${i % 3 === 0 ? 9 : 6}px`,
                              height: `${i % 3 === 0 ? 11 : 8}px`,
                              left: `${c.leftOffset}px`,
                              top: 0,
                              backgroundColor: colors[i % colors.length],
                              boxShadow: `0 0 4px ${colors[i % colors.length]}`,
                              animation: `confetti-burst 1.2s ease-out ${c.delay}s forwards`,
                              '--vx': `${c.vx}px`,
                              '--vy': `${c.vy}px`
                            } as React.CSSProperties
                          }
                        />
                      ))}
                    </div>
                  )
                }

                if (type === 'inferno') {
                  const colors = [
                    '#f97316',
                    '#ef4444',
                    '#fbbf24',
                    '#fb923c',
                    '#dc2626',
                    '#fed7aa'
                  ]
                  return (
                    <div className="relative w-0 h-0">
                      {resultAnim.confetti?.map((c, i) => (
                        <div
                          key={i}
                          className="absolute rounded-sm pointer-events-none"
                          style={
                            {
                              width: `${i % 3 === 0 ? 9 : 6}px`,
                              height: `${i % 3 === 0 ? 11 : 8}px`,
                              left: `${c.leftOffset}px`,
                              top: 0,
                              backgroundColor: colors[i % colors.length],
                              boxShadow: `0 0 5px ${colors[i % colors.length]}`,
                              animation: `confetti-burst 1.2s ease-out ${c.delay}s forwards`,
                              '--vx': `${c.vx}px`,
                              '--vy': `${c.vy}px`
                            } as React.CSSProperties
                          }
                        />
                      ))}
                    </div>
                  )
                }

                if (['hellfire', 'lunar', 'electric', 'cards'].includes(type))
                  return null

                const colors = getConfettiColors(
                  resultAnim.bonus?.tier,
                  resultAnim.streakAfter
                )
                return (
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
                            backgroundColor: colors[i % colors.length],
                            animation: `confetti-burst 1.2s ease-out ${c.delay}s forwards`,
                            '--vx': `${c.vx}px`,
                            '--vy': `${c.vy}px`
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>
                )
              })()}
          </div>
        )}

        {/* Main Controls */}
        <div
          className={`bg-white rounded-xl border shadow-sm p-2 transition-all duration-500
        ${
          visualMode === 'flash_lunar'
            ? 'border-blue-200 lunar-ring'
            : visualMode === 'flash_electric'
              ? 'border-purple-400 electric-ring'
              : visualMode === 'flash_cards'
                ? 'border-yellow-400 cards-ring'
                : visualMode === 'flash_hellfire'
                  ? 'border-red-500 hellfire-ring'
                  : visualMode === 'inferno'
                    ? 'border-orange-400 inferno-ring'
                    : visualMode === 'fever'
                      ? 'border-green-400 fever-ring'
                      : 'border-gray-100'
        }`}
        >
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 shrink-0 min-w-31.25 sm:min-w-36.25">
                <div className="relative group flex items-center">
                  <div
                    className="flex items-center gap-2 cursor-pointer select-none"
                    onMouseEnter={() => {
                      if (!capped) setShowPointsExplainer(true)
                    }}
                    onMouseLeave={() => setShowPointsExplainer(false)}
                    onClick={() => {
                      if (!capped) setShowPointsExplainer(!showPointsExplainer)
                    }}
                  >
                    <GemIcon size={24} className="shrink-0" />
                    <span className="text-xl font-bold tabular-nums">
                      <span
                        className={getAmountColor(points)}
                        title={capped ? full : undefined}
                        style={{ position: 'relative' }}
                      >
                        {pointsLoaded ? animatedDisplay : '...'}
                      </span>
                    </span>
                  </div>
                  {shouldShowTooltip && (
                    <div className="absolute top-full mt-2 left-0 z-50 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 whitespace-nowrap">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        <span className={getAmountColor(points)}>
                          {numberName}
                        </span>
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

              {displayNickname && (
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="text-[10px] font-black text-gray-500 tracking-wider overflow-hidden whitespace-nowrap block min-w-0"
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

                  <div className="flex gap-1 sm:flex-row flex-row">
                    {/* Flash badge */}
                    {isFlash && (
                      <div
                        className={`relative overflow-hidden rounded-xl border-2 px-2 py-1.5 flex-[1.2]
                        ${
                          visualMode === 'flash_lunar'
                            ? 'bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 border-blue-300'
                            : visualMode === 'flash_electric'
                              ? 'bg-linear-to-br from-purple-950 via-violet-950 to-purple-950 border-purple-400'
                              : visualMode === 'flash_cards'
                                ? 'bg-linear-to-br from-yellow-950 via-amber-950 to-yellow-950 border-yellow-400'
                                : 'bg-linear-to-br from-red-950 via-rose-950 to-red-950 border-red-500'
                        }`}
                        style={{
                          animation:
                            'fever-badge-in 0.4s cubic-bezier(.34,1.56,.64,1) both'
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-base leading-none">
                              {visualMode === 'flash_lunar'
                                ? '🌙'
                                : visualMode === 'flash_electric'
                                  ? '⚡'
                                  : visualMode === 'flash_cards'
                                    ? '🃏'
                                    : '🔥'}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest leading-none
                            ${
                              visualMode === 'flash_lunar'
                                ? 'lunar-badge-text'
                                : visualMode === 'flash_electric'
                                  ? 'electric-badge-text'
                                  : visualMode === 'flash_cards'
                                    ? 'cards-badge-text'
                                    : 'text-red-300 streak-fire-text'
                            }`}
                              style={{
                                isolation: 'isolate',
                                display: 'inline-block'
                              }}
                            >
                              {visualMode === 'flash_lunar'
                                ? "MOON'S BLESSING"
                                : visualMode === 'flash_electric'
                                  ? 'ELECTRIC SURGE'
                                  : visualMode === 'flash_cards'
                                    ? 'LUCK IN THE CARD'
                                    : 'HELLFIRE EVENT'}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-black px-1 py-0.5 rounded-full shrink-0
                            ${visualMode === 'flash_lunar' ? 'bg-blue-900 text-blue-200' : visualMode === 'flash_electric' ? 'bg-purple-900 text-purple-200' : visualMode === 'flash_cards' ? 'bg-yellow-900 text-yellow-200' : 'bg-red-900 text-red-200'}`}
                          >
                            {flashBuffRemaining} LEFT
                          </span>
                        </div>

                        {/* Bottom row — cards gets special text */}
                        <div className="flex items-center justify-between mt-1">
                          {visualMode === 'flash_cards' ? (
                            <>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">
                                100% WIN
                              </span>
                              <span className="text-[9px] font-black cards-badge-text">
                                LEG BNS
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">
                                100% WIN
                              </span>
                              <span
                                className={`text-[9px] font-black
                              ${
                                visualMode === 'flash_lunar'
                                  ? 'text-blue-300'
                                  : visualMode === 'flash_electric'
                                    ? 'text-purple-300'
                                    : 'text-red-300'
                              }`}
                              >
                                x5 MULT
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Streak badge */}
                    {winStreak >= 3 && (
                      <div
                        className={`relative overflow-hidden rounded-xl border-2 px-2 py-1.5 flex-1
                      ${
                        winStreak >= 5
                          ? 'bg-linear-to-br from-orange-950 via-red-950 to-orange-950 border-orange-500'
                          : 'bg-linear-to-br from-green-950 via-emerald-950 to-green-950 border-green-500'
                      }`}
                        style={{
                          animation:
                            'fever-badge-in 0.4s cubic-bezier(.34,1.56,.64,1) both'
                        }}
                      >
                        <div
                          className="absolute inset-0 opacity-20 pointer-events-none"
                          style={{
                            background: isInferno
                              ? 'linear-gradient(90deg, transparent, rgba(249,115,22,0.4), transparent) 0 0 / 200% auto'
                              : 'linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent) 0 0 / 200% auto',
                            animation: 'streak-shimmer 2s linear infinite'
                          }}
                        />
                        <div className="relative z-10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-base leading-none">
                              {isInferno ? '🔥' : '⚡'}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest leading-none max-[350px]:tracking-tighter ${isInferno ? 'inferno-shimmer-text' : 'streak-shimmer-text'}`}
                            >
                              {isInferno ? 'INFERNO MODE' : 'FEVER TIME'}
                            </span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {[3, 4, 5].map((threshold) => (
                              <div
                                key={threshold}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                  winStreak >= threshold
                                    ? threshold === 5
                                      ? 'bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,1)]'
                                      : 'bg-green-400 shadow-[0_0_6px_rgba(34,197,94,1)]'
                                    : 'bg-gray-700 opacity-40'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Bottom row: Aligned with Flash badge row */}
                        <div className="relative z-10 flex items-center justify-between mt-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">
                            {winStreak} STREAK
                          </span>
                          <span
                            className={`text-[9px] font-black ${isInferno ? 'text-orange-400' : 'text-green-400'}`}
                          >
                            x{streakMult} MULT
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleSound}
              className="shrink-0 p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition shadow-sm"
              title="Toggle sound effects"
            >
              <SoundIcon muted={!soundOn} />
            </button>
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
                  value={
                    isFocused ? inputString : formatPoints(betAmount).display
                  }
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
                    ({formatPoints(betAmount).display})
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
                className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg active:scale-95 transition-all shadow-sm
                ${
                  visualMode === 'flash_lunar'
                    ? 'lunar-btn'
                    : visualMode === 'flash_electric'
                      ? 'electric-btn'
                      : visualMode === 'flash_cards'
                        ? 'cards-btn'
                        : visualMode === 'flash_hellfire'
                          ? 'flash-hellfire-btn'
                          : visualMode === 'inferno'
                            ? 'inferno-btn'
                            : visualMode === 'fever'
                              ? 'fever-btn'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {visualMode === 'flash_lunar'
                  ? '🌙 ALL IN'
                  : visualMode === 'flash_electric'
                    ? '⚡ ALL IN'
                    : visualMode === 'flash_cards'
                      ? '🃏 ALL IN'
                      : visualMode === 'flash_hellfire'
                        ? '🔥 ALL IN'
                        : visualMode === 'inferno'
                          ? '🔥 ALL IN'
                          : visualMode === 'fever'
                            ? '⚡ ALL IN'
                            : 'ALL IN'}
              </button>
              <button
                onClick={() => setAutoAllIn((prev) => !prev)}
                className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg active:scale-95 transition-all shadow-sm
                ${
                  visualMode === 'flash_lunar'
                    ? 'lunar-btn'
                    : visualMode === 'flash_electric'
                      ? 'electric-btn'
                      : visualMode === 'flash_cards'
                        ? 'cards-btn'
                        : visualMode === 'flash_hellfire'
                          ? 'flash-hellfire-btn'
                          : visualMode === 'inferno'
                            ? 'inferno-btn'
                            : visualMode === 'fever'
                              ? 'fever-btn'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {visualMode === 'flash_lunar'
                  ? `🌙 AUTO ${autoAllIn ? 'ON' : 'OFF'}`
                  : visualMode === 'flash_electric'
                    ? `⚡ AUTO ${autoAllIn ? 'ON' : 'OFF'}`
                    : visualMode === 'flash_cards'
                      ? `🃏 AUTO ${autoAllIn ? 'ON' : 'OFF'}`
                      : visualMode === 'flash_hellfire'
                        ? `🔥 AUTO ${autoAllIn ? 'ON' : 'OFF'}`
                        : visualMode === 'inferno'
                          ? `🔥 AUTO ${autoAllIn ? 'ON' : 'OFF'}`
                          : visualMode === 'fever'
                            ? `⚡ AUTO ${autoAllIn ? 'ON' : 'OFF'}`
                            : `AUTO ${autoAllIn ? 'ON' : 'OFF'}`}
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
                    className={`text-[11px] font-black uppercase tracking-widest leading-tight ${notification === 'no_bigint' ? 'text-red-700' : 'text-indigo-700'}`}
                  >
                    {notification === 'no_bigint'
                      ? 'Browser Not Supported'
                      : "You've been granted 200,000 points!"}
                  </span>
                  <p
                    className={`text-[10px] font-medium leading-snug ${notification === 'no_bigint' ? 'text-red-600' : 'text-indigo-500'}`}
                  >
                    {notification === 'no_bigint'
                      ? 'RPS League requires a modern browser for Vigintillion-scale math. Please update your browser or OS.'
                      : 'Start betting to rank up the leaderboard. No login needed, your progress is saved automatically.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (notification === 'new_visitor')
                    localStorage.setItem('rps_welcomed', '1')
                  setNotification(null)
                }}
                className={`flex-none p-1.5 rounded-lg transition-colors shrink-0 ${notification === 'no_bigint' ? 'text-red-400 hover:text-red-700 hover:bg-red-100' : 'text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100'}`}
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
              <span className="bg-gray-100 hover:bg-gray-200 text-purple-600 text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md transition-colors tracking-tighter">
                BONUS INFO
              </span>
            </div>
            {showBonusExplainer && (
              <div className="absolute bottom-full -right-1 mb-3 z-50 p-3 bg-white border border-gray-100 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 w-48 sm:w-56">
                <div className="flex flex-col gap-3">
                  {/* Section 1: Random Tiered Bonuses */}
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
                  </div>

                  {/* Section 2: Performance Win Streaks */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">
                      Win Streaks
                    </span>
                    <ul className="text-[9px] text-gray-600 space-y-1 list-disc pl-3">
                      <li>
                        <span className="font-bold text-gray-800">
                          3x / 6x / 10x
                        </span>{' '}
                        multiplier
                      </li>
                      <li>
                        Triggers at{' '}
                        <span className="font-bold text-gray-800">
                          3 / 4 / 5+
                        </span>{' '}
                        consecutive wins
                      </li>
                    </ul>
                  </div>
                </div>
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
                  winStreak={winStreak}
                  visualMode={visualMode}
                />
              ))}
            <MatchList
              matches={matches}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              predictions={predictions}
              winStreak={winStreak}
              visualMode={visualMode}
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
