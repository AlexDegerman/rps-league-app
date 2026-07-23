import { FestivalModeKey, FestivalType } from '@/types/rps'

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
    effectText: 'POWER SURGE ACTIVE - GLOBAL 2X WIN MULTIPLIER'
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

export const getFestivalEffectDescription = (type: FestivalType): string => {
  const descriptions: Record<FestivalType, string> = {
    SPARK:
      'Universal synchronization achieved. All flash event state buffers restored.',
    GHOST:
      'Win Echo active. Successful predictions generate a 20% signal echo.',
    SAFEGUARD:
      'Risk Shield active. Prediction losses deduct 40% instead of 50%.',
    RESONANCE:
      'Bonus floor stabilized. Common and Rare bonuses are designated as mandatory.',
    SURGE: 'Power Surge active. Successful predictions are multiplied by 3x.',
    VAULT: 'Loot Echo active. Relic discovery rates are boosted by 100%.',
    FEVER:
      'Streak Aegis active. Prediction failures will not break active win streaks.',
    SANGUINE:
      'Absolute Correction active. All incoming predictions resolve as wins.'
  }
  return descriptions[type]
}
