import { logger } from '../utils/logger.js'
import { clearAllFlashEvents, getRandomFlashType, refillAllFlashEvents } from './flashEventService.js'

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
  SPARK: 45_000, // 45 sec
  GHOST: 60_000, // 1 min
  SAFEGUARD: 60_000, // 1 min
  RESONANCE: 40_000, // 40 sec
  SURGE: 60_000, // 1 min
  VAULT: 120_000, // 2 min
  FEVER: 30_000, // 30 sec
  SANGUINE: 15_000 // 15 sec
}

const LOCKOUT_MS = 5 * 60 * 1000 // 5 minutes post-festival
const DEMO_FESTIVAL_MIN_MS = 18 * 60 * 1000 // 18 minutes
const DEMO_FESTIVAL_MAX_MS = 24 * 60 * 1000 // 24 minutes
const PLAYER_FESTIVAL_QUIET_MS = 10 * 60 * 1000 // 10 min quiet window after player festival

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
  //{ type: 'VAULT', weight: 5 }, relics unimplemented
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

// Streak tracking
const _userBonusStreak = new Map<string, number>()
const _userFlashStreak = new Map<string, number>()
const _userLossStreak = new Map<string, number>()
const _userGuaranteedBonus = new Map<string, number>() // Used for Spark streak rewards

// ─── Helpers ──────────────────────────────────────────────────────────────────

const randomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]!

export const buildFestivalBroadcastMessage = (
  triggeredBy: string,
  festivalType: FestivalType,
  isDemo: boolean
): string => {
  if (isDemo) {
    const prefix = randomItem(ORACLE_TRIGGER_PREFIXES)
    return `${prefix} ${festivalType} FESTIVAL`
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
  getActiveFestival() // Clears if expired
  return _activeFestival !== null || Date.now() < _lockoutUntil
}

// ─── Festival Launch ──────────────────────────────────────────────────────────

const launchFestival = (
  type: FestivalType,
  triggeredBy: string,
  broadcast: Broadcast,
  meta?: { streakTrigger?: boolean; triggerUserId?: string; isDemo?: boolean }
): boolean => {
  if (isFestivalLocked()) return false

const isDemo = meta?.isDemo ?? false
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

  newState.flashType = randomFlash.type

  if (meta?.streakTrigger && meta.triggerUserId) {
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

  // SANGUINE
  if (!isWin && getLossStreakForUser(userId) >= 4) {
    resetLossStreakForUser(userId)
    if (launchFestival('SANGUINE', nickname, broadcast, { isDemo: false }))
      return
  }

  // FEVER
  if (isWin) {
    if (winStreakAfter >= 8) {
      if (launchFestival('FEVER', nickname, broadcast, { isDemo: false }))
        return
    } else if (winStreakAfter >= 5 && Math.random() < 0.2) {
      if (launchFestival('FEVER', nickname, broadcast, { isDemo: false }))
        return
    }
  }

  // SPARK
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

  // GHOST
  if (isWin && totalMultiplier >= 60) {
    if (launchFestival('GHOST', nickname, broadcast, { isDemo: false })) return
  } else if (isWin && totalMultiplier >= 30 && Math.random() < 0.4) {
    if (launchFestival('GHOST', nickname, broadcast, { isDemo: false })) return
  }
  // RESONANCE
  const bonusStreak = getBonusStreakForUser(userId)
  if (bonusStreak >= 3) {
    resetBonusStreakForUser(userId)
    if (launchFestival('RESONANCE', nickname, broadcast, { isDemo: false }))
      return
  }
  if (bonusTier === 'LEGENDARY' && Math.random() < 0.3) {
    resetBonusStreakForUser(userId)
    if (launchFestival('RESONANCE', nickname, broadcast, { isDemo: false }))
      return
  }
}

export const triggerSurgeFestival = (
  nickname: string,
  broadcast: Broadcast
): boolean => launchFestival('SURGE', nickname, broadcast, { isDemo: false })

// ─── Scheduler ────────────────────────────────────────────────────────────────

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
