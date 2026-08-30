import type { FlashEventType } from '../types/flashEvents.js';

export const FLASH_EVENTS_ENABLED = true
export const FLASH_TRIGGER_CHANCE = 0.05

export const FLASH_EVENT_CONFIG: Record<
  FlashEventType,
  { multiplier: number; weight: number }
> = {
  LUNAR: { multiplier: 3, weight: 1.0 },
  ELECTRIC: { multiplier: 3, weight: 1.0 },
  CARDS: { multiplier: 1.5, weight: 1.0 },
  HELLFIRE: { multiplier: 3, weight: 1.0 }
}

export const SIPHON_MAP: Record<string, FlashEventType> = {
  lunar_siphon: 'LUNAR',
  static_inductor: 'ELECTRIC',
  dealers_hand: 'CARDS',
  volcanic_mantle: 'HELLFIRE'
}
