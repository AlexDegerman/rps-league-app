export type FlashEventType = 'LUNAR' | 'ELECTRIC' | 'CARDS' | 'HELLFIRE'

export interface FlashEventState {
  type: FlashEventType
  multiplier: number
  betsRemaining: number
  triggeredAt: number
}

const FLASH_EVENTS_ENABLED = false // TOGGLE TRUE ON WEEK 4
const FLASH_TRIGGER_CHANCE = 0.05


const FLASH_EVENT_CONFIG: Partial<
  Record<FlashEventType, { multiplier: number }>
> = {
  // LUNAR: { multiplier: 5 }, // REMOVE ON WEEK 4
  // ELECTRIC: { multiplier: 5 }, // REMOVE ON WEEK 5
  // CARDS: { multiplier: 1 }, // REMOVE ON WEEK 6
  //  HELLFIRE: { multiplier: 5 } // REMOVE ON WEEK 7
}

// Per-user flash event state — keyed by userId
const _userFlashEvents = new Map<string, FlashEventState>()

export const getFlashEventForUser = (userId: string): FlashEventState | null =>
  _userFlashEvents.get(userId) ?? null

export const consumeFlashBetForUser = (userId: string): boolean => {
  const event = _userFlashEvents.get(userId)
  if (!event) return false
  event.betsRemaining = Math.max(0, event.betsRemaining - 1)
  if (event.betsRemaining <= 0) {
    _userFlashEvents.delete(userId)
    return true // event just ended
  }
  return false
}

// Called after each individual user's bet resolves
// Only triggers if user doesn't already have an active flash event
export const tryTriggerFlashEventForUser = (
  userId: string,
  broadcast: (event: string, data: string) => void
): void => {
  if (!FLASH_EVENTS_ENABLED) return
  if (_userFlashEvents.has(userId)) return // already has active event
  if (Math.random() > FLASH_TRIGGER_CHANCE) return

  const activeTypes = Object.keys(FLASH_EVENT_CONFIG) as FlashEventType[]


  if (activeTypes.length === 0) return

  const type = activeTypes[Math.floor(Math.random() * activeTypes.length)]!
  const config = FLASH_EVENT_CONFIG[type]!

  const event: FlashEventState = {
    type,
    multiplier: config.multiplier,
    betsRemaining: 3,
    triggeredAt: Date.now()
  }

  _userFlashEvents.set(userId, event)

  // Broadcast only to the specific user — the userId in the payload
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
