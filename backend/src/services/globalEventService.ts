export type GlobalEventType =
  | 'TIDAL_SURGE'
  | 'SOLAR_FLARE'
  | 'CYCLONE_BLITZ'
  | 'MIRAGE_CATACLYSM'

export type GlobalEventPhase = 'warning' | 'active'

export interface GlobalEventState {
  type: GlobalEventType
  phase: GlobalEventPhase
  startedAt: number
  activeAt: number
  endsAt: number
  triggeredAt: number
}

type Broadcast = (event: string, data: string) => void

// Cooldown between events: 7–12 min
const COOLDOWN_MIN_MS = 7 * 60 * 1000
const COOLDOWN_MAX_MS = 12 * 60 * 1000

// Warning phase before active: 1.5-3 min (pick once per event)
const WARNING_MIN_MS = 90 * 1000
const WARNING_MAX_MS = 180 * 1000

// Active blitz window: 1.0-3 min
const ACTIVE_MIN_MS = 1 * 60 * 1000
const ACTIVE_MAX_MS = 3 * 60 * 1000

const EVENT_WEIGHTS: { type: GlobalEventType; weight: number }[] = [
  { type: 'TIDAL_SURGE', weight: 30 },
  { type: 'CYCLONE_BLITZ', weight: 25 },
  { type: 'SOLAR_FLARE', weight: 20 },
  { type: 'MIRAGE_CATACLYSM', weight: 20 }
]

const ORACLE_WARNING_MESSAGES: Record<GlobalEventType, string[]> = {
  TIDAL_SURGE: [
    'Oracle detects anomalous pressure buildup. Tidal Surge imminent.',
    'Hydro-telemetry destabilizing. Tidal Surge convergence detected.',
    'Deep current alignment confirmed. Tidal Surge approaching activation.'
  ],
  SOLAR_FLARE: [
    'Solar thermal index critical. Solar Flare event window opening.',
    'Plasma convergence imminent. Solar Flare approach vector locked.',
    'Thermal cascade initiated. Solar Flare activation sequence armed.'
  ],
  CYCLONE_BLITZ: [
    'Atmospheric pressure vortex forming. Cyclone Blitz inbound.',
    'Kinetic wind vectors spiking. Cyclone Blitz trajectory confirmed.',
    'Rotational field instability detected. Cyclone Blitz sequence active.'
  ],
  MIRAGE_CATACLYSM: [
    'Desert thermal distortion rising. Mirage Cataclysm materializing.',
    'Phantom lattice destabilizing. Mirage Cataclysm emergence imminent.',
    'Illusory field collapse detected. Mirage Cataclysm sequence initiated.'
  ]
}

const ORACLE_WARNING_SPEECH: Record<GlobalEventType, string[]> = {
  TIDAL_SURGE: [
    'Pressure... anomaly... detected. Tidal... Surge... approaches.',
    'The deep... currents... converge. Tidal... Surge... imminent.',
    'Hydro... telemetry... destabilizing. Brace... for... impact.'
  ],
  SOLAR_FLARE: [
    'Thermal... index... critical. Solar... Flare... inbound.',
    'Plasma... convergence... locked. Solar... Flare... arming.',
    'The sun... fractures. Solar... Flare... sequence... initiated.'
  ],
  CYCLONE_BLITZ: [
    'Vortex... field... detected. Cyclone... Blitz... approaching.',
    'Kinetic... winds... rising. Cyclone... Blitz... trajectory... confirmed.',
    'The atmosphere... tears. Cyclone... Blitz... inbound.'
  ],
  MIRAGE_CATACLYSM: [
    'Desert... thermal... ascending. Mirage... Cataclysm... materializing.',
    'The phantom... lattice... destabilizes. Mirage... Cataclysm... emerges.',
    'Illusory... fields... collapse. Mirage... Cataclysm... sequence... active.'
  ]
}

const ORACLE_COUNTDOWN_SPEECH: Record<
  GlobalEventType,
  (label: string) => string
> = {
  TIDAL_SURGE: (t) => `Tidal... Surge... in... ${t}.`,
  SOLAR_FLARE: (t) => `Solar... Flare... strikes... in... ${t}.`,
  CYCLONE_BLITZ: (t) => `Cyclone... Blitz... descends... in... ${t}.`,
  MIRAGE_CATACLYSM: (t) => `The Mirage... awakens... in... ${t}.`
}

export const buildGlobalEventCountdownSpeech = (
  type: GlobalEventType,
  msRemaining: number
): string => {
  const seconds = Math.round(msRemaining / 1000)
  const label =
    seconds >= 90
      ? `${Math.round(seconds / 60)}... minutes`
      : `${seconds}... seconds`
  return ORACLE_COUNTDOWN_SPEECH[type](label)
}


let _activeGlobalEvent: GlobalEventState | null = null
let _schedulerStarted = false
let _phaseTimer: ReturnType<typeof setTimeout> | null = null

const pickEvent = (): GlobalEventType => {
  const total = EVENT_WEIGHTS.reduce((s, e) => s + e.weight, 0)
  let roll = Math.random() * total
  for (const e of EVENT_WEIGHTS) {
    roll -= e.weight
    if (roll <= 0) return e.type
  }
  return EVENT_WEIGHTS[EVENT_WEIGHTS.length - 1]!.type
}

