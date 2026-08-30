import type { GlobalEventType } from '../types/globalEvents.js'

export const ENABLE_GLOBAL_EVENTS = true

export const GLOBAL_EVENT_COOLDOWN_MIN_MS = 10 * 60 * 1000
export const GLOBAL_EVENT_COOLDOWN_MAX_MS = 12 * 60 * 1000
export const GLOBAL_EVENT_WARNING_DURATION_MS = 30 * 1000
export const GLOBAL_EVENT_ACTIVE_DURATION_MS = 60 * 1000
export const GLOBAL_EVENT_QUIET_DURATION_MS = 60 * 1000

export const EVENT_WEIGHTS: { type: GlobalEventType; weight: number }[] = [
  { type: 'TIDAL_SURGE', weight: 30 },
  { type: 'CYCLONE_BLITZ', weight: 25 },
  { type: 'SOLAR_FLARE', weight: 20 },
  { type: 'MIRAGE_CATACLYSM', weight: 20 }
]

export const ORACLE_WARNING_MESSAGES: Record<GlobalEventType, string[]> = {
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

export const ORACLE_WARNING_SPEECH: Record<GlobalEventType, string[]> = {
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

export const GLOBAL_DURATIONS: Record<GlobalEventType, number> = {
  TIDAL_SURGE: 180000,
  SOLAR_FLARE: 120000,
  CYCLONE_BLITZ: 150000,
  MIRAGE_CATACLYSM: 180000
}
