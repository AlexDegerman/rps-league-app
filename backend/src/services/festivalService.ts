import pool from '../utils/db.js'
import { logger } from '../utils/logger.js'
import {
  clearAllFlashEvents,
  getRandomFlashType,
  refillAllFlashEvents
} from './flashEventService.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FestivalType =
  | 'SPARK'
  | 'GHOST'
  | 'SAFEGUARD'
  | 'RESONANCE'
  | 'SURGE'
  | 'VAULT'
  | 'FEVER'
  | 'SANGUINE'

export interface FestivalState {
  type: FestivalType
  startedAt: number
  flashType?: string | undefined
  endsAt: number
  triggeredBy: string
}

type Broadcast = (event: string, data: string) => void

// ─── Constants ────────────────────────────────────────────────────────────────

const FESTIVAL_DURATIONS_MS: Record<FestivalType, number | null> = {
  SPARK: 45_000,
  GHOST: 60_000,
  SAFEGUARD: 60_000,
  RESONANCE: 40_000,
  SURGE: 30_000,
  VAULT: 120_000,
  FEVER: 30_000,
  SANGUINE: 15_000
}

const LOCKOUT_MS = 5 * 60 * 1000
const DEMO_FESTIVAL_MIN_MS = 18 * 60 * 1000
const DEMO_FESTIVAL_MAX_MS = 24 * 60 * 1000
const PLAYER_FESTIVAL_QUIET_MS = 10 * 60 * 1000

const PLAYER_TRIGGER_PREFIXES = [
  '{user} has initiated the',
  '{user} has activated the',
  '{user} has triggered the',
  '{user} has stabilized the',
  '{user} has forced the',
  '{user} has synchronized the'
]

const ORACLE_TRIGGER_PREFIXES = [
  'Oracle instability initiated the',
  'Autonomous Oracle recalibration initiated the',
  'System instability activated the',
  'Chrono-stream divergence initiated the',
  'Background instability triggered the',
  'Probability collapse initiated the',
  'Predictive overflow activated the',
  'Oracle equilibrium failure initiated the',
  'Unstable telemetry activated the',
  'System variance exceeded thresholds for the'
]

const DEMO_FESTIVAL_WEIGHTS: { type: FestivalType; weight: number }[] = [
  { type: 'RESONANCE', weight: 28 },
  { type: 'SPARK', weight: 24 },
  { type: 'FEVER', weight: 18 },
  { type: 'GHOST', weight: 14 },
  { type: 'SAFEGUARD', weight: 8 },
  // { type: 'VAULT', weight: 5 }, // relics unimplemented
  { type: 'SURGE', weight: 2 },
  { type: 'SANGUINE', weight: 1 }
]

const pickDemoFestival = (): FestivalType => {
  const total = DEMO_FESTIVAL_WEIGHTS.reduce((sum, e) => sum + e.weight, 0)
  let roll = Math.random() * total
  for (const entry of DEMO_FESTIVAL_WEIGHTS) {
    roll -= entry.weight
    if (roll <= 0) return entry.type
  }
  return DEMO_FESTIVAL_WEIGHTS[DEMO_FESTIVAL_WEIGHTS.length - 1]!.type
}

// ─── Module State ─────────────────────────────────────────────────────────────

let _activeFestival: FestivalState | null = null
let _lockoutUntil: number = 0
let _lastPlayerFestivalAt: number = 0
let _demoFestivalTimer: ReturnType<typeof setTimeout> | null = null

const _userBonusStreak = new Map<string, number>()
const _userFlashStreak = new Map<string, number>()
const _userLossStreak = new Map<string, number>()
const _userGuaranteedBonus = new Map<string, number>()

// ─── Helpers ──────────────────────────────────────────────────────────────────

const randomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]!

export const buildFestivalBroadcastMessage = (
  triggeredBy: string,
  festivalType: FestivalType,
  isDemo: boolean,
  lapCount?: number
): string => {
  if (isDemo) {
    const prefix = randomItem(ORACLE_TRIGGER_PREFIXES)
    return `${prefix} ${festivalType} FESTIVAL`
  }
  
  if (festivalType === 'SURGE' && lapCount) {
    return `${triggeredBy} has completed Chrono-Lap ${lapCount} and initiated the SURGE FESTIVAL`
  }

  const template = randomItem(PLAYER_TRIGGER_PREFIXES)
  const prefix = template.replace('{user}', triggeredBy)
  return `${prefix} ${festivalType} FESTIVAL`
}

// ─── Getters ──────────────────────────────────────────────────────────────────

export const getActiveFestival = (): FestivalState | null => {
  if (!_activeFestival) return null
  if (Date.now() > _activeFestival.endsAt) {
    logger.info('Festival expired', { type: _activeFestival.type })
    _lockoutUntil = Date.now() + LOCKOUT_MS
    _activeFestival = null
    return null
  }
  return _activeFestival
}

