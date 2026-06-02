import pool from '../utils/db.js'
import { logger } from '../utils/logger.js'

export type FlashEventType = 'LUNAR' | 'ELECTRIC' | 'CARDS' | 'HELLFIRE'

export interface FlashEventState {
  type: FlashEventType
  multiplier: number
  betsRemaining: number
  triggeredAt: number
  expiresAt?: number | undefined
  isFestival?: boolean
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

// Weighted random pick, avoids uniform distribution when weights differ
const pickWeightedFlashEvent = (types: FlashEventType[]): FlashEventType => {
  const totalWeight = types.reduce(
    (sum, t) => sum + (FLASH_EVENT_CONFIG[t]?.weight ?? 1),
    0
  )
  let roll = Math.random() * totalWeight
  for (const t of types) {
    roll -= FLASH_EVENT_CONFIG[t]?.weight ?? 1
    if (roll <= 0) return t
  }
  return types[types.length - 1]!
}

const _userFlashEvents = new Map<string, FlashEventState>()

export const getFlashEventForUser = (
  userId: string
): FlashEventState | null => {
  const event = _userFlashEvents.get(userId)
  if (!event) return null

  if (event.expiresAt && Date.now() > event.expiresAt) {
    _userFlashEvents.delete(userId)
    return null
  }

  return event
}

export const consumeFlashBetForUser = (userId: string): boolean => {
  const event = _userFlashEvents.get(userId)
  if (!event) return false

  // Check if it expired while waiting for match resolution
  if (event.expiresAt && Date.now() > event.expiresAt) {
    _userFlashEvents.delete(userId)
    return true
  }

  event.betsRemaining = Math.max(0, event.betsRemaining - 1)

  if (event.betsRemaining <= 0) {
    _userFlashEvents.delete(userId)
    return true // Event just ended
  }

  return false
}

export const refillAllFlashEvents = async (defaultType: FlashEventType) => {
  const expiry = Date.now() + 45000
  _userFlashEvents.forEach((current, userId) => {
    if (current.isFestival) {
      _userFlashEvents.set(userId, {
        ...current,
        betsRemaining: 3,
        expiresAt: expiry
      })
    }
  })

  try {
    const { rows } = await pool.query('SELECT user_id FROM users')
    for (const row of rows) {
      if (!_userFlashEvents.has(row.user_id)) {
        _userFlashEvents.set(row.user_id, {
          type: defaultType,
          betsRemaining: 3,
          multiplier: FLASH_EVENT_CONFIG[defaultType]?.multiplier ?? 3,
          triggeredAt: Date.now(),
          expiresAt: expiry,
          isFestival: true
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

export const grantFlashEvent = (
  userId: string,
  type: string,
  bets: number,
  isTimed: boolean
) => {
  const t = type as FlashEventType
  const config = FLASH_EVENT_CONFIG[t]

  const newState: FlashEventState = {
    type: t,
    betsRemaining: bets,
    multiplier: config?.multiplier ?? 3,
    triggeredAt: Date.now()
  }

  if (isTimed) {
    newState.expiresAt = Date.now() + 45000
  }

  _userFlashEvents.set(userId, newState)
}

export const getRandomFlashType = (): {
  type: FlashEventType
  multiplier: number
} => {
  const activeTypes = Object.keys(FLASH_EVENT_CONFIG) as FlashEventType[]
  const type = pickWeightedFlashEvent(activeTypes)
  return { type, multiplier: FLASH_EVENT_CONFIG[type]!.multiplier }
}

export const tryTriggerFlashEventForUser = async (
  userId: string,
  broadcast: (event: string, data: string) => void
): Promise<void> => {
  if (!FLASH_EVENTS_ENABLED) return

  const currentEvent = _userFlashEvents.get(userId)
  if (currentEvent && !currentEvent.isFestival) return

  const { rows } = await pool.query(
    'SELECT first_flash_triggered FROM users WHERE user_id = $1',
    [userId]
  )
  // New players get 20% chance on their first ever flash event
  const isFirstFlash = !rows[0]?.first_flash_triggered
  const chance = isFirstFlash ? 0.2 : FLASH_TRIGGER_CHANCE

  if (Math.random() > chance) return

  const activeTypes = Object.keys(FLASH_EVENT_CONFIG) as FlashEventType[]
  if (activeTypes.length === 0) return

  const type = pickWeightedFlashEvent(activeTypes)
  const config = FLASH_EVENT_CONFIG[type]!

  const event: FlashEventState = {
    type,
    multiplier: config.multiplier,
    betsRemaining: 3,
    triggeredAt: Date.now()
  }

  _userFlashEvents.set(userId, event)

  // Mark first flash as used so normal rate applies from here on
  if (isFirstFlash) {
    await pool.query(
      'UPDATE users SET first_flash_triggered = true WHERE user_id = $1',
      [userId]
    )
  }
  // Broadcast only to the specific user - the userId in the payload
  // means the frontend filters it client-side (only acts if data.userId === myId)
  broadcast(
    'flash_event',
    JSON.stringify({
      userId,
      type,
      multiplier: event.multiplier,
      betsRemaining: 3
    })
  )
}