const randBetween = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max - min))

const randomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]!

export const getActiveGlobalEvent = (): GlobalEventState | null => {
  if (!_activeGlobalEvent) return null
  if (Date.now() > _activeGlobalEvent.endsAt) {
    _activeGlobalEvent = null
    return null
  }
  return _activeGlobalEvent
}

export const getGlobalEventState = () => {
  const event = getActiveGlobalEvent()
  return {
    event: event
      ? {
          type: event.type,
          phase: event.phase,
          activeAt: event.activeAt,
          endsAt: event.endsAt,
          startedAt: event.startedAt
        }
      : null
  }
}

const launchEvent = (broadcast: Broadcast): void => {
  const type = pickEvent()
  const now = Date.now()
  const warningDuration = randBetween(WARNING_MIN_MS, WARNING_MAX_MS)
  const activeDuration = randBetween(ACTIVE_MIN_MS, ACTIVE_MAX_MS)
  const activeAt = now + warningDuration
  const endsAt = activeAt + activeDuration

  _activeGlobalEvent = {
    type,
    phase: 'warning',
    startedAt: now,
    activeAt,
    endsAt,
    triggeredAt: now
  }

  const warningMsg = randomItem(ORACLE_WARNING_MESSAGES[type])


  // Broadcast warning phase, clients show countdown to activeAt
    const warningSpeech = randomItem(ORACLE_WARNING_SPEECH[type])

    broadcast(
      'global_event_warning',
      JSON.stringify({
        type,
        phase: 'warning',
        startedAt: now,
        activeAt,
        endsAt,
        message: warningMsg,
        speech: warningSpeech
      })
    )

  // Transition to active phase
  if (_phaseTimer) clearTimeout(_phaseTimer)
  _phaseTimer = setTimeout(() => {
    if (!_activeGlobalEvent || _activeGlobalEvent.type !== type) return
    _activeGlobalEvent.phase = 'active'

    broadcast(
      'global_event_start',
      JSON.stringify({
        type,
        phase: 'active',
        startedAt: _activeGlobalEvent.startedAt,
        activeAt,
        endsAt
      })
    )

    const endTimer = setTimeout(() => {
      if (_activeGlobalEvent?.type === type) {
        _activeGlobalEvent = null
        broadcast('global_event_end', JSON.stringify({ type }))
      }
    }, activeDuration)

    _phaseTimer = endTimer
  }, warningDuration)
}

const scheduleNext = (broadcast: Broadcast): void => {
  const cooldown = randBetween(COOLDOWN_MIN_MS, COOLDOWN_MAX_MS)

  setTimeout(() => {
    launchEvent(broadcast)

    // After warning + active finishes, schedule the next cooldown
    // Max possible event duration: WARNING_MAX + ACTIVE_MAX
    const maxEventDuration = WARNING_MAX_MS + ACTIVE_MAX_MS
    setTimeout(() => scheduleNext(broadcast), maxEventDuration + 5000)
  }, cooldown)
}

export const startGlobalEventScheduler = (broadcast: Broadcast): void => {
  if (_schedulerStarted) return
  _schedulerStarted = true
  scheduleNext(broadcast)
}

export interface GlobalEventBuffResult {
  gainLossMultiplied: bigint
  echoAmount: bigint
  buffType: GlobalEventType | null
  echoFactor?: number
}

/**
 * Apply the active global event buff to a resolved win amount.
 * Only called on WIN outcomes. Returns the modified gainLoss and echo amount.
 */
export const applyGlobalEventBuff = (
  isWin: boolean,
  gainLoss: bigint,
  bet: bigint
): GlobalEventBuffResult => {
  const event = getActiveGlobalEvent()

  if (!event || event.phase !== 'active' || !isWin) {
    return { gainLossMultiplied: gainLoss, echoAmount: 0n, buffType: null }
  }

  switch (event.type) {
    case 'TIDAL_SURGE': {
      // +20% echo
      const echo = gainLoss / 5n
      return {
        gainLossMultiplied: gainLoss + echo,
        echoAmount: echo,
        buffType: 'TIDAL_SURGE'
      }
    }

    case 'SOLAR_FLARE': {
      // 2x win multiplier handled in predictionService
      return {
        gainLossMultiplied: gainLoss,
        echoAmount: 0n,
        buffType: 'SOLAR_FLARE'
      }
    }

    case 'CYCLONE_BLITZ': {
      // streak + 1 is handled in predictionService streak logic
      // No point modification here
      return {
        gainLossMultiplied: gainLoss,
        echoAmount: 0n,
        buffType: 'CYCLONE_BLITZ'
      }
    }

    case 'MIRAGE_CATACLYSM': {
      // Variable echo: 15%-50% of gainLoss
      const factor = 15 + Math.floor(Math.random() * 36) // 15..50
      const echo = (gainLoss * BigInt(factor)) / 100n
      return {
        gainLossMultiplied: gainLoss + echo,
        echoAmount: echo,
        buffType: 'MIRAGE_CATACLYSM',
        echoFactor: factor
      }
    }

    default:
      return { gainLossMultiplied: gainLoss, echoAmount: 0n, buffType: null }
  }
}
