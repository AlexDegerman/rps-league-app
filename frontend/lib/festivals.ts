import { FestivalType } from "@/types/events";

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