export const getFestivalLockoutRemaining = (): number =>
  Math.max(0, _lockoutUntil - Date.now())

export const isFestivalLocked = (): boolean => {
  getActiveFestival()
  return _activeFestival !== null || Date.now() < _lockoutUntil
}

// ─── Festival Launch ──────────────────────────────────────────────────────────

interface LaunchMeta {
  isDemo?: boolean
  streakTrigger?: boolean
  triggerUserId?: string
}

const launchFestival = (
  type: FestivalType,
  triggeredBy: string,
  broadcast: Broadcast,
  meta: LaunchMeta = {}
): boolean => {
  if (isFestivalLocked()) return false

  const isDemo = meta.isDemo ?? false
  const now = Date.now()
  const durationMs = FESTIVAL_DURATIONS_MS[type] ?? 0

  const newState: FestivalState = {
    type,
    startedAt: now,
    endsAt: now + durationMs,
    triggeredBy
  }

  if (type === 'SPARK') {
    const randomFlash = getRandomFlashType()
    refillAllFlashEvents(randomFlash.type)
    newState.flashType = randomFlash.type

    setTimeout(() => {
      clearAllFlashEvents()
    }, durationMs)

    if (meta.streakTrigger && meta.triggerUserId) {
      _userGuaranteedBonus.set(meta.triggerUserId, 3)
      logger.info('Spark streak bonus granted', { userId: meta.triggerUserId })
    }
  }

  _activeFestival = newState

  if (!isDemo) {
    _lastPlayerFestivalAt = now
  }

  logger.info('Festival launched', { type, triggeredBy, isDemo })

  const message = buildFestivalBroadcastMessage(triggeredBy, type, isDemo)

  broadcast(
    'festival_event',
    JSON.stringify({
      type,
      triggeredBy,
      triggerUserId: meta.triggerUserId ?? null,
      message,
      isDemo,
      startedAt: newState.startedAt,
      endsAt: newState.endsAt,
      durationMs,
      flashType: newState.flashType
    })
  )

  if (type === 'SPARK') {
    _lockoutUntil = newState.endsAt + LOCKOUT_MS
  }

  // Increment festivals_triggered for real player-triggered festivals only
  if (!isDemo && meta.triggerUserId) {
    pool
      .query(
        `UPDATE users SET festivals_triggered = festivals_triggered + 1 WHERE user_id = $1`,
        [meta.triggerUserId]
      )
      .catch((err) =>
        logger.error('festivals_triggered increment failed', err, {
          userId: meta.triggerUserId,
          type
        })
      )
  }

  return true
}

// ─── Per-user Tracking ────────────────────────────────────────────────────────

export const recordBonusForUser = (
  userId: string,
  bonusTier: string | null
): void => {
  if (bonusTier === null) {
    _userBonusStreak.set(userId, 0)
    return
  }
  const current = _userBonusStreak.get(userId) ?? 0
  _userBonusStreak.set(userId, current + 1)
}

export const getGuaranteedBonusRemaining = (userId: string): number =>
  _userGuaranteedBonus.get(userId) ?? 0

export const consumeGuaranteedBonus = (userId: string): boolean => {
  const remaining = _userGuaranteedBonus.get(userId) ?? 0
  if (remaining <= 0) return false
  if (remaining === 1) _userGuaranteedBonus.delete(userId)
  else _userGuaranteedBonus.set(userId, remaining - 1)
  return true
}

export const getBonusStreakForUser = (userId: string): number =>
  _userBonusStreak.get(userId) ?? 0
export const resetBonusStreakForUser = (userId: string): void =>
  void _userBonusStreak.set(userId, 0)

export const recordFlashEventForUser = (userId: string): void => {
  const current = _userFlashStreak.get(userId) ?? 0
  _userFlashStreak.set(userId, current + 1)
}
export const getFlashStreakForUser = (userId: string): number =>
  _userFlashStreak.get(userId) ?? 0
export const resetFlashStreakForUser = (userId: string): void =>
  void _userFlashStreak.set(userId, 0)

export const recordLossForUser = (userId: string): void => {
  const current = _userLossStreak.get(userId) ?? 0
  _userLossStreak.set(userId, current + 1)
}
export const getLossStreakForUser = (userId: string): number =>
  _userLossStreak.get(userId) ?? 0
export const resetLossStreakForUser = (userId: string): void =>
  void _userLossStreak.set(userId, 0)

// ─── Trigger Checks ───────────────────────────────────────────────────────────

