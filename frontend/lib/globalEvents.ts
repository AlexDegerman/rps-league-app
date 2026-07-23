import { GlobalEventModeKey, GlobalEventType } from '@/types/rps'

export const GLOBAL_EVENT_REGISTRY: Record<
  GlobalEventModeKey,
  { color: string; effectText: string; label: string }
> = {
  global_tidal_surge: {
    color: '#22d3ee',
    label: 'TIDAL SURGE',
    effectText:
      'TIDAL SURGE ACTIVE - WIN ECHO PROTOCOL ONLINE - +20% SIGNAL PAYOUT INJECTED'
  },
  global_solar_flare: {
    color: '#f59e0b',
    label: 'SOLAR FLARE',
    effectText:
      'SOLAR FLARE ACTIVE - THERMAL MULTIPLIER LOCKED - ALL WIN PAYOUTS 2x'
  },
  global_cyclone_blitz: {
    color: '#94a3b8',
    label: 'CYCLONE BLITZ',
    effectText:
      'CYCLONE BLITZ ACTIVE - STREAK TURBOCURRENT ENGAGED - WIN STREAK ADVANCES BY +1'
  },
  global_mirage_cataclysm: {
    color: '#d97706',
    label: 'MIRAGE CATACLYSM',
    effectText:
      'MIRAGE CATACLYSM ACTIVE - VARIABLE ECHO FIELD ONLINE - 15-50% PHANTOM PAYOUT INJECTED'
  }
}

export const GLOBAL_EVENT_MODE_MAP: Record<
  GlobalEventType,
  GlobalEventModeKey
> = {
  TIDAL_SURGE: 'global_tidal_surge',
  SOLAR_FLARE: 'global_solar_flare',
  CYCLONE_BLITZ: 'global_cyclone_blitz',
  MIRAGE_CATACLYSM: 'global_mirage_cataclysm'
}

export const GLOBAL_EVENT_CONFETTI_COLORS: Record<GlobalEventType, string[]> = {
  TIDAL_SURGE: ['#22d3ee', '#a5f3fc', '#ffffff', '#0891b2', '#cffafe'],
  SOLAR_FLARE: ['#f59e0b', '#fbbf24', '#fff7ed', '#d97706', '#fef3c7'],
  CYCLONE_BLITZ: ['#94a3b8', '#10b981', '#e2e8f0', '#64748b', '#6ee7b7'],
  MIRAGE_CATACLYSM: ['#d97706', '#a855f7', '#fde68a', '#7c3aed', '#fef3c7']
}