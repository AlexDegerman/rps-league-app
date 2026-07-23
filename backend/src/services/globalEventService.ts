import { isWorldBossActive, isWorldBossBlocking } from "./worldBossService.js"

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

const COOLDOWN_MIN_MS = 10 * 60 * 1000
const COOLDOWN_MAX_MS = 12 * 60 * 1000
const WARNING_DURATION_MS = 30 * 1000
const ACTIVE_DURATION_MS = 60 * 1000
const QUIET_DURATION_MS = 60 * 1000

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

let _activeGlobalEvent: GlobalEventState | null = null
let _schedulerStarted = false
let _phaseTimer: ReturnType<typeof setTimeout> | null = null
let _globalPausedAt: number | null = null
let _inGlobalQuietPeriod = false
let _broadcastRef: Broadcast | null = null

export const isGlobalEventBlocking = (): boolean => {
  return getActiveGlobalEvent() !== null || _inGlobalQuietPeriod
}

export const pauseGlobalEvent = (): void => {
  if (!_activeGlobalEvent) return
  _globalPausedAt = Date.now()
  if (_phaseTimer) {
    clearTimeout(_phaseTimer)
    _phaseTimer = null
  }
}

export const resumeGlobalEvent = (): void => {
  if (_globalPausedAt === null || !_activeGlobalEvent) return
  const pausedDuration = Date.now() - _globalPausedAt
  _globalPausedAt = null

  _activeGlobalEvent.endsAt += pausedDuration
  if (_activeGlobalEvent.phase === 'warning') {
    _activeGlobalEvent.activeAt += pausedDuration
  }

  if (!_broadcastRef) return

  const now = Date.now()

  if (_activeGlobalEvent.phase === 'warning') {
    _broadcastRef(
      'global_event_warning',
      JSON.stringify({
        type: _activeGlobalEvent.type,
        phase: 'warning',
        startedAt: _activeGlobalEvent.startedAt,
        activeAt: _activeGlobalEvent.activeAt,
        endsAt: _activeGlobalEvent.endsAt,
        message: `Global event warning resumed: ${_activeGlobalEvent.type}`,
        speech: `The... ${_activeGlobalEvent.type}... event... warning... resumes.`
      })
    )
  } else if (_activeGlobalEvent.phase === 'active') {
    _broadcastRef(
      'global_event_start',
      JSON.stringify({
        type: _activeGlobalEvent.type,
        phase: 'active',
        startedAt: _activeGlobalEvent.startedAt,
        activeAt: _activeGlobalEvent.activeAt,
        endsAt: _activeGlobalEvent.endsAt
      })
    )
  }

  if (_activeGlobalEvent.phase === 'warning') {
    const remainingWarning = Math.max(0, _activeGlobalEvent.activeAt - now)
    _phaseTimer = setTimeout(() => {
      transitionToActive(_broadcastRef!)
    }, remainingWarning)
  } else if (_activeGlobalEvent.phase === 'active') {
    const remainingActive = Math.max(0, _activeGlobalEvent.endsAt - now)
    _phaseTimer = setTimeout(() => {
      transitionToEnd(_broadcastRef!)
    }, remainingActive)
  }
}

const transitionToActive = (broadcast: Broadcast): void => {
  if (!_activeGlobalEvent) return
  _activeGlobalEvent.phase = 'active'
  const type = _activeGlobalEvent.type

  broadcast(
    'global_event_start',
    JSON.stringify({
      type,
      phase: 'active',
      startedAt: _activeGlobalEvent.startedAt,
      activeAt: _activeGlobalEvent.activeAt,
      endsAt: _activeGlobalEvent.endsAt
    })
  )

  const remainingActive = Math.max(0, _activeGlobalEvent.endsAt - Date.now())
  _phaseTimer = setTimeout(() => {
    transitionToEnd(broadcast)
  }, remainingActive)
}

const transitionToEnd = (broadcast: Broadcast): void => {
  if (!_activeGlobalEvent) return
  const type = _activeGlobalEvent.type
  _activeGlobalEvent = null
  broadcast('global_event_end', JSON.stringify({ type }))

  _inGlobalQuietPeriod = true
  setTimeout(() => {
    _inGlobalQuietPeriod = false
    scheduleNext(broadcast)
  }, QUIET_DURATION_MS)
}

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
  if (isWorldBossActive()) return null
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

const tryLaunchEvent = (broadcast: Broadcast): void => {
  if (isWorldBossBlocking()) {
    setTimeout(() => tryLaunchEvent(broadcast), 5000)
    return
  }
  launchEvent(broadcast)
}

const launchEvent = (broadcast: Broadcast): void => {
  const type = pickEvent()
  const now = Date.now()
  const activeAt = now + WARNING_DURATION_MS
  const endsAt = activeAt + ACTIVE_DURATION_MS

  _activeGlobalEvent = {
    type,
    phase: 'warning',
    startedAt: now,
    activeAt,
    endsAt,
    triggeredAt: now
  }

  const warningMsg = randomItem(ORACLE_WARNING_MESSAGES[type])
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

  if (_phaseTimer) clearTimeout(_phaseTimer)
  _phaseTimer = setTimeout(() => {
    transitionToActive(broadcast)
  }, WARNING_DURATION_MS)
}

const scheduleNext = (broadcast: Broadcast): void => {
  const cooldown = randBetween(COOLDOWN_MIN_MS, COOLDOWN_MAX_MS)
  setTimeout(() => {
    tryLaunchEvent(broadcast)
  }, cooldown)
}

export const startGlobalEventScheduler = (broadcast: Broadcast): void => {
  _broadcastRef = broadcast
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
