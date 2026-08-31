import type { FestivalType } from '../types/festivals.js'

export const FESTIVALS_ENABLED = true

export const FESTIVAL_DURATIONS_MS: Record<FestivalType, number | null> = {
  SPARK: 45_000,
  GHOST: 60_000,
  SAFEGUARD: 60_000,
  RESONANCE: 40_000,
  SURGE: 30_000,
  VAULT: 120_000,
  FEVER: 30_000,
  SANGUINE: 15_000
}

export const LOCKOUT_MS = 5 * 60 * 1000
export const DEMO_FESTIVAL_MIN_MS = 18 * 60 * 1000
export const DEMO_FESTIVAL_MAX_MS = 24 * 60 * 1000
export const PLAYER_FESTIVAL_QUIET_MS = 10 * 60 * 1000

export const PLAYER_TRIGGER_PREFIXES = [
  '{user} has initiated the',
  '{user} has activated the',
  '{user} has triggered the',
  '{user} has stabilized the',
  '{user} has forced the',
  '{user} has synchronized the'
]

export const ORACLE_TRIGGER_PREFIXES = [
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

export const DEMO_FESTIVAL_WEIGHTS: { type: FestivalType; weight: number }[] = [
  { type: 'RESONANCE', weight: 28 },
  { type: 'SPARK', weight: 24 },
  { type: 'FEVER', weight: 18 },
  { type: 'GHOST', weight: 14 },
  { type: 'SAFEGUARD', weight: 8 },
  { type: 'VAULT', weight: 5 },
  { type: 'SURGE', weight: 2 },
  { type: 'SANGUINE', weight: 1 }
]