export const checkAndTriggerFestival = (
  userId: string,
  nickname: string,
  params: {
    isWin: boolean
    bonusTier: string | null
    bonusMult: number
    flashActive: boolean
    flashJustEnded: boolean
    winStreakAfter: number
    totalMultiplier: number
  },
  broadcast: Broadcast
): void => {
  if (isFestivalLocked()) return

  const {
    isWin,
    bonusTier,
    flashActive,
    flashJustEnded,
    winStreakAfter,
    totalMultiplier
  } = params

  if (isWin) {
    resetLossStreakForUser(userId)
    recordBonusForUser(userId, bonusTier)
  } else {
    resetBonusStreakForUser(userId)
    recordLossForUser(userId)
  }

  if (flashJustEnded) {
    recordFlashEventForUser(userId)
  } else if (!flashActive && !flashJustEnded) {
    resetFlashStreakForUser(userId)
  }

  // SANGUINE: 4-loss streak
  if (!isWin && getLossStreakForUser(userId) >= 4) {
    resetLossStreakForUser(userId)
    if (
      launchFestival('SANGUINE', nickname, broadcast, {
        isDemo: false,
        triggerUserId: userId
      })
    )
      return
  }

  // FEVER: 5-win streak (20%) or 8-win streak (100%)
  if (isWin) {
    if (winStreakAfter >= 8) {
      if (
        launchFestival('FEVER', nickname, broadcast, {
          isDemo: false,
          triggerUserId: userId
        })
      )
        return
    } else if (winStreakAfter >= 5 && Math.random() < 0.2) {
      if (
        launchFestival('FEVER', nickname, broadcast, {
          isDemo: false,
          triggerUserId: userId
        })
      )
        return
    }
  }

  // SPARK: 2 flash events in a row OR LEGENDARY/MYTHICAL during flash
  if (getFlashStreakForUser(userId) >= 2) {
    resetFlashStreakForUser(userId)
    if (
      launchFestival('SPARK', nickname, broadcast, {
        isDemo: false,
        streakTrigger: true,
        triggerUserId: userId
      })
    )
      return
  }

  if (
    flashActive &&
    isWin &&
    (bonusTier === 'LEGENDARY' || bonusTier === 'MYTHICAL')
  ) {
    resetFlashStreakForUser(userId)
    if (
      launchFestival('SPARK', nickname, broadcast, {
        isDemo: false,
        streakTrigger: false,
        triggerUserId: userId
      })
    )
      return
  }

  // GHOST: 30x+ (40%) or 60x+ (100%)
  if (isWin && totalMultiplier >= 60) {
    if (
      launchFestival('GHOST', nickname, broadcast, {
        isDemo: false,
        triggerUserId: userId
      })
    )
      return
  } else if (isWin && totalMultiplier >= 30 && Math.random() < 0.4) {
    if (
      launchFestival('GHOST', nickname, broadcast, {
        isDemo: false,
        triggerUserId: userId
      })
    )
      return
  }

  // RESONANCE: 3 tiered bonuses in a row OR LEGENDARY (30%)
  const bonusStreak = getBonusStreakForUser(userId)
  if (bonusStreak >= 3) {
    resetBonusStreakForUser(userId)
    if (
      launchFestival('RESONANCE', nickname, broadcast, {
        isDemo: false,
        triggerUserId: userId
      })
    )
      return
  }
  if (bonusTier === 'LEGENDARY' && Math.random() < 0.3) {
    resetBonusStreakForUser(userId)
    if (
      launchFestival('RESONANCE', nickname, broadcast, {
        isDemo: false,
        triggerUserId: userId
      })
    )
      return
  }
}

/**
 * Called from ascend route when a user completes a lap.
 * triggerUserId credited for festivals_triggered achievement.
 */
export const triggerSurgeFestival = (
  nickname: string,
  triggerUserId: string,
  broadcast: Broadcast
): boolean =>
  launchFestival('SURGE', nickname, broadcast, {
    isDemo: false,
    triggerUserId
  })

// ─── Demo Scheduler ───────────────────────────────────────────────────────────

const scheduleDemoFestival = (broadcast: Broadcast): void => {
  const delay =
    DEMO_FESTIVAL_MIN_MS +
    Math.random() * (DEMO_FESTIVAL_MAX_MS - DEMO_FESTIVAL_MIN_MS)

  _demoFestivalTimer = setTimeout(() => {
    const now = Date.now()
    const playerFestivalRecent =
      _lastPlayerFestivalAt > 0 &&
      now - _lastPlayerFestivalAt < PLAYER_FESTIVAL_QUIET_MS

    if (!isFestivalLocked() && !playerFestivalRecent) {
      const type = pickDemoFestival()
      launchFestival(type, 'Oracle', broadcast, { isDemo: true })
    }
    scheduleDemoFestival(broadcast)
  }, delay)
}

export const startDemoFestivalScheduler = (broadcast: Broadcast): void => {
  if (_demoFestivalTimer) return
  logger.info('Demo festival scheduler started')
  scheduleDemoFestival(broadcast)
}
