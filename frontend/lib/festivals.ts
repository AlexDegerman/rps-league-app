import { FestivalModeKey } from '@/types/rps'

export const FESTIVAL_REGISTRY: Record<
  FestivalModeKey,
  { color: string; effectText: string }
> = {
  festival_spark: {
    color: '#a855f7',
    effectText: 'FLASH PROTOCOL SYNCED - ACTIVATED FLASH EVENT OR REFILLED FLASH BETS'
  },
  festival_ghost: {
    color: '#4dd0c4',
    effectText: 'WIN ECHO ACTIVE - +20% SIGNAL PAYOUT BONUS'
  },
  festival_safeguard: {
    color: '#94a3b8',
    effectText: 'RISK SHIELD ACTIVE - LOSSES DEDUCT 40% INSTEAD OF 50%'
  },
  festival_resonance: {
    color: '#ecc94b',
    effectText: 'BONUS FLOOR ACTIVE - 100% COMMON OR RARE BONUS'
  },
  festival_surge: {
    color: '#22d3ee',
    effectText: 'POWER SURGE ACTIVE - GLOBAL 3X WIN MULTIPLIER'
  },
  festival_vault: {
    color: '#748ffc',
    effectText: 'LOOT ECHO ACTIVE - 2X RELIC DISCOVERY RATE'
  },
  festival_fever: {
    color: '#f97316',
    effectText: 'STREAK AEGIS ACTIVE - LOSSES DO NOT RESET WIN STREAKS'
  },
  festival_sanguine: {
    color: '#991b1b',
    effectText: 'ABSOLUTE CORRECTION - 100% WIN PROBABILITY MANDATORY'
  }
}
