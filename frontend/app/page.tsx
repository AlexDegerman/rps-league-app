'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import {
  fetchLatestMatches,
  fetchPendingMatches,
  fetchUserPoints,
  fetchUnifiedLeaderboard,
  ascendUser,
  fetchOracleState,
  fetchIdleEligibility,
  fetchUserFlashState,
  fetchFestivalState,
  postFestivalParticipated,
  fetchGlobalEventState
} from '@/lib/api'
import ChevronUpIcon from '@/components/icons/ChevronUpIcon'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { getOrCreateUser, isUserValid } from '@/lib/user'
import type {
  Match,
  PendingMatch,
  ResultAnim,
  EventTheme,
  FestivalModeKey,
  VisualMode,
  FestivalSSEData,
  GlobalEventStartSSEData,
  GlobalEventWarningSSEData,
  GlobalEventType,
  GlobalEventPhase
} from '@/types/rps'
import { useSound } from '@/hooks/useSound'
import LiveStatsTicker from '@/components/tickers/LiveStatTicker'
import { useAnimatedBigIntVal } from '@/hooks/useAnimatedBigInt'
import EdgeGlow from '@/components/overlays/EdgeGlow'
import ConfettiOverlay from '@/components/overlays/ConfettiOverlay'
import ResultAnimOverlay from '@/components/overlays/ResultAnimOverlay'
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
import IdleBetControls from '@/components/ui/IdleBetControls'
import AchievementToast from '@/components/game/AchievementToast'
import RelicDrawer from '@/components/relics/RelicDrawer'
import RelicDropPopup from '@/components/relics/RelicDropPopup'
import { useRelicStore } from './stores/relicStore'
import { slamState } from '@/lib/slamState'
import BonusExplainerModal, {
  BonusExplainerTrigger
} from '@/components/modals/BonusExplainerModal'
import FlashEventActivationOverlay from '@/components/overlays/FlashEventActivationOverlay'
import { usePopupQueue } from '@/hooks/usePopupQueue'
import { speakOracle } from '@/lib/oracleTTS'
import GlobalTickerWrapper from '@/components/layout/GlobalTickerWrapper'
import { buildGlobalEventCountdownSpeech, GLOBAL_EVENT_MODE_MAP, GLOBAL_EVENT_REGISTRY } from '@/lib/globalEvents'
import GlobalEventActivationOverlay from '@/components/overlays/GlobalEventActivationOverlay'
import { emitActivity } from '@/lib/activityFeed'
import EventTimerTicker from '@/components/tickers/EventTimerTicker'
import DashboardCard from '@/components/game/DashboardCard'
import MatchFeed from '@/components/game/MatchFeed'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function HomePage() {
  // --- Game Store Selectors ---
  const backendReady = useGameStore((s) => s.backendReady)
  const markReady = useGameStore((s) => s.markReady)
  const addPendingMatch = useGameStore((s) => s.addPendingMatch)
  const removePendingMatch = useGameStore((s) => s.removePendingMatch)
  const activeFlashEvent = useGameStore((s) => s.activeFlashEvent)
  const setActiveFlashEvent = useGameStore((s) => s.setActiveFlashEvent)
  const setFlashBuffRemaining = useGameStore((s) => s.setFlashBuffRemaining)
  const decrementFlashBuff = useGameStore((s) => s.decrementFlashBuff)
  const serverOffset = useGameStore((s) => s.serverOffset)
  const setServerOffset = useGameStore((s) => s.setServerOffset)
  const setVisualMode = useGameStore((s) => s.setVisualMode)
  const setLiveTheme = useGameStore((s) => s.setLiveTheme)
  const setActiveFestival = useGameStore((s) => s.setActiveFestival)
  const festivalModeKey = useGameStore((s) => s.festivalModeKey)
  const activeGlobalEvent = useGameStore((s) => s.activeGlobalEvent)
  const globalEventPhase = useGameStore((s) => s.globalEventPhase)
  const setGlobalEventWarning = useGameStore((s) => s.setGlobalEventWarning)
  const setGlobalEventActive = useGameStore((s) => s.setGlobalEventActive)
  const globalEventActiveAt = useGameStore((s) => s.globalEventActiveAt)

  // --- User Store Selectors ---
  const points = useUserStore((s) => s.points)
  const setBetAmount = useUserStore((s) => s.setBetAmount)
  const autoAllIn = useUserStore((s) => s.autoAllIn)
  const isHydrated = useUserStore((s) => s.isHydrated)
  const winStreak = useUserStore((s) => s.winStreak)
  const setWinStreak = useUserStore((s) => s.setWinStreak)
  const streakMult = useUserStore((s) => s.streakMult)
  const setStreakMult = useUserStore((s) => s.setStreakMult)
  const setDailyRank = useUserStore((s) => s.setDailyRank)
  const applyPointsUpdate = useUserStore((s) => s.applyPointsUpdate)
  const laps = useUserStore((s) => s.laps)
  const setLaps = useUserStore((s) => s.setLaps)
  const setFastestLapBets = useUserStore((s) => s.setFastestLapBets)

  // --- UI Store Selectors ---
  const resultAnim = useUIStore((s) => s.resultAnim)
  const setResultAnim = useUIStore((s) => s.setResultAnim)
  const clearResultAnim = useUIStore((s) => s.clearResultAnim)
  const setNotification = useUIStore((s) => s.setNotification)
  const errorMessage = useUIStore((s) => s.errorMessage)
  const triggerError = useUIStore((s) => s.triggerError)
  const showJumpButton = useUIStore((s) => s.showJumpButton)
  const setShowJumpButton = useUIStore((s) => s.setShowJumpButton)
  const isFocused = useUIStore((s) => s.isFocused)
  const setInputString = useUIStore((s) => s.setInputString)
  const persistentError = useUIStore((s) => s.persistentError)
  const setPersistentError = useUIStore((s) => s.setPersistentError)
  const showWelcomeModal = useUIStore((s) => s.showWelcomeModal)
  const setShowWelcomeModal = useUIStore((s) => s.setShowWelcomeModal)
  const showUpdateModal = useUIStore((s) => s.showUpdateModal)
  const setShowUpdateModal = useUIStore((s) => s.setShowUpdateModal)
  const setOracleTickerMessage = useUIStore((s) => s.setOracleTickerMessage)
  const showBonusModal = useUIStore((s) => s.showBonusModal)
  const setShowBonusModal = useUIStore((s) => s.setShowBonusModal)
  const activePopup = useUIStore((s) => s.activePopup)
  const dequeuePopup = useUIStore((s) => s.dequeuePopup)
  const readyToShow = useUIStore((s) => s.readyToShow)
  const oracleVolume = useUIStore((s) => s.oracleVolume)
  const oracleTTSEnabled = useUIStore((s) => s.oracleTTSEnabled)
  const showGlobalActivationOverlay = useUIStore(
    (s) => s.showGlobalActivationOverlay
  )
  const setShowGlobalActivationOverlay = useUIStore(
    (s) => s.setShowGlobalActivationOverlay
  )

  // --- Idle Store Selector ---
  const setEligible = useIdleStore((s) => s.setEligible)

  useIdleBet()

  const {
    playWin,
    playLoss,
    playCards,
    playElectric,
    playFire,
    playMoon,
    playFanfare,
    playTidalSurge,
    playSolarFlare,
    playCycloneBlitz,
    playMirageCataclysm
  } = useSound()

  usePopupQueue({
    playMoon,
    playCards,
    playElectric,
    playFire,
    playFanfare,
    playTidalSurge,
    playSolarFlare,
    playCycloneBlitz,
    playMirageCataclysm
  })
  const esRef = useRef<EventSource | null>(null)
  const clearAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDuplicate = useTabGuard(() => {
    esRef.current?.close()
  })

  const [isStreamStale, setIsStreamStale] = useState(false)
  const isStreamStaleRef = useRef(false)

  useEffect(() => {
    isStreamStaleRef.current = isStreamStale
  }, [isStreamStale])

  const lastPacketRef = useRef<number | null>(null)
  const isOffline = typeof window !== 'undefined' && !navigator.onLine

  const showConnectionWarning =
    backendReady &&
    !isDuplicate &&
    !persistentError &&
    (isOffline || isStreamStale)

  useEffect(() => {
    lastPacketRef.current = Date.now()

    const checkStaleness = () => {
      if (lastPacketRef.current === null) return
      const isStale = Date.now() - lastPacketRef.current > 10000
      setIsStreamStale(isStale)
    }

    checkStaleness()

    const timer = setInterval(checkStaleness, 5000)
    return () => clearInterval(timer)
  }, [])

  const getVisualMode = (
    flash: string | null,
    globalEvent: GlobalEventType | null,
    globalPhase: GlobalEventPhase | null,
    festival: FestivalModeKey | null,
    streak: number
  ): VisualMode => {
    if (flash === 'LUNAR') return 'flash_lunar'
    if (flash === 'ELECTRIC') return 'flash_electric'
    if (flash === 'CARDS') return 'flash_cards'
    if (flash === 'HELLFIRE') return 'flash_hellfire'
    if (globalEvent && globalPhase === 'active') {
      if (globalEvent === 'TIDAL_SURGE') return 'global_tidal_surge'
      if (globalEvent === 'SOLAR_FLARE') return 'global_solar_flare'
      if (globalEvent === 'CYCLONE_BLITZ') return 'global_cyclone_blitz'
      if (globalEvent === 'MIRAGE_CATACLYSM') return 'global_mirage_cataclysm'
    }

    if (festival) return festival

    if (streak >= 5) return 'winstreak_inferno'
    if (streak >= 3) return 'winstreak_fever'

    return null
  }

  const visualMode = getVisualMode(
    activeFlashEvent,
    activeGlobalEvent,
    globalEventPhase,
    festivalModeKey,
    winStreak
  )

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

  // Global event warning countdown TTS, fires at 60s and 30s before active
  const countdownAnnouncedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (
      !activeGlobalEvent ||
      globalEventPhase !== 'warning' ||
      !globalEventActiveAt
    ) {
      countdownAnnouncedRef.current.clear()
      return
    }

    const interval = setInterval(() => {
      const msLeft = globalEventActiveAt - (Date.now() + serverOffset)
      if (msLeft <= 0) return

      // Announce at ~60s and ~30s remaining (500ms tolerance window)
      const shouldAnnounce60 = msLeft <= 62000 && msLeft >= 58000
      const shouldAnnounce30 = msLeft <= 32000 && msLeft >= 28000

      const key60 = `${activeGlobalEvent}-60`
      const key30 = `${activeGlobalEvent}-30`

      if (shouldAnnounce60 && !countdownAnnouncedRef.current.has(key60)) {
        countdownAnnouncedRef.current.add(key60)
        const speech = buildGlobalEventCountdownSpeech(
          activeGlobalEvent,
          msLeft
        )
        if (oracleTTSEnabled) speakOracle(speech, oracleVolume)
        setOracleTickerMessage({
          id: `global-countdown-60-${Date.now()}`,
          content: (
            <span>
              <span
                className="font-black uppercase"
                style={{
                  color:
                    GLOBAL_EVENT_REGISTRY[
                      GLOBAL_EVENT_MODE_MAP[activeGlobalEvent]
                    ]?.color ?? '#94a3b8'
                }}
              >
                {GLOBAL_EVENT_REGISTRY[GLOBAL_EVENT_MODE_MAP[activeGlobalEvent]]
                  ?.label ?? activeGlobalEvent}
              </span>{' '}
              activates in approximately 1 minute.
            </span>
          ),
          accentColor:
            GLOBAL_EVENT_REGISTRY[GLOBAL_EVENT_MODE_MAP[activeGlobalEvent]]
              ?.color ?? '#94a3b8',
          durationMs: 6000
        })
      }

      if (shouldAnnounce30 && !countdownAnnouncedRef.current.has(key30)) {
        countdownAnnouncedRef.current.add(key30)
        const speech = buildGlobalEventCountdownSpeech(
          activeGlobalEvent,
          msLeft
        )
        if (oracleTTSEnabled) speakOracle(speech, oracleVolume)
        setOracleTickerMessage({
          id: `global-countdown-30-${Date.now()}`,
          content: (
            <span>
              <span
                className="font-black uppercase"
                style={{
                  color:
                    GLOBAL_EVENT_REGISTRY[
                      GLOBAL_EVENT_MODE_MAP[activeGlobalEvent]
                    ]?.color ?? '#94a3b8'
                }}
              >
                {GLOBAL_EVENT_REGISTRY[GLOBAL_EVENT_MODE_MAP[activeGlobalEvent]]
                  ?.label ?? activeGlobalEvent}
              </span>{' '}
              imminent. 30 seconds.
            </span>
          ),
          accentColor:
            GLOBAL_EVENT_REGISTRY[GLOBAL_EVENT_MODE_MAP[activeGlobalEvent]]
              ?.color ?? '#94a3b8',
          durationMs: 5000
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [activeGlobalEvent, globalEventPhase, globalEventActiveAt, serverOffset, oracleVolume, setOracleTickerMessage, oracleTTSEnabled])

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
  const animatedResult = useAnimatedBigIntVal(
    resultAnim?.amount ?? 0n,
    600,
    true
  )

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

    fetchOracleState(user.userId)
      .then((data) => {
        const alreadyWelcomed = !!localStorage.getItem('rps_welcomed')
        if (!alreadyWelcomed) return
        if (useUIStore.getState().notification === 'new_visitor') return

        if (data && !data.used) {
          useGameStore.getState().setOracleSide(data.side)
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
            speech: template.speech,
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

    fetchGlobalEventState()
      .then((data) => {
        if (data?.event) {
          const { type, phase, activeAt, endsAt, startedAt } = data.event
          if (phase === 'warning') {
            setGlobalEventWarning(
              type,
              activeAt,
              endsAt,
              startedAt ?? Date.now()
            )
          } else if (phase === 'active') {
            setGlobalEventActive(type, endsAt)
          }
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
    if (newPoints >= ASCENSION_THRESHOLD && !ascensionDeclinedThisSession) {
      useUIStore.getState().enqueuePopup({
        id: 'ascension',
        kind: 'ascension'
      })
    }

    return { newPoints, isNewPeak }
  }, [applyPointsUpdate, setInputString])

  // SSE live stream
  useEffect(() => {
    if (isDuplicate) return
    const { userId: myUserId } = getOrCreateUser() 
    const es = new EventSource(`${API_BASE}/api/live`)
    esRef.current = es
    const updatePacketTimestamp = () => {
      lastPacketRef.current = Date.now()
      if (isStreamStaleRef.current) setIsStreamStale(false)
    }
    es.addEventListener('sync', (event) => {
      const { serverTime } = JSON.parse(event.data)
      setServerOffset(serverTime - Date.now())
      setPersistentError(null)
    })

    es.addEventListener('pending', (event) => {
      const pending: PendingMatch = JSON.parse(event.data)
      updatePacketTimestamp()
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
      useGameStore.getState().setLatestPredictionResult(data)

      if (data.relicDrop) {
        emitActivity({
          id: `relic-${(data.relicDrop as { key: string }).key}-${Date.now()}`,
          type: 'relic',
          userId: data.userId,
          nickname: data.nickname ?? 'Someone',
          payload: { relic: data.relicDrop },
          timestamp: Date.now()
        })
      }
      if (
        data.result === 'WIN' &&
        [3, 5, 8, 10, 15, 20].includes(data.streakAfter ?? 0)
      ) {
        emitActivity({
          id: `streak-${data.userId}-${data.streakAfter}-${Date.now()}`,
          type: 'streak',
          userId: data.userId,
          nickname: data.nickname ?? 'Someone',
          payload: { streak: data.streakAfter },
          timestamp: Date.now()
        })
      }

      if (data.userId !== myUserId) return
      updatePacketTimestamp()

      const isWin = data.result === 'WIN'
      const { activeFlashEvent: currentFlash } = useGameStore.getState()

      if (isWin) {
        if (currentFlash === 'LUNAR') playMoon()
        else if (currentFlash === 'CARDS') playCards()
        else if (currentFlash === 'ELECTRIC') playElectric()
        else if (currentFlash === 'HELLFIRE') playFire()
        else {
          const {
            activeGlobalEvent: winGlobal,
            globalEventPhase: winGlobalPhase
          } = useGameStore.getState()
          if (winGlobal && winGlobalPhase === 'active') {
            if (winGlobal === 'TIDAL_SURGE') playTidalSurge()
            else if (winGlobal === 'SOLAR_FLARE') playSolarFlare()
            else if (winGlobal === 'CYCLONE_BLITZ') playCycloneBlitz()
            else if (winGlobal === 'MIRAGE_CATACLYSM') playMirageCataclysm()
            else playWin()
          } else {
            playWin()
          }
        }

        const currentStreak = data.streakAfter ?? 0
        const {
          activeGlobalEvent: currentGlobal,
          globalEventPhase: currentGlobalPhase
        } = useGameStore.getState()
        const globalIsActive = currentGlobal && currentGlobalPhase === 'active'

        const capturedConfettiType =
          currentFlash === 'HELLFIRE'
            ? 'hellfire'
            : currentFlash === 'LUNAR'
              ? 'lunar'
              : currentFlash === 'ELECTRIC'
                ? 'electric'
                : currentFlash === 'CARDS'
                  ? 'cards'
                  : globalIsActive && currentGlobal === 'TIDAL_SURGE'
                    ? 'tidal_surge'
                    : globalIsActive && currentGlobal === 'SOLAR_FLARE'
                      ? 'solar_flare'
                      : globalIsActive && currentGlobal === 'CYCLONE_BLITZ'
                        ? 'cyclone_blitz'
                        : globalIsActive && currentGlobal === 'MIRAGE_CATACLYSM'
                          ? 'mirage_cataclysm'
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
          globalEventType: data.globalEventType ?? null,
          globalEchoAmount: data.globalEchoAmount
            ? BigInt(data.globalEchoAmount)
            : null,
          confetti: Array.from({ length: 50 }).map(() => ({
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
        useUIStore.getState().enqueuePopup({
          id: `relic-${data.relicDrop.key}-${Date.now()}`,
          kind: 'relic_drop'
        })
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
        useGameStore
          .getState()
          .updatePrediction(data.gameId, { result: isWin ? 'WIN' : 'LOSE' })
      }
    })

    es.addEventListener('result', (event) => {
      const match: Match = JSON.parse(event.data)
      updatePacketTimestamp()
      removePendingMatch(match.gameId)
      setMatches((prev) => {
        if (prev.some((m) => m.gameId === match.gameId)) return prev
        return [match, ...prev].slice(0, 20)
      })
    })

    es.addEventListener('flash_event', (event) => {
      const data = JSON.parse(event.data)
      if (data.userId !== myUserId) return
      setFlashBuffRemaining(data.betsRemaining)
      useGameStore.getState().setFlashExpiresAt(null)
      useUIStore.getState().enqueuePopup({
        id: `flash-${data.type}-${Date.now()}`,
        kind: 'flash_event',
        payload: data.type
      })
    })

    es.addEventListener('festival_event', (event: MessageEvent) => {
      const data: FestivalSSEData = JSON.parse(event.data)
     if (data.endsAt !== null && Date.now() > data.endsAt) return

    emitActivity({
      id: `festival-feed-${data.type}-${Date.now()}`,
      type: 'festival',
      userId: data.triggerUserId ?? '',
      nickname: data.triggeredBy ?? 'Oracle',
      payload: { festivalType: data.type, isDemo: data.isDemo ?? false },
      timestamp: Date.now()
    })

    const isStale = Date.now() - data.startedAt > 3000
      if (data.triggerUserId !== myUserId) {
        postFestivalParticipated(myUserId).catch(() => {})
      }
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
      if (!isStale) {
        setOracleTickerMessage({
          id: `festival-${data.type}-${Date.now()}`,
          content: data.message,
          speech: data.speech,
          accentColor: FESTIVAL_COLORS[data.type] ?? '#a855f7',
          durationMs: 5000
        })
      }
    })

    es.addEventListener('global_event_warning', (event) => {
      const data: GlobalEventWarningSSEData = JSON.parse(event.data)
      if (Date.now() + useGameStore.getState().serverOffset > data.endsAt)
        return

      setGlobalEventWarning(
        data.type,
        data.activeAt,
        data.endsAt,
        data.startedAt
      )

      // Oracle-style warning announcement
      const modeKey = GLOBAL_EVENT_MODE_MAP[data.type as GlobalEventType]
      const config = modeKey ? GLOBAL_EVENT_REGISTRY[modeKey] : null

      setOracleTickerMessage({
        id: `global-warning-${data.type}-${Date.now()}`,
        content: (
          <span>
            {data.message}{' '}
            <span
              className="font-black uppercase"
              style={{ color: config?.color ?? '#94a3b8' }}
            >
              {config?.label ?? data.type}
            </span>{' '}
            activates soon.
          </span>
        ),
        speech: data.speech,
        accentColor: config?.color ?? '#94a3b8',
        durationMs: 12_000
      })
    })

    es.addEventListener('global_event_start', (event) => {
      const data: GlobalEventStartSSEData = JSON.parse(event.data)
      if (Date.now() + serverOffset > data.endsAt) return
      setGlobalEventActive(data.type, data.endsAt)

      emitActivity({
        id: `global-feed-${data.type}-${Date.now()}`,
        type: 'global_event',
        userId: '',
        nickname: 'System',
        payload: { eventType: data.type },
        timestamp: Date.now()
      })

      useUIStore.getState().enqueuePopup({
        id: `global-start-${data.type}-${Date.now()}`,
        kind: 'global_event',
        payload: { type: data.type, endsAt: data.endsAt }
      })

      const modeKey = GLOBAL_EVENT_MODE_MAP[data.type as GlobalEventType]
      const config = modeKey ? GLOBAL_EVENT_REGISTRY[modeKey] : null

      setOracleTickerMessage({
        id: `global-active-${data.type}-${Date.now()}`,
        content: (
          <span>
            <span
              className="font-black uppercase"
              style={{ color: config?.color ?? '#94a3b8' }}
            >
              {config?.label ?? data.type}
            </span>{' '}
            NOW ACTIVE -{' '}
            {config?.effectText?.split(' - ')[1] ?? 'Global buff online.'}
          </span>
        ),
        accentColor: config?.color ?? '#94a3b8',
        durationMs: 8_000
      })
    })

    es.addEventListener('achievement_unlocked', (event) => {
      const data = JSON.parse(event.data)

      emitActivity({
        id: `ach-feed-${data.code}-${data.userId}-${Date.now()}`,
        type: 'achievement',
        userId: data.userId,
        nickname: data.nickname ?? 'Someone',
        payload: {
          code: data.code,
          name: data.name,
          rarity: data.rarity,
          icon: data.icon
        },
        timestamp: Date.now()
      })

      if (data.userId !== myUserId) return

      useUserStore.getState().refreshBadges()
      useUIStore.getState().enqueuePopup({
        id: `ach-${data.code}-${Date.now()}`,
        kind: 'achievement',
        payload: {
          code: data.code,
          name: data.name,
          icon: data.icon,
          rarity: data.rarity,
          requirement: data.requirement
        }
      })
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

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      {showWelcomeModal && <WelcomeModal onContinue={handleWelcomeContinue} />}
      {showUpdateModal && <UpdateModal onClose={handleUpdateClose} />}
      {showBonusModal && (
        <BonusExplainerModal onClose={() => setShowBonusModal(false)} />
      )}

      {/* POPUP QUEUE RENDERING */}
      {activePopup && readyToShow && (
        <>
          {activePopup.kind === 'flash_event' && (
            <FlashEventActivationOverlay
              event={activePopup.payload as EventTheme}
              onDone={() => dequeuePopup()}
            />
          )}

          {activePopup.kind === 'ascension' && (
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
                dequeuePopup()
              }}
              onDismiss={() => {
                useUIStore.getState().setAscensionDeclinedThisSession(true)
                dequeuePopup()
              }}
            />
          )}

          {activePopup.kind === 'relic_drop' && <RelicDropPopup />}

          {activePopup.kind === 'global_event' &&
            showGlobalActivationOverlay && (
              <GlobalEventActivationOverlay
                event={
                  (activePopup.payload as { type: GlobalEventType })?.type ??
                  null
                }
                onDone={() => {
                  setShowGlobalActivationOverlay(false)
                  dequeuePopup()
                }}
              />
            )}
        </>
      )}

      <GlobalTickerWrapper />
      <EdgeGlow visualMode={visualMode} />

      <div className="relative z-40 isolate">
        <ConfettiOverlay
          confettiType={resultAnim?.confettiType ?? 'normal'}
          show={resultAnim?.win === true}
        />
        <AchievementToast />

        <ResultAnimOverlay
          resultAnim={resultAnim}
          streakMult={streakMult}
          animatedResult={animatedResult}
        />

        <DashboardCard />
      </div>
      <LiveStatsTicker />
      <EventTimerTicker />

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
          <BonusExplainerTrigger onClick={() => setShowBonusModal(true)} />
        </div>
      </div>

      <IdleBetControls />

      {/* Match feed */}
      <MatchFeed
        visualMode={visualMode}
        matches={matches}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        backendReady={backendReady}
        persistentError={persistentError}
        isDuplicate={isDuplicate}
        showConnectionWarning={showConnectionWarning}
        isOffline={isOffline}
      />

      <RelicDrawer />

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
