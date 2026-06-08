'use client'

import { useEffect, useCallback, useRef } from 'react'
import {
  fetchLatestMatches,
  fetchPendingMatches,
  fetchUserPoints,
  postPrediction,
  fetchUnifiedLeaderboard,
  ascendUser,
  fetchOracleState,
  fetchGlobalFlashState,
  fetchIdleEligibility,
  fetchUserFlashState,
  fetchFestivalState,
  postFestivalParticipated
} from '@/lib/api'
import MatchList from '@/components/MatchList'
import PendingMatchCard from '@/components/PendingMatchCard'
import GemIcon from '@/components/icons/GemIcon'
import InfoIcon from '@/components/icons/InfoIcon'
import CloseIcon from '@/components/icons/CloseIcon'
import ChevronUpIcon from '@/components/icons/ChevronUpIcon'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { getOrCreateUser, isUserValid } from '@/lib/user'
import type { Match, PendingMatch, ResultAnim, EventTheme, FestivalModeKey, VisualMode, FestivalSSEData } from '@/types/rps'
import {
  formatPoints,
  getDisplayTierClass,
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
import WelcomeModal from '@/components/modals/WelcomeModal'
import { logger } from '@/lib/logger'
import UpdateModal from '@/components/modals/UpdateModal'
import { oracleTemplates } from '@/lib/oracleTemplates'
import AscensionModal from '@/components/modals/AscensionModal'
import { ASCENSION_THRESHOLD } from '@/lib/constants'
import { CURRENT_VERSION } from '@/lib/updates'
import { useIdleStore } from './stores/idleStore'
import { useIdleBet } from '@/hooks/useIdleBet'
import IdleBetControls from '@/components/IdleBetControls'
import FestivalTicker from '@/components/FestivalTicker'
import GlobalTickerWrapper from '@/components/GlobalTickerWrapper'
import AchievementToast from '@/components/AchievementToast'
import RelicSlot from '@/components/RelicSlot'
import RelicDrawer from '@/components/RelicDrawer'
import RelicDropPopup from '@/components/RelicDropPopup'
import { useRelicStore } from './stores/relicStore'
import { slamState } from '@/lib/slamState'
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
    setLiveTheme,
    oracleSide,
    setOracleSide,
    setActiveFestival,
    festivalModeKey
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
    applyPointsUpdate,
    stylePreference,
    laps,
    setLaps,
    setFastestLapBets
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
    setShowWelcomeModal,
    showUpdateModal,
    setShowUpdateModal,
    showAscensionPrompt,
    setShowAscensionPrompt,
    setOracleTickerMessage
  } = useUIStore()

  const { setEligible, setHasInteractedWithIdle } = useIdleStore()
  useIdleBet()

  const {
    playWin,
    playLoss,
    playCards,
    playElectric,
    playFire,
    playMoon,
    playFanfare,
    soundOn,
    toggleSound,
  } = useSound()

  const esRef = useRef<EventSource | null>(null)
  const clearAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const getVisualMode = (
    flash: string | null,
    festival: FestivalModeKey | null,
    streak: number
  ): VisualMode => {
    if (flash === 'LUNAR') return 'flash_lunar'
    if (flash === 'ELECTRIC') return 'flash_electric'
    if (flash === 'CARDS') return 'flash_cards'
    if (flash === 'HELLFIRE') return 'flash_hellfire'

    if (festival) return festival

    if (streak >= 5) return 'winstreak_inferno'
    if (streak >= 3) return 'winstreak_fever'

    return null
  }

  const visualMode = getVisualMode(activeFlashEvent, festivalModeKey, winStreak)

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
    const welcomed = localStorage.getItem('rps_welcomed')
    const lastSeenVersion = localStorage.getItem('rps_last_version')

    if (!welcomed) {
      setShowWelcomeModal(true)
    } else if (lastSeenVersion !== CURRENT_VERSION) {
      setShowUpdateModal(true)
    }

    if (typeof BigInt === 'undefined') {
      setNotification('no_bigint')
    }

    const params = new URLSearchParams(window.location.search)
    let utmSource = params.get('utm_source')

    if (utmSource) {
      localStorage.setItem('rps_utm_source', utmSource)
    } else {
      utmSource = localStorage.getItem('rps_utm_source')
    }

    if (utmSource) {
      sessionStorage.setItem('utm_source', utmSource)
    }
  }, [setNotification, setShowUpdateModal, setShowWelcomeModal])

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

    fetchUserFlashState(user.userId)
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

    useRelicStore.getState().initRelics()

    fetchGlobalFlashState()
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

    fetchOracleState(user.userId)
      .then((data) => {
        const alreadyWelcomed = !!localStorage.getItem('rps_welcomed')
        if (!alreadyWelcomed) return

        if (data && !data.used) {
          setOracleSide(data.side)
          setNotification('oracle')

          // Oracle ticker - scrolls for 5s above points balance
          const dayIndex = new Date().getUTCDate() % oracleTemplates.length
          const template = oracleTemplates[dayIndex](data.side)

          setOracleTickerMessage({
            id: `oracle-${Date.now()}`,
            content: (
              <span>
                {template.prefix}{' '}
                <span
                  className="font-black uppercase"
                  style={{ color: '#a855f7' }}
                >
                  {data.side === 'left' ? 'LEFT' : 'RIGHT'}
                </span>{' '}
                {template.suffix}
              </span>
            ),
            accentColor: '#a855f7',
            durationMs: 10_000
          })
        }
      })
      .catch(() => {})

    fetchIdleEligibility(user.userId)
      .then((data) => {
        if (data?.eligible) setEligible(true)
      })
      .catch(() => {})

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

    fetchFestivalState()
      .then((data) => {
        if (data?.festival) {
          setActiveFestival(data.festival.type, data.festival.endsAt)
        }
      })
      .catch(() => {})

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

    const { ascensionDeclinedThisSession } = useUIStore.getState()
    if (
      newPoints >= ASCENSION_THRESHOLD &&
      !showAscensionPrompt &&
      !ascensionDeclinedThisSession
    ) {
      setShowAscensionPrompt(true)
    }

    return { newPoints, isNewPeak }
  }, [
    applyPointsUpdate,
    setInputString,
    showAscensionPrompt,
    setShowAscensionPrompt
  ])

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
        const { points: currentPoints } = useUserStore.getState()
        const winAmt = BigInt(data.amount)
        const isAscendingWin =
          currentPoints < ASCENSION_THRESHOLD &&
          currentPoints + winAmt >= ASCENSION_THRESHOLD

        if (isAscendingWin) playFanfare()
        else if (currentFlash === 'LUNAR') playMoon()
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
        if (data.soulProc || data.kineticFired) {
          slamState.active = true
        }
        setResultAnim({
          win: true,
          amount: BigInt(data.amount),
          bonus,
          streakAfter: currentStreak,
          confettiType: capturedConfettiType,
          flashMult: data.flashMult,
          flashEventType: data.flashEventType,
          ghostEchoAmount: data.ghostEchoAmount
            ? BigInt(data.ghostEchoAmount)
            : null,
          soulProc: data.soulProc ?? false,
          kineticFired: data.kineticFired ?? false,
          preSoulAmount: data.preSoulAmount
            ? BigInt(data.preSoulAmount)
            : BigInt(data.amount),
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
      if (data.relicDrop) {
        useRelicStore.getState().pushToDropQueue(data.relicDrop)
      }
      setStreakMult(data.streakMult ?? 1)

      if (currentFlash) {
        decrementFlashBuff()
        const { flashBuffRemaining: remaining } = useGameStore.getState()
        if (remaining <= 0) setLiveTheme(null)
      }

      if (clearAnimTimerRef.current) clearTimeout(clearAnimTimerRef.current)
      clearAnimTimerRef.current = setTimeout(
        () => clearResultAnim(),
        data.soulProc || data.kineticFired
          ? 7000
          : data.bonus?.tier === 'LEGENDARY' || data.bonus?.tier === 'MYTHICAL'
            ? 3000
            : 2000
      )
      if (data.relicCounter !== undefined) {
        useRelicStore.getState().updateRelicCounter(data.relicCounter)
      }
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
      useGameStore.getState().setFlashExpiresAt(null)
    })

    es.addEventListener('festival_event', (event: MessageEvent) => {
      const data: FestivalSSEData = JSON.parse(event.data)
      const { userId } = getOrCreateUser()
      // Track participation for achievement counting
      postFestivalParticipated(userId).catch(() => {})
      const { activeFlashEvent, setFlashExpiresAt } = useGameStore.getState()

      const clientEndsAt = Date.now() + data.durationMs
      setActiveFestival(data.type, clientEndsAt)

      if (data.type === 'SPARK') {
        const typeToSet =
          (activeFlashEvent as string | null) || data.flashType || 'ELECTRIC'
        setActiveFlashEvent(typeToSet)
        setFlashBuffRemaining(3)
        setLiveTheme(typeToSet as EventTheme)
        setFlashExpiresAt(clientEndsAt)
      }

      const FESTIVAL_COLORS: Record<string, string> = {
        SPARK: '#a855f7',
        GHOST: '#4dd0c4',
        SAFEGUARD: '#94a3b8',
        RESONANCE: '#ecc94b',
        SURGE: '#22d3ee',
        VAULT: '#748ffc',
        FEVER: '#f97316',
        SANGUINE: '#991b1b'
      }

      setOracleTickerMessage({
        id: `festival-${data.type}-${Date.now()}`,
        content: data.message,
        accentColor: FESTIVAL_COLORS[data.type] ?? '#a855f7',
        durationMs: 5000
      })
    })

    es.addEventListener('achievement_unlocked', (event) => {
      const data = JSON.parse(event.data)
      const { userId } = getOrCreateUser()
      if (data.userId !== userId) return

      useGameStore.getState().pushAchievement({
        code: data.code,
        name: data.name,
        icon: data.icon,
        rarity: data.rarity
      })

      useUserStore.getState().refreshBadges()
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

    setPrediction(gameId, {
      gameId,
      pick: playerName,
      confirmed: false,
      totalMultiplier: 1
    })

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
        if (notification === 'oracle') {
          setNotification(null)
          setOracleSide(null)
        }
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
    localStorage.setItem('rps_last_version', CURRENT_VERSION)
    setShowWelcomeModal(false)
    setNotification('new_visitor')
  }

  const handleUpdateClose = () => {
    localStorage.setItem('rps_last_version', CURRENT_VERSION)
    setShowUpdateModal(false)
  }

  const numberName = pointsLoaded ? getFullNumberName(points) : ''
  const shouldShowTooltip =
    showPointsExplainer && numberName && numberName !== 'Points'

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      {showWelcomeModal && <WelcomeModal onContinue={handleWelcomeContinue} />}
      {showUpdateModal && <UpdateModal onClose={handleUpdateClose} />}

      <GlobalTickerWrapper />

      <EdgeGlow visualMode={visualMode} />

      <div className="relative">
        <ConfettiOverlay
          confettiType={resultAnim?.confettiType ?? 'normal'}
          show={resultAnim?.win === true}
        />
        <AchievementToast />
        {showAscensionPrompt && (
          <AscensionModal
            laps={laps}
            onAscend={async () => {
              const user = getOrCreateUser()
              const data = await ascendUser(user.userId, user.shortId)
              if (data?.success) {
                setLaps(data.laps)
                setFastestLapBets(data.fastestLapBets)
                applyPointsUpdate(200000n, useUserStore.getState().peakPoints)
                setInputString('200000')
                setEligible(true)
              }
              setShowAscensionPrompt(false)
            }}
            onDismiss={() => {
              useUIStore.getState().setAscensionDeclinedThisSession(true)
              setShowAscensionPrompt(false)
            }}
            onComplete={() => {
              setNotification('idle_unlock')
            }}
          />
        )}

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
                    : visualMode === 'winstreak_inferno'
                      ? 'border-orange-400 inferno-ring'
                      : visualMode === 'winstreak_fever'
                        ? 'border-green-400 fever-ring'
                        : visualMode === 'festival_ghost'
                          ? 'border-teal-300 ghost-ring'
                          : visualMode === 'festival_safeguard'
                            ? 'border-slate-300 safeguard-ring'
                            : visualMode === 'festival_resonance'
                              ? 'border-yellow-300 resonance-ring'
                              : visualMode === 'festival_surge'
                                ? 'border-cyan-300 surge-ring'
                                : visualMode === 'festival_vault'
                                  ? 'border-indigo-300 vault-ring'
                                  : visualMode === 'festival_spark'
                                    ? 'border-purple-300 spark-neon-pulse'
                                    : visualMode === 'festival_fever'
                                      ? 'border-orange-400 fever-festival-ring'
                                      : visualMode === 'festival_sanguine'
                                        ? 'border-red-900 sanguine-ring'
                                        : 'border-gray-100'
          }`}
        >
          {/* Top section */}
          <div className="mb-1">
            {/* Points + Mute */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                {/* Points display */}
                <div className="flex items-center gap-2">
                  <div className="relative group flex items-center">
                    <div
                      className="flex items-center gap-2 cursor-pointer select-none"
                      title={capped ? full : undefined}
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
                          className={getDisplayTierClass(
                            points,
                            stylePreference
                          )}
                          style={{ position: 'relative' }}
                        >
                          {pointsLoaded ? animatedDisplay : '...'}
                        </span>
                      </span>
                    </div>
                    {shouldShowTooltip && (
                      <div className="absolute top-full mt-2 left-0 z-50 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 whitespace-nowrap">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                          <span
                            className={`${getDisplayTierClass(points, stylePreference)} tier-clean-text`}
                          >
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

              {/* Mute + Relic */}
              <div className="flex items-center gap-2 shrink-0">
                <RelicSlot align="right" />
                <button
                  onClick={toggleSound}
                  className="shrink-0 p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition shadow-sm"
                  title="Toggle sound effects"
                >
                  <SoundIcon muted={!soundOn} />
                </button>
              </div>
            </div>

            {/* Badges */}
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
          <div className="flex flex-row items-center gap-1 sm:gap-2 h-10">
            <div className="flex items-center gap-2 flex-1 min-w-0 h-full">
              <label className="hidden min-[370px]:block text-xs font-bold text-gray-400 uppercase shrink-0">
                Amount
              </label>
              <div className="relative flex-1 min-w-0 h-full">
                <input
                  type="text"
                  value={isFocused ? inputString : ''}
                  onFocus={() => {
                    setIsFocused(true)
                    setInputString('')
                  }}
                  placeholder={
                    !isFocused
                      ? formatPoints(betAmount).display
                      : !autoAllIn
                        ? '100k → 100.000'
                        : ''
                  }
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
                  className={`block w-full h-full border border-gray-200 rounded-lg pl-3 pr-2 py-0 font-bold focus:ring-2 focus:ring-purple-300 transition-all bg-white ${
                    !isFocused
                      ? 'placeholder:text-gray-800'
                      : 'placeholder:text-gray-400'
                  } ${isFocused && inputString.length > 20 ? 'text-[10px] font-mono' : 'text-sm'}`}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 h-full">
              <ModeButton
                visualMode={visualMode}
                festivalModeKey={festivalModeKey}
                label="ALL IN"
                onClick={() => {
                  setBetAmount(points)
                  setInputString(points.toString())
                }}
              />
              <ModeButton
                visualMode={visualMode}
                festivalModeKey={festivalModeKey}
                label={`AUTO\u00A0${autoAllIn ? 'ON' : 'OFF'}`}
                onClick={() => setAutoAllIn(!autoAllIn)}
              />
            </div>
          </div>

          {/* Notification banner */}
          {notification && isHydrated && (
            <div className="flex flex-col gap-2 mt-3">
              {/* Welcome banner - new visitor or bigint error */}
              {(notification === 'new_visitor' ||
                notification === 'no_bigint') && (
                <div
                  className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 border animate-in fade-in slide-in-from-top-2 duration-400 ${
                    notification === 'no_bigint'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-indigo-50 border-indigo-200'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xl flex-none mt-0.5">
                      {notification === 'no_bigint' ? '⚠️' : '🎉'}
                    </span>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span
                        className={`text-[11px] font-black uppercase tracking-widest leading-tight ${
                          notification === 'no_bigint'
                            ? 'text-red-700'
                            : 'text-indigo-700'
                        }`}
                      >
                        {notification === 'no_bigint'
                          ? 'Browser Not Supported'
                          : "You've been granted 200,000 points!"}
                      </span>
                      <p
                        className={`text-[10px] font-medium leading-snug ${
                          notification === 'no_bigint'
                            ? 'text-red-600'
                            : 'text-indigo-500'
                        }`}
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
                    className={`flex-none p-1.5 rounded-lg transition-colors shrink-0 ${
                      notification === 'no_bigint'
                        ? 'text-red-400 hover:text-red-700 hover:bg-red-100'
                        : 'text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100'
                    }`}
                    aria-label="Close"
                  >
                    <CloseIcon />
                  </button>
                </div>
              )}

              {/* Oracle prophecy banner */}
              {notification === 'oracle' &&
                oracleSide &&
                (() => {
                  const dayIndex =
                    new Date().getUTCDate() % oracleTemplates.length
                  const template = oracleTemplates[dayIndex](oracleSide)
                  return (
                    <div className="flex items-start gap-3 rounded-xl px-4 py-3 border border-purple-400 bg-purple-50 animate-in fade-in slide-in-from-top-2 duration-400">
                      <span className="text-xl flex-none mt-0.5">👁️</span>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[11px] font-black uppercase tracking-widest leading-tight text-purple-800">
                          Daily Oracle Prophecy
                        </span>
                        <p className="text-[10px] font-medium leading-snug text-purple-700">
                          {template.prefix}{' '}
                          <span className="inline-block font-black text-white bg-purple-700 px-2 py-0.5 rounded-md shadow-[0_0_14px_rgba(168,85,247,0.9),0_0_28px_rgba(168,85,247,0.5)] uppercase tracking-wider text-[10px] mx-0.5">
                            {oracleSide === 'left' ? 'LEFT' : 'RIGHT'}
                          </span>{' '}
                          {template.suffix}
                        </p>
                      </div>
                    </div>
                  )
                })()}
              {/* Idle unlock banner */}
              {notification === 'idle_unlock' && (
                <div className="flex items-start justify-between gap-3 rounded-xl px-4 py-3 border border-indigo-300 bg-indigo-50 animate-in fade-in slide-in-from-top-2 duration-400">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xl flex-none mt-0.5">⚡</span>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[11px] font-black uppercase tracking-widest leading-tight text-indigo-700">
                        Auto-Bet Unlocked
                      </span>
                      <p className="text-[10px] font-medium leading-snug text-indigo-500">
                        Tick Auto-Bet Left or Right above any match to let the
                        system bet for you automatically.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setHasInteractedWithIdle(true)
                      setNotification(null)
                    }}
                    className="flex-none p-1.5 rounded-lg text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 transition-colors shrink-0"
                    aria-label="Close"
                  >
                    <CloseIcon />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <LiveStatsTicker />
      <FestivalTicker />

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

      <IdleBetControls />

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
                  festivalModeKey={festivalModeKey}
                  oracleSide={oracleSide}
                />
              ))}
            <MatchList
              matches={matches}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              predictions={predictions}
              winStreak={winStreak}
              visualMode={visualMode}
              festivalModeKey={festivalModeKey}
            />
          </>
        )}
      </div>

      <RelicDrawer />
      <RelicDropPopup />

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
