import pool from '../utils/db.js'
import { logger } from '../utils/logger.js'
import { isWorldBossActive } from './worldBossService.js'

export type FlashEventType = 'LUNAR' | 'ELECTRIC' | 'CARDS' | 'HELLFIRE'
const _userSessionFlashTypes = new Map<string, Set<string>>()

export interface FlashEventState {
  type: FlashEventType
  multiplier: number
  betsRemaining: number
  triggeredAt: number
  expiresAt?: number
  isFestival?: boolean
  snapshotRelic: string | null
}

const FLASH_EVENTS_ENABLED = true
const FLASH_TRIGGER_CHANCE = 0.05

const FLASH_EVENT_CONFIG: Record<
  FlashEventType,
  { multiplier: number; weight: number }
> = {
  LUNAR: { multiplier: 3, weight: 1.0 },
  ELECTRIC: { multiplier: 3, weight: 1.0 },
  CARDS: { multiplier: 1.5, weight: 1.0 },
  HELLFIRE: { multiplier: 3, weight: 1.0 }
}

const SIPHON_MAP: Record<string, FlashEventType> = {
  lunar_siphon: 'LUNAR',
  static_inductor: 'ELECTRIC',
  dealers_hand: 'CARDS',
  volcanic_mantle: 'HELLFIRE'
}

/**
 * Weighted random pick for Flash Events.
 * Specific Flash Event relics add +50% weight to their specific event type.
 */
const pickWeightedFlashEvent = (
  types: FlashEventType[],
  equippedRelic?: string | null
): FlashEventType => {
  if (types.length === 0) return 'LUNAR'

  const boostedType = equippedRelic ? SIPHON_MAP[equippedRelic] : undefined

  const totalWeight = types.reduce((sum, t) => {
    const base = FLASH_EVENT_CONFIG[t].weight
    const boost = boostedType === t ? base * 0.5 : 0
    return sum + base + boost
  }, 0)

  let roll = Math.random() * totalWeight
  for (const t of types) {
    const base = FLASH_EVENT_CONFIG[t].weight
    const boost = boostedType === t ? base * 0.5 : 0
    roll -= base + boost
    if (roll <= 0) return t
  }

  return types[types.length - 1]!
}

const _userFlashEvents = new Map<string, FlashEventState>()

export const getFlashEventForUser = (
  userId: string
): FlashEventState | null => {
  if (isWorldBossActive()) return null

  const event = _userFlashEvents.get(userId)
  if (!event) return null

  if (event.expiresAt && Date.now() > event.expiresAt) {
    _userFlashEvents.delete(userId)
    return null
  }

  return event
}

export const recordSessionFlashType = (userId: string, type: string): void => {
  if (!_userSessionFlashTypes.has(userId)) {
    _userSessionFlashTypes.set(userId, new Set())
  }
  _userSessionFlashTypes.get(userId)!.add(type)
}

export const hasSeenAllFlashTypes = (userId: string): boolean => {
  const seen = _userSessionFlashTypes.get(userId)
  if (!seen) return false
  return ['LUNAR', 'ELECTRIC', 'HELLFIRE', 'CARDS'].every((t) => seen.has(t))
}

export const consumeFlashBetForUser = (userId: string): boolean => {
  const event = _userFlashEvents.get(userId)
  if (!event) return false

  if (event.expiresAt && Date.now() > event.expiresAt) {
    _userFlashEvents.delete(userId)
    return true
  }

  event.betsRemaining = Math.max(0, event.betsRemaining - 1)

  if (event.betsRemaining <= 0) {
    _userFlashEvents.delete(userId)
    return true
  }

  return false
}

export const refillAllFlashEvents = async (defaultType: FlashEventType) => {
  const expiry = Date.now() + 45000

  try {
    const { rows } = await pool.query(
      'SELECT user_id, equipped_relic FROM users'
    )

    for (const row of rows) {
      const userId = row.user_id
      const currentRelic = row.equipped_relic
      const existing = _userFlashEvents.get(userId)

      if (existing && existing.isFestival) {
        _userFlashEvents.set(userId, {
          ...existing,
          betsRemaining: 3,
          expiresAt: expiry,
          snapshotRelic: currentRelic
        })
      } else if (!existing) {
        _userFlashEvents.set(userId, {
          type: defaultType,
          betsRemaining: 3,
          multiplier: FLASH_EVENT_CONFIG[defaultType].multiplier,
          triggeredAt: Date.now(),
          expiresAt: expiry,
          isFestival: true,
          snapshotRelic: currentRelic
        })
      }
    }
  } catch (err) {
    logger.error('Failed to refill all flash events', err)
  }
}

export const clearAllFlashEvents = () => {
  _userFlashEvents.forEach((event, userId) => {
    if (event.isFestival) {
      _userFlashEvents.delete(userId)
    }
  })
}

export const getRandomFlashType = (): {
  type: FlashEventType
  multiplier: number
} => {
  const activeTypes = Object.keys(FLASH_EVENT_CONFIG) as FlashEventType[]
  const type = pickWeightedFlashEvent(activeTypes, null)
  return { type, multiplier: FLASH_EVENT_CONFIG[type].multiplier }
}

export const tryTriggerFlashEventForUser = async (
  userId: string,
  broadcast: (event: string, data: string) => void,
  equippedRelic?: string | null
): Promise<void> => {
  if (!FLASH_EVENTS_ENABLED) return

  const currentEvent = _userFlashEvents.get(userId)
  if (currentEvent && !currentEvent.isFestival) return

  const { rows } = await pool.query(
    'SELECT nickname, first_flash_triggered FROM users WHERE user_id = $1',
    [userId]
  )
  const nickname = rows[0]?.nickname ?? 'Anonymous'
  const isFirstFlash = !rows[0]?.first_flash_triggered

  let chance = isFirstFlash ? 0.2 : FLASH_TRIGGER_CHANCE
  if (!isFirstFlash && equippedRelic === 'cobalt_core') {
    chance += 0.15
  }

  if (Math.random() > chance) return

  const activeTypes = Object.keys(FLASH_EVENT_CONFIG) as FlashEventType[]
  const type = pickWeightedFlashEvent(activeTypes, equippedRelic)
  const config = FLASH_EVENT_CONFIG[type]
  const betsRemaining = equippedRelic === 'temporal_anchor' ? 4 : 3

  const event: FlashEventState = {
    type,
    multiplier: config.multiplier,
    betsRemaining,
    triggeredAt: Date.now(),
    snapshotRelic: equippedRelic || null
  }

  _userFlashEvents.set(userId, event)
  if (isFirstFlash) {
    await pool.query(
      'UPDATE users SET first_flash_triggered = true WHERE user_id = $1',
      [userId]
    )
  }

  logger.info('Flash event triggered', {
    nickname,
    userId,
    type,
  })

  broadcast(
    'flash_event',
    JSON.stringify({
      userId,
      type,
      multiplier: event.multiplier,
      betsRemaining
    })
  )
}
