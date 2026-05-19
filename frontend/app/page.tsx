'use client'

import { useEffect, useCallback, useRef } from 'react'
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
import InfoIcon from '@/components/icons/InfoIcon'
import CloseIcon from '@/components/icons/CloseIcon'
import ChevronUpIcon from '@/components/icons/ChevronUpIcon'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { getOrCreateUser, isUserValid } from '@/lib/user'
import type { Match, PendingMatch, ResultAnim, EventTheme } from '@/types/rps'
import {
  formatPoints,
  getAmountColor,
  getFullNumberName,
  parseShorthand
} from '@/lib/format'
import { useSound } from '@/hooks/useSound'
import SoundIcon from '@/components/icons/SoundIcon'
import LiveStatsTicker from '@/components/LiveStatTicker'
import { useAnimatedBigInt } from '@/hooks/useAnimatedBigInt'
import EdgeGlow from '@/components/overlays/EdgeGlow'
import ConfettiOverlay from '@/components/overlays/ConfettiOverlay'
import ResultAnimOverlay from '@/components/overlays/ResultAnimOverlay'
import FlashBadge from '@/components/badges/FlashBadge'
import StreakBadge from '@/components/badges/StreakBadge'
import ModeButton from '@/components/ModeButton'
import BonusExplainerPopover from '@/components/BonusExplainerPopover'
import { useGameStore } from './stores/gameStore'
import { useUserStore } from './stores/userStore'
import { useUIStore } from './stores/uiStore'
import { useTabGuard } from '@/hooks/useTabGuard'
import WelcomeModal from '@/components/WelcomeModal'
import { logger } from '@/lib/logger'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function HomePage() {
  // - Game store -
  const {
    backendReady,
    markReady,
    pendingMatches,
    addPendingMatch,
    removePendingMatch,
    predictions,
    setPrediction,
    updatePrediction,
    deletePrediction,
    activeFlashEvent,
    setActiveFlashEvent,
    flashBuffRemaining,
    setFlashBuffRemaining,
    decrementFlashBuff,
    serverOffset,
    setServerOffset,
    now,
    tickNow,
    setVisualMode,
    setLiveTheme
  } = useGameStore()

  // - User store -
  const {
    points,
    pointsLoaded,
    betAmount,
    setBetAmount,
    autoAllIn,
    setAutoAllIn,
    isHydrated,
    winStreak,
    setWinStreak,
    streakMult,
    setStreakMult,
    displayNickname,
    dailyRank,
    setDailyRank,
    applyPointsUpdate
  } = useUserStore()

  // - UI store -
  const {
    resultAnim,
    setResultAnim,
    clearResultAnim,
    notification,
    setNotification,
    errorMessage,
    triggerError,
    showJumpButton,
    setShowJumpButton,
    showPointsInfo,
    setShowPointsInfo,
    showPointsExplainer,
    setShowPointsExplainer,
    isFocused,
    setIsFocused,
    inputString,
    setInputString,
    persistentError,
    setPersistentError,
    showWelcomeModal,
    setShowWelcomeModal
  } = useUIStore()

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

  const esRef = useRef<EventSource | null>(null)

  const isDuplicate = useTabGuard(() => {
    esRef.current?.close()
  })

  const lastPacketRef = useRef(Date.now())
  const isOffline = typeof window !== 'undefined' && !navigator.onLine
  const isStreamStale = now - lastPacketRef.current > 10000
  const showConnectionWarning =
    backendReady &&
    !isDuplicate &&
    !persistentError &&
    (isOffline || isStreamStale)

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

  // now ticker
  useEffect(() => {
    const timer = setInterval(tickNow, 100)
    return () => clearInterval(timer)
  }, [tickNow])

  // scroll-to-top button
  useEffect(() => {
    const handleScroll = () => setShowJumpButton(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [setShowJumpButton])

  // localStorage
  useEffect(() => {
    const saved = localStorage.getItem('autoAllIn')
    if (saved === 'false') setAutoAllIn(false)

    if (typeof BigInt === 'undefined') {
      setNotification('no_bigint')
      return
    }
    if (!localStorage.getItem('rps_welcomed')) {
      setShowWelcomeModal(true)
    }
  }, [setAutoAllIn, setNotification, setShowWelcomeModal])

  useEffect(() => {
    if (isHydrated) localStorage.setItem('autoAllIn', autoAllIn.toString())
  }, [autoAllIn, isHydrated])

  // auto all-in sync
  useEffect(() => {
    if (isHydrated && autoAllIn) {
      setBetAmount(points)
      if (!isFocused) setInputString(points.toString())
    }
  }, [autoAllIn, points, isHydrated, isFocused, setBetAmount, setInputString])

  useEffect(() => {
    if (isHydrated && !autoAllIn) {
      const floor = 100000n
      const resetTo = points < floor ? points : floor
      setBetAmount(resetTo)
      if (!isFocused) setInputString(resetTo.toString())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAllIn, isHydrated])

  const fetchFn = useCallback((page: number) => fetchLatestMatches(page), [])
  const { matches, setMatches, hasMore, isLoadingMore, loadMatches } =
    useInfiniteScroll({ fetchFn })

  const animatedPoints = useAnimatedBigInt(points, 1000)
  const { full, capped } = formatPoints(points)
  const { display: animatedDisplay } = formatPoints(animatedPoints)
  const animatedResult = useAnimatedBigInt(resultAnim?.amount ?? 0n, 600, true)

  // initial data fetch
  useEffect(() => {
    const user = getOrCreateUser()
    if (!isUserValid(user)) return

    fetch(`${API_BASE}/api/live/flash-state?userId=${user.userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.type) {
          setActiveFlashEvent(data.type)
          setFlashBuffRemaining(data.betsRemaining)
          setLiveTheme(data.type as EventTheme)
        }
      })
      .catch((err) => {
        logger.warn('Failed to fetch flash state', {
          userId: user.userId,
          error: String(err)
        })
      })

    fetch(`${API_BASE}/api/live/flash-state`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.type) {
          setActiveFlashEvent(data.type)
          setFlashBuffRemaining(data.betsRemaining)
        }
      })
      .catch((err) => {
        logger.warn('Failed to fetch flash state (global)', {
          error: String(err)
        })
      })

    fetchLatestMatches(1).then((data) => {
      if (data && data.matches.length > 0) markReady()
      loadMatches(1)
    })

    fetchPendingMatches()
      .then((data) => {
        if (!data) return
        const { pendingMatches: existing } = useGameStore.getState()
        const existingIds = new Set(existing.map((p) => p.gameId))
        const fresh = data.filter((m) => !existingIds.has(m.gameId))
        if (fresh.length > 0) {
          markReady()
          fresh.forEach(addPendingMatch)
        }
      })
      .catch((err) => {
        logger.error('Failed to fetch pending matches', err)
        triggerError('LIVE FEED ERROR')
      })

    fetchUnifiedLeaderboard('daily')
      .then((data) => {
        const idx = data.findIndex((e) => e.shortId === user.shortId)
        setDailyRank(idx !== -1 ? idx + 1 : null)
      })
      .catch((err) => {
        logger.error('Failed to fetch leaderboard rank', err)
      })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMatches])

  const fetchUpdatedPoints = useCallback(async (): Promise<{
    newPoints: bigint
    isNewPeak: boolean
  }> => {
    const user = getOrCreateUser()
    const { points: currentPoints, peakPoints: currentPeak } =
      useUserStore.getState()
    if (!isUserValid(user))
      return { newPoints: currentPoints, isNewPeak: false }

    const data = await fetchUserPoints(user.userId, user.shortId)
    if (!data) {
      logger.warn('fetchUserPoints returned null', { userId: user.userId })
      return { newPoints: currentPoints, isNewPeak: false }
    }

    const newPoints = BigInt(data.points)
    const newPeak = BigInt(data.peakPoints)
    const isNewPeak = newPeak > currentPeak

    applyPointsUpdate(newPoints, newPeak)

    // keep inputString in sync
    const { autoAllIn: aa, betAmount: ba } = useUserStore.getState()
    if (aa || ba > newPoints) setInputString(newPoints.toString())

    return { newPoints, isNewPeak }
  }, [applyPointsUpdate, setInputString])

  // SSE live stream
  useEffect(() => {
    if (isDuplicate) return
    const es = new EventSource(`${API_BASE}/api/live`)
    esRef.current = es

    es.addEventListener('sync', (event) => {
      const { serverTime } = JSON.parse(event.data)
      setServerOffset(serverTime - Date.now())
      setPersistentError(null)
    })

    es.addEventListener('pending', (event) => {
      const pending: PendingMatch = JSON.parse(event.data)
      lastPacketRef.current = Date.now()
      addPendingMatch(pending)

      const { serverOffset: offset } = useGameStore.getState()
      const timeoutMs = pending.expiresAt - (Date.now() + offset) + 5000
      setTimeout(
        () => removePendingMatch(pending.gameId),
        Math.max(5000, timeoutMs)
      )
      markReady()
    })

    es.addEventListener('prediction_result', (event) => {
      const data = JSON.parse(event.data)
      const { userId } = getOrCreateUser()
      if (data.userId !== userId) return

      const isWin = data.result === 'WIN'
      const { activeFlashEvent: currentFlash } = useGameStore.getState()

      if (isWin) {
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

        fetchUpdatedPoints()
        setResultAnim({
          win: true,
          amount: BigInt(data.amount),
          bonus,
          streakAfter: currentStreak,
          confettiType: capturedConfettiType,
          confetti: Array.from({ length: 100 }).map(() => ({
            leftOffset: Math.random() * 100 - 50,
            vx: (Math.random() - 0.5) * 300,
            vy: -(Math.random() * 200 + 100),
            delay: Math.random() * 0.2
          }))
        } as ResultAnim)
      } else {
        playLoss()
        const bonus = data.bonus
          ? { ...data.bonus, amount: BigInt(data.bonus.amount) }
          : null
        const { points: pointsBefore } = useUserStore.getState()
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
          } as ResultAnim)
        })
      }

      setWinStreak(data.streakAfter ?? 0)
      setStreakMult(data.streakMult ?? 1)

      if (currentFlash) {
        decrementFlashBuff()
        const { flashBuffRemaining: remaining } = useGameStore.getState()
        if (remaining <= 0) setLiveTheme(null)
      }

      setTimeout(
        () => clearResultAnim(),
        data.bonus?.tier === 'LEGENDARY' ? 3000 : 2000
      )

      const { predictions: preds } = useGameStore.getState()
      const existing = preds.get(data.gameId)
      if (existing) {
        updatePrediction(data.gameId, { result: isWin ? 'WIN' : 'LOSE' })
      }
    })

    es.addEventListener('result', (event) => {
      const match: Match = JSON.parse(event.data)
      lastPacketRef.current = Date.now()
      removePendingMatch(match.gameId)
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
      setFlashBuffRemaining(data.betsRemaining)
      setLiveTheme(data.type as EventTheme)
    })

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        logger.error(
          'SSE connection closed (too many players or server drop)',
          undefined,
          {
            readyState: es.readyState,
            url: `${API_BASE}/api/live`
          }
        )
        setPersistentError('TOO MANY PLAYERS - TRY AGAIN IN A MOMENT')
      } else {
        logger.warn('SSE connection error (will retry)', {
          readyState: es.readyState
        })
      }
    }

    return () => {
      es.close()
      esRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDuplicate])

  const handlePick = async (gameId: string, playerName: string) => {
    const user = getOrCreateUser()
    const { betAmount: currentBet } = useUserStore.getState()
    if (!isUserValid(user) || !user.nickname || currentBet <= 0n) return

    if (notification === 'new_visitor') {
      localStorage.setItem('rps_welcomed', '1')
      setNotification(null)
    }

    setPrediction(gameId, { gameId, pick: playerName, confirmed: false })

    let succeeded = false
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const { ok, data } = await postPrediction(
        {
          userId: user.userId,
          gameId,
          pick: playerName,
          betAmount: currentBet.toString(),
          nickname: user.nickname,
          shortId: user.shortId
        },
        controller.signal
      )

      clearTimeout(timeout)

      if (ok && data?.success === true) {
        succeeded = true
        updatePrediction(gameId, { confirmed: true })
      } else {
        triggerError(data?.error || 'MATCH ALREADY ENDED')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        logger.warn('Prediction POST aborted (timeout)', { gameId, playerName })
        triggerError('CONNECTION TOO SLOW')
      } else {
        logger.error(
          'Prediction POST failed',
          err instanceof Error ? err : undefined,
          { gameId, playerName }
        )
        triggerError('CONNECTION FAILED')
      }
    } finally {
      if (!succeeded) deletePrediction(gameId)
    }
  }

  const handleWelcomeContinue = () => {
    localStorage.setItem('rps_welcomed', '1')
    setShowWelcomeModal(false)
    setNotification('new_visitor')
  }

  const numberName = pointsLoaded ? getFullNumberName(points) : ''
  const shouldShowTooltip =
    showPointsExplainer && numberName && numberName !== 'Points'

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      {showWelcomeModal && <WelcomeModal onContinue={handleWelcomeContinue} />}

      <EdgeGlow visualMode={visualMode} />

      <div className="relative">
        <ConfettiOverlay
          confettiType={resultAnim?.confettiType ?? 'normal'}
          show={resultAnim?.win === true}
        />

        <ResultAnimOverlay
          resultAnim={resultAnim}
          streakMult={streakMult}
          animatedResult={animatedResult}
        />

        <div
          className={`bg-white rounded-xl border shadow-sm p-2 transition-all duration-500 ${
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
          {/* Top section */}
          <div className="mb-1">
            {/* Row 1: points + mute */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                {/* Points display */}
                <div className="flex items-center gap-2">
                  <div className="relative group flex items-center">
                    <div
                      className="flex items-center gap-2 cursor-pointer select-none"
                      onMouseEnter={() => {
                        if (!capped) setShowPointsExplainer(true)
                      }}
                      onMouseLeave={() => setShowPointsExplainer(false)}
                      onClick={() => {
                        if (!capped)
                          setShowPointsExplainer(!showPointsExplainer)
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
                      <InfoIcon />
                    </button>
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-70 sm:w-56 p-3 bg-gray-900 text-white text-[10px] sm:text-xs font-medium rounded-lg shadow-xl transition-opacity duration-200 z-50 text-center tracking-wide leading-relaxed ${showPointsInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'} sm:group-hover:opacity-100`}
                    >
                      Virtual simulation points. No real-world currency or
                      value.
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-gray-900" />
                    </div>
                  </div>
                </div>

                {/* Nickname + rank */}
                {displayNickname && (
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
                )}
              </div>

              {/* Mute - top right, doesn't affect badge row */}
              <button
                onClick={toggleSound}
                className="shrink-0 p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition shadow-sm"
                title="Toggle sound effects"
              >
                <SoundIcon muted={!soundOn} />
              </button>
            </div>

            {/* Row 2: badges - fully separate row, full width, no mute competition */}
            {displayNickname && (
              <div className="flex gap-1 mt-1 max-w-sm">
                <FlashBadge
                  visualMode={visualMode}
                  flashBuffRemaining={flashBuffRemaining}
                />
                <StreakBadge winStreak={winStreak} streakMult={streakMult} />
              </div>
            )}
          </div>

          {/* Bet input row */}
          <div className="flex flex-col sm:flex-row gap-1">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs font-bold text-gray-400 uppercase shrink-0">
                Amount
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
                      setBetAmount(parsed > points ? points : parsed)
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
                  className={`relative overflow-hidden w-full mx-auto p-4 border border-gray-200 rounded-lg pl-3 pr-16 py-2.5 font-bold text-gray-800 focus:ring-2 focus:ring-purple-300 transition-all ${isFocused && inputString.length > 20 ? 'text-[10px] font-mono' : 'text-sm'}`}
                />
                {isFocused && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400 pointer-events-none">
                    ({formatPoints(betAmount).display})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ModeButton
                visualMode={visualMode}
                label="ALL IN"
                onClick={() => {
                  setBetAmount(points)
                  setInputString(points.toString())
                }}
              />
              <ModeButton
                visualMode={visualMode}
                label={`AUTO ${autoAllIn ? 'ON' : 'OFF'}`}
                onClick={() => setAutoAllIn(!autoAllIn)}
              />
            </div>
          </div>

          {/* Notification banner */}
          {notification && isHydrated && (
            <div
              className={`mt-3 flex items-start justify-between gap-3 rounded-xl px-4 py-3 border animate-in fade-in slide-in-from-top-2 duration-400 ${notification === 'no_bigint' ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-200'}`}
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
                      : 'Start making predictions to climb the leaderboard.'}
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
                <CloseIcon />
              </button>
            </div>
          )}
        </div>
      </div>

      <LiveStatsTicker />

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-in fade-in duration-200">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <p className="text-xs font-bold text-red-900 uppercase">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Rules bar */}
      <div className="flex flex-row items-center justify-between mb-1 gap-1 px-1">
        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-cyan-600 font-bold uppercase tracking-tight whitespace-nowrap">
          <p>PTS FLOOR: 100K</p>
          <p className="text-indigo-400/90">No Ties</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-bold whitespace-nowrap">
          <span className="text-green-600">WIN: +100%</span>
          <BonusExplainerPopover />
        </div>
      </div>

      {/* Match feed */}
      <div className="min-h-[60vh]">
        {!backendReady ? (
          <div className="text-center py-20 animate-pulse text-gray-400 text-sm">
            Connecting to live stream…
          </div>
        ) : (
          <>
            {persistentError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <p className="text-xs font-bold text-red-900 uppercase">
                  {persistentError}
                </p>
              </div>
            )}

            {isDuplicate && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <p className="text-xs font-bold text-amber-900 uppercase">
                  RPS League is open in another tab. Close this tab to continue.
                </p>
              </div>
            )}

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

      {/* Scroll-to-top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-25 right-4 z-40 bg-indigo-600 text-white p-3 rounded-full shadow-2xl transition-all duration-300 ${showJumpButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <ChevronUpIcon />
      </button>
    </div>
  )
}